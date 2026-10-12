const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
const applicationForm = document.getElementById("applicationForm");
const formMessage = document.getElementById("formMessage");
const submitButton = applicationForm ? applicationForm.querySelector('button[type="submit"]') : null;
const resumeLinkInput = document.getElementById("resumeLink");
const originalSubmitButtonContent = submitButton ? submitButton.innerHTML : "Send application";

const EMAILJS_CONFIG = {
  publicKey: "PnfR_iJ3cNQnKXMdq",
  serviceId: "service_mte6ity",
  templateId: "template_66mfj2o"
};
const EMAILJS_REQUEST_TIMEOUT_MS = 30000;

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
      resumeLinkInput.setCustomValidity("Paste a valid Google Drive file link, or leave this optional field empty.");
      resumeLinkInput.reportValidity();
      return;
    }
    resumeLinkInput?.setCustomValidity("");

    if (!window.emailjs) {
      showFormMessage("error", "The email service could not load. Check your internet connection and reload the page.");
      return;
    }

    const applicationId = `NMKC-${Date.now().toString().slice(-8)}`;
    applicationForm.elements.application_id.value = applicationId;
    applicationForm.elements.submitted_at.value = new Date().toLocaleString();
    applicationForm.elements.resume_url.value = resumeLink;

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending application...";
    }
    showFormMessage("pending", "Sending your application to the recruitment team. Please wait.");

    let timeoutId;
    try {
      const emailRequest = window.emailjs.sendForm(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        applicationForm,
        { publicKey: EMAILJS_CONFIG.publicKey }
      );
      const timeoutRequest = new Promise((resolve, reject) => {
        timeoutId = window.setTimeout(
          () => reject(new Error("EMAILJS_REQUEST_TIMEOUT")),
          EMAILJS_REQUEST_TIMEOUT_MS
        );
      });
      await Promise.race([emailRequest, timeoutRequest]);

      showFormMessage(
        "success",
        `Your application was emailed successfully. Reference ID: ${applicationId}.`
      );
      applicationForm.reset();
    } catch (error) {
      console.error("Application email delivery failed:", error);
      const timedOut = error?.message === "EMAILJS_REQUEST_TIMEOUT";
      const errorDetails = String(error?.text || error?.message || "Unknown EmailJS error").slice(0, 240);
      showFormMessage(
        "error",
        timedOut
          ? "Email delivery is unconfirmed. Check EmailJS Email History before trying again to avoid duplicate applications."
          : `We could not send your application. Your entries are still here. EmailJS reported: ${errorDetails}`
      );
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalSubmitButtonContent;
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

function showFormMessage(type, message) {
  if (!formMessage) return;
  formMessage.className = `form-message ${type}`;
  formMessage.textContent = message;
  formMessage.hidden = false;
  formMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
