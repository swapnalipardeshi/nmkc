const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
const applicationForm = document.getElementById("applicationForm");
const formMessage = document.getElementById("formMessage");

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

applicationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  formMessage.hidden = true;
  formMessage.className = "form-message";

  if (!applicationForm.reportValidity()) return;

  const formData = new FormData(applicationForm);
  const application = {
    applicationId: "NMKC-" + Date.now().toString().slice(-8),
    submittedAt: new Date().toLocaleString(),
    fullName: formData.get("fullName").trim(),
    contact: formData.get("contact").trim(),
    email: formData.get("email").trim(),
    education: formData.get("education").trim(),
    subject: formData.get("subject"),
    position: formData.get("position"),
    experience: formData.get("experience").trim()
  };

  try {
    const saved = JSON.parse(localStorage.getItem("nmkcApplications") || "[]");
    saved.push(application);
    localStorage.setItem("nmkcApplications", JSON.stringify(saved));

    formMessage.classList.add("success");
    formMessage.innerHTML = `<strong>Application details prepared!</strong><br>
      Reference ID: <strong>${escapeHtml(application.applicationId)}</strong><br>
      Your details have been saved in this browser only. This is not an official submission to the college. Please email or contact the institution to confirm the application process.`;
    formMessage.hidden = false;
    applicationForm.reset();
    formMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    formMessage.classList.add("error");
    formMessage.textContent = "Your browser could not save this application. Please note your details and contact the college directly.";
    formMessage.hidden = false;
  }
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}
