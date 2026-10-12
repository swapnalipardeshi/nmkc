# NMKC Recruitment Website

A responsive recruitment page for the North Maharashtra Knowledge City, Jalgaon walk-in interview advertisement.

## Application form

Applicants may optionally paste a Google Drive link to their resume. The form emails application details and the link to the recruitment inbox using EmailJS. It does not upload or attach resume files, so the EmailJS 50 KB file-attachment limit does not apply. The HR email address is not displayed in the applicant-facing form.

If a resume link is provided, applicants must set its Google Drive **General access** to **Anyone with the link — Viewer** so HR can open it. Anyone who obtains that link can then view the file.

## EmailJS configuration

The page uses the configured public key, service ID, and template ID in `script.js`. In the EmailJS template:

1. Set **To Email** to the recruitment inbox as a fixed template setting. Do not use an applicant-controlled recipient.
2. Include the form variables `{{application_id}}`, `{{submitted_at}}`, `{{fullName}}`, `{{contact}}`, `{{email}}`, `{{education}}`, `{{subject}}`, `{{position}}`, `{{experience}}`, and `{{resume_url}}` in the subject/body. `resume_url` is populated from the optional Google Drive link field.
3. Do not configure a file attachment for `resume`; this form sends a Drive URL as text.
4. Restrict allowed origins to the published website domain and configure EmailJS usage limits.

EmailJS loads from jsDelivr, so submissions require an internet connection. If the service does not load or send, check the browser console and **EmailJS → Email History**, and verify the service/template IDs, fixed recipient, template variables, and allowed origins. A timeout means delivery is unconfirmed; check Email History before retrying.

This is not an official college recruitment portal. Obtain institutional approval and provide any required privacy notice before using it for real applicants.

## Advertisement details included
- Walk-in interview: Thursday, 15 October 2026
- Time: 10:30 AM onwards
- Roles: Professor, Associate Professor, Assistant Professor (Engineering Wing), Lecturer (Diploma Wing)
- Subjects: Computer, Electrical, Mathematics, English, Marathi and History
- Address: Gat No. 166, Bambhori, in front of K.B.C. North Maharashtra University Main Gate, Jalgaon
- Email: nmkcj53926@gmail.com
- Website: https://www.nmkcj.org.in

Institutional details were transcribed from the image supplied by the user. Please confirm the information and eligibility requirements with the institution.
