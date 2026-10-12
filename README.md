# NMKC Recruitment Website

A responsive recruitment page for the North Maharashtra Knowledge City, Jalgaon walk-in interview advertisement.

## Application form

Applicants paste a Google Drive link to their resume rather than uploading a file. The form validates that the link points to a Google Drive file or Google Docs document and emails it with the application details to the configured recruitment recipient. The HR email address is not displayed on the form.

### Google Drive sharing note

Applicants must set the resume file's Google Drive **General access** to **Anyone with the link — Viewer** so HR can open it without being individually added to the file. This makes the resume accessible to anyone who obtains the link. Applicants should only submit a resume they agree to share this way. If that access level is not acceptable, use a private upload backend that grants HR access instead.

## Configure email delivery

The form uses a Google Apps Script web app to send details and the pasted resume link. Set up the separate backend in `google_apps_script/Code.gs`:

1. Create a standalone project at [Google Apps Script](https://script.google.com/) and paste in `google_apps_script/Code.gs`.
2. In **Project Settings → Script Properties**, configure:
   - `HR_EMAIL` — the recruitment inbox.
   - `RECAPTCHA_SECRET_KEY` — the server-side reCAPTCHA secret.
   - `ALLOWED_HOSTNAMES` — the exact website hostname; use comma-separated hostnames only for local testing.
3. Deploy as a **Web app**, executing as the script owner and allowing access to anyone. Authorize the email and URL Fetch permissions, then copy the deployed `/exec` URL.
4. In `script.js`, replace `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL` with the deployed URL and `YOUR_RECAPTCHA_SITE_KEY` with the public reCAPTCHA site key registered to the website hostname.

Never put the reCAPTCHA secret or HR email in the static website. The backend only accepts HTTPS Google Drive/Docs file links, verifies reCAPTCHA and emails HR the application plus a clickable resume link. It does not upload, store, or change sharing permissions on applicant files.

Use HTTPS and test with a non-sensitive application before publishing. Apps Script email quotas apply. This is not an official college recruitment portal; obtain institutional approval and provide any required privacy notice before using it for real applicants.

## Advertisement details included
- Walk-in interview: Thursday, 15 October 2026
- Time: 10:30 AM onwards
- Roles: Professor, Associate Professor, Assistant Professor (Engineering Wing), Lecturer (Diploma Wing)
- Subjects: Computer, Electrical, Mathematics, English, Marathi and History
- Address: Gat No. 166, Bambhori, in front of K.B.C. North Maharashtra University Main Gate, Jalgaon
- Email: nmkcj53926@gmail.com
- Website: https://www.nmkcj.org.in

Institutional details were transcribed from the image supplied by the user. Please confirm the information and eligibility requirements with the institution.
