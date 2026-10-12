const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
const applicationForm = document.getElementById("applicationForm");
const formMessage = document.getElementById("formMessage");
const submitButton = applicationForm.querySelector('button[type="submit"]');
const resumeInput = document.getElementById("resumeInput");
const resumeFileName = document.getElementById("resumeFileName");
const originalSubmitButtonContent = submitButton.innerHTML;

const EMAILJS_CONFIG = {
  publicKey: "PnfR_iJ3cNQnKXMdq",
  serviceId: "service_mte6ity",
  templateId: "template_1w147ny"
};
const EMAILJS_REQUEST_TIMEOUT_MS = 30000;

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

resumeInput.addEventListener("change", () => {
  resumeInput.setCustomValidity("");
  resumeFileName.textContent = resumeInput.files[0]?.name || "No resume selected";
});

applicationForm.addEventListener("reset", () => {
  resumeFileName.textContent = "No resume selected";
});

applicationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formMessage.hidden = true;
  formMessage.className = "form-message";

  if (!applicationForm.reportValidity()) return;

  const resume = resumeInput.files[0];
  if (!/\.(pdf|docx?)$/i.test(resume.name)) {
    resumeInput.setCustomValidity("Upload your resume as a PDF or Word document.");
    resumeInput.reportValidity();
    return;
  }

  if (
    !window.emailjs ||
    Object.values(EMAILJS_CONFIG).some((value) => value.startsWith("YOUR_"))
  ) {
    showFormMessage(
      "error",
      "Email delivery is not configured yet. Please contact the website administrator."
    );
    return;
  }

  const applicationId = "NMKC-" + Date.now().toString().slice(-8);
  applicationForm.elements.application_id.value = applicationId;
  applicationForm.elements.submitted_at.value = new Date().toLocaleString();

  submitButton.disabled = true;
  submitButton.textContent = "Sending application...";

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
      `Your application and resume were emailed successfully. Reference ID: ${applicationId}.`
    );
    applicationForm.reset();
  } catch (error) {
    console.error("EmailJS application delivery failed:", error);
    const timedOut = error?.message === "EMAILJS_REQUEST_TIMEOUT";
    const errorDetails = String(error?.text || error?.message || "Unknown EmailJS error").slice(0, 240);
    showFormMessage(
      "error",
      timedOut
        ? "EmailJS did not respond within 30 seconds, so delivery is unconfirmed. Check EmailJS Email History before trying again to avoid duplicate applications. Your form entries are still here."
        : `We could not send your application. Your entries are still in the form. EmailJS reported: ${errorDetails}`
    );
  } finally {
    window.clearTimeout(timeoutId);
    submitButton.disabled = false;
    submitButton.innerHTML = originalSubmitButtonContent;
  }
});

function showFormMessage(type, message) {
  formMessage.className = `form-message ${type}`;
  formMessage.textContent = message;
  formMessage.hidden = false;
  formMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
