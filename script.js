const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
const applicationForm = document.getElementById("applicationForm");
const formMessage = document.getElementById("formMessage");
const submitButton = applicationForm ? applicationForm.querySelector('button[type="submit"]') : null;
const resumeLinkInput = document.getElementById("resumeLink");
const originalSubmitButtonContent = submitButton ? submitButton.innerHTML : "Send application";
const captchaContainer = document.getElementById("captchaContainer");

const DRIVE_UPLOAD_CONFIG = {
  endpoint: "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL",
  recaptchaSiteKey: "YOUR_RECAPTCHA_SITE_KEY"
};
const UPLOAD_REQUEST_TIMEOUT_MS = 60000;
let captchaWidgetId = null;
let captchaLoadFailed = false;

function isConfigured(value, placeholder) {
  return Boolean(value && !value.startsWith(placeholder));
}

if (
  captchaContainer &&
  isConfigured(DRIVE_UPLOAD_CONFIG.recaptchaSiteKey, "YOUR_")
) {
  window.onRecaptchaApiLoaded = () => {
    captchaWidgetId = window.grecaptcha.render(captchaContainer, {
      sitekey: DRIVE_UPLOAD_CONFIG.recaptchaSiteKey
    });
  };

  const captchaScript = document.createElement("script");
  captchaScript.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaApiLoaded&render=explicit";
  captchaScript.async = true;
  captchaScript.defer = true;
  captchaScript.onerror = () => {
    captchaLoadFailed = true;
  };
  document.head.appendChild(captchaScript);
}

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.textContent = isOpen ? "×" : "☰";
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.textContent = "☰";
    });
  });
}

if (resumeLinkInput) {
  resumeLinkInput.addEventListener("input", () => {
    resumeLinkInput.setCustomValidity("");
  });
}

if (applicationForm) {
  applicationForm.addEventListener("invalid", (event) => {
    const invalidField = event.target;
    const fieldLabel = invalidField instanceof Element ? invalidField.closest("label") : null;
    const fieldName = fieldLabel
      ? fieldLabel.textContent.replace(/\*/g, "").replace(/\s+/g, " ").trim()
      : "a required field";

    showFormMessage(
      "error",
      `Please check ${fieldName}. Complete all required fields and accept the consent checkbox before sending.`
    );
  }, true);

  applicationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (formMessage) {
      formMessage.hidden = true;
      formMessage.className = "form-message";
    }

    if (!applicationForm.reportValidity()) return;

    const resumeLink = resumeLinkInput?.value.trim() || "";
    if (resumeLink && !isValidDriveLink(resumeLink)) {
      resumeLinkInput?.setCustomValidity("Paste a valid Google Drive file link, or leave this optional field empty.");
      resumeLinkInput?.reportValidity();
      return;
    }
    resumeLinkInput?.setCustomValidity("");

    if (
      !isConfigured(DRIVE_UPLOAD_CONFIG.endpoint, "YOUR_") ||
      !isConfigured(DRIVE_UPLOAD_CONFIG.recaptchaSiteKey, "YOUR_")
    ) {
      showFormMessage(
        "error",
        "Application delivery is not configured yet. Please contact the website administrator."
      );
      return;
    }

    if (!window.grecaptcha || captchaWidgetId === null || captchaLoadFailed) {
      showFormMessage(
        "error",
        "Spam protection could not load. Check your internet connection, reload the page, and try again."
      );
      return;
    }

    const captchaToken = window.grecaptcha.getResponse(captchaWidgetId);
    if (!captchaToken) {
      showFormMessage("error", "Complete the spam protection check before submitting.");
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending application...";
    }
    showFormMessage("pending", "Sending your application and resume link. Please keep this page open.");

    let uploadForm;
    let uploadResultWait;
    try {
      const fields = {};
      const formData = new FormData(applicationForm);
      formData.forEach((value, name) => {
        if (name !== "resume" && name !== "consent" && name !== "g-recaptcha-response") {
          fields[name] = String(value);
        }
      });

      const iframe = getUploadResponseFrame();
      const requestId = createRequestId();
      uploadForm = document.createElement("form");
      uploadForm.method = "post";
      uploadForm.action = DRIVE_UPLOAD_CONFIG.endpoint;
      uploadForm.target = iframe.name;
      uploadForm.hidden = true;

      const payload = {
        requestId,
        captchaToken,
        consent: formData.get("consent") === "on",
        fields
      };
      appendHiddenInput(uploadForm, "payload", JSON.stringify(payload));
      appendHiddenInput(uploadForm, "requestId", requestId);
      document.body.appendChild(uploadForm);

      uploadResultWait = waitForUploadResult(iframe, requestId);
      uploadForm.submit();
      const result = await uploadResultWait.promise;

      if (!result.success) {
        throw new Error(result.message || "The application could not be completed.");
      }

      showFormMessage("success", `Your application and resume link were sent to the recruitment team. Reference ID: ${result.referenceId}.`);
      applicationForm.reset();
      if (window.grecaptcha) {
        window.grecaptcha.reset(captchaWidgetId);
      }
    } catch (error) {
      console.error("Google Drive application submission failed:", error);
      showFormMessage("error", error.message || "We could not confirm submission. Please contact the recruitment team before trying again.");
    } finally {
      if (uploadResultWait) {
        uploadResultWait.cancel();
      }
      if (uploadForm) {
        uploadForm.remove();
      }
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalSubmitButtonContent;
      }
      if (window.grecaptcha && captchaWidgetId !== null) {
        window.grecaptcha.reset(captchaWidgetId);
      }
    }
  });
}

function isValidDriveLink(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return false;

    return url.hostname === "drive.google.com" || url.hostname === "docs.google.com";
  } catch {
    return false;
  }
}

function getUploadResponseFrame() {
  let iframe = document.getElementById("uploadResponseFrame");
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = "uploadResponseFrame";
    iframe.name = "uploadResponseFrame";
    iframe.title = "Application upload response";
    iframe.hidden = true;
    document.body.appendChild(iframe);
  }
  return iframe;
}

function appendHiddenInput(form, name, value) {
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = name;
  input.value = value;
  form.appendChild(input);
}

function createRequestId() {
  return window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `nmkc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function waitForUploadResult(iframe, requestId) {
  let settled = false;
  let timeoutId;
  let cleanup;
  const promise = new Promise((resolve, reject) => {
    const onMessage = (event) => {
      if (
        event.source !== iframe.contentWindow ||
        event.data?.type !== "NMKC_APPLICATION_RESULT" ||
        event.data.requestId !== requestId
      ) {
        return;
      }
      settled = true;
      cleanup();
      resolve(event.data);
    };
    const onTimeout = () => {
      settled = true;
      cleanup();
      reject(new Error("Submission status is unconfirmed. Contact the recruitment team before retrying."));
    };
    cleanup = () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("message", onMessage);
    };

    window.addEventListener("message", onMessage);
    timeoutId = window.setTimeout(onTimeout, UPLOAD_REQUEST_TIMEOUT_MS);
  });

  return {
    promise,
    cancel() {
      if (!settled) {
        settled = true;
        cleanup();
      }
    }
  };
}

function showFormMessage(type, message) {
  if (!formMessage) return;

  formMessage.className = `form-message ${type}`;
  formMessage.textContent = message;
  formMessage.hidden = false;
  formMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
