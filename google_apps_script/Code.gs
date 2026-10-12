function doPost(e) {
  const requestId = e && e.parameter ? String(e.parameter.requestId || "") : "";
  if (!e || !e.parameter || !e.parameter.payload) {
    return postResult_(requestId, false, "The submitted application could not be read.");
  }
  let payload;
  try {
    payload = JSON.parse(String(e.parameter.payload || ""));
  } catch (error) {
    console.error("Invalid application upload payload:", error);
    return postResult_(requestId, false, "The submitted application could not be read.");
  }

  if (!payload || !isValidRequestId_(requestId) || payload.requestId !== requestId) {
    return postResult_(requestId, false, "The submission could not be verified. Reload the page and try again.");
  }
  if (payload.consent !== true) {
    return postResult_(requestId, false, "Consent is required before submitting an application.");
  }
  if (payload.honeypot) {
    return postResult_(requestId, false, "The application could not be verified.");
  }

  const scriptProperties = PropertiesService.getScriptProperties();
  let hrEmail;
  let captchaSecret;
  let allowedHostnames;
  try {
    hrEmail = getRequiredProperty_(scriptProperties, "HR_EMAIL");
    captchaSecret = getRequiredProperty_(scriptProperties, "RECAPTCHA_SECRET_KEY");
    allowedHostnames = getRequiredProperty_(scriptProperties, "ALLOWED_HOSTNAMES")
      .split(",")
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean);
  } catch (error) {
    console.error("Application delivery configuration is incomplete:", error);
    return postResult_(requestId, false, "Application delivery is not configured correctly. Contact the website administrator.");
  }

  if (!verifyCaptcha_(payload.captchaToken, captchaSecret, allowedHostnames)) {
    return postResult_(requestId, false, "The spam protection check expired or failed. Try again.");
  }

  let fields;
  try {
    fields = validateFields_(payload.fields || {});
  } catch (error) {
    return postResult_(requestId, false, error.message || "Check the application details and resume link.");
  }

  const referenceId = "NMKC-" + Utilities.getUuid().split("-")[0].toUpperCase();
  try {
    sendApplicationEmail_(hrEmail, fields, referenceId);
  } catch (error) {
    console.error("Recruitment email notification failed:", error);
    return postResult_(
      requestId,
      false,
      "The application email could not be sent. Please try again later.",
      referenceId
    );
  }

  return postResult_(requestId, true, "Application submitted.", referenceId);
}

function validateFields_(fields) {
  const clean = {
    fullName: cleanText_(fields.fullName, 100),
    contact: cleanText_(fields.contact, 30),
    email: cleanText_(fields.email, 254),
    education: cleanText_(fields.education, 200),
    subject: cleanText_(fields.subject, 100),
    position: cleanText_(fields.position, 100),
    experience: cleanText_(fields.experience, 2000),
    resumeLink: cleanText_(fields.resumeLink, 2048)
  };

  if (clean.fullName.length < 2 || !/^[6-9]\d{9}$/.test(clean.contact)) {
    throw new Error("Please check your name and 10-digit mobile number.");
  }
  if (clean.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) {
    throw new Error("Please enter a valid email address.");
  }
  if (!clean.education || !clean.subject || !clean.position) {
    throw new Error("Complete all required application fields.");
  }
  if (clean.resumeLink && !isGoogleDriveFileLink_(clean.resumeLink)) {
    throw new Error("Paste a valid Google Drive file link, or leave the optional field empty.");
  }
  return clean;
}

function isGoogleDriveFileLink_(value) {
  return /^https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]+(?:\/[^?#]*)?(?:\?[^#]*)?(?:#.*)?$/i.test(value) ||
    /^https:\/\/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=[A-Za-z0-9_-]+(?:&[^#]*)?(?:#.*)?$/i.test(value) ||
    /^https:\/\/docs\.google\.com\/document\/d\/[A-Za-z0-9_-]+(?:\/[^?#]*)?(?:\?[^#]*)?(?:#.*)?$/i.test(value);
}

function verifyCaptcha_(token, secret, allowedHostnames) {
  if (!token) {
    return false;
  }

  let response;
  try {
    response = UrlFetchApp.fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "post",
      payload: { secret, response: token },
      muteHttpExceptions: true
    });
  } catch (error) {
    console.error("reCAPTCHA verification request failed:", error);
    return false;
  }

  let result;
  try {
    result = JSON.parse(response.getContentText());
  } catch (error) {
    console.error("Invalid reCAPTCHA verification response:", error);
    return false;
  }

  return result.success === true &&
    typeof result.hostname === "string" &&
    allowedHostnames.includes(result.hostname.toLowerCase());
}

function sendApplicationEmail_(hrEmail, fields, referenceId) {
  const details = [
    ["Reference ID", referenceId],
    ["Submitted at", new Date().toISOString()],
    ["Full name", fields.fullName],
    ["Contact number", fields.contact],
    ["Email address", fields.email || "Not provided"],
    ["Education / qualification", fields.education],
    ["Interested subject", fields.subject],
    ["Interested position", fields.position],
    ["Experience", fields.experience || "Not provided"],
    ["Resume link", fields.resumeLink || "Not provided"]
  ];
  const body = details.map(([label, value]) => `${label}: ${value}`).join("\n");
  const htmlBody = details
    .map(([label, value]) => {
      const renderedValue = label === "Resume link" && fields.resumeLink
        ? `<a href="${escapeHtml_(value)}">Open resume in Google Drive</a>`
        : escapeHtml_(value);
      return `<p><strong>${escapeHtml_(label)}:</strong> ${renderedValue}</p>`;
    })
    .join("");

  MailApp.sendEmail({
    to: hrEmail,
    subject: `NMKC application — ${fields.fullName} (${referenceId})`,
    body,
    htmlBody
  });
}

function postResult_(requestId, success, message, referenceId) {
  const result = {
    type: "NMKC_APPLICATION_RESULT",
    requestId,
    success,
    message,
    referenceId: referenceId || ""
  };
  const serialized = JSON.stringify(result).replace(/</g, "\\u003c");
  return HtmlService
    .createHtmlOutput(`<!doctype html><meta charset="utf-8"><script>window.parent.postMessage(${serialized}, "*");</script>`)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getRequiredProperty_(properties, name) {
  const value = properties.getProperty(name);
  if (!value) {
    throw new Error(`Missing Script Property: ${name}`);
  }
  return value.trim();
}

function cleanText_(value, maximumLength) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maximumLength);
}

function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function isValidRequestId_(requestId) {
  return /^[A-Za-z0-9-]{12,80}$/.test(requestId);
}
