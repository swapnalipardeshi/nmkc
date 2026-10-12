# NMKC Recruitment Website

A responsive front-end recruitment website for the North Maharashtra Knowledge City, Jalgaon walk-in interview advertisement.

## Files
- `index.html` — page structure and application form
- `style.css` — responsive styling
- `script.js` — mobile menu and EmailJS form handling

## Run locally
1. Extract the ZIP file.
2. Open the `nmkc_recruitment_website` folder.
3. Double-click `index.html`, or open it in VS Code and use Live Server.

No installation or build tools are required.

## Application form behavior
The form validates required fields, including a resume in PDF or Word format, and sends the application details and resume attachment with EmailJS to `swapnalipardeshi05032001@gmail.com`. EmailJS is loaded from jsDelivr; without valid EmailJS configuration the form will show an error and will not claim the application was sent.

### Configure EmailJS
1. Create an EmailJS account and add an email service that can deliver to `swapnalipardeshi05032001@gmail.com`.
2. Create an email template. Set the template's **To Email** to `swapnalipardeshi05032001@gmail.com` (do not let applicants choose the recipient). Use these template variables in the subject/body: `{{application_id}}`, `{{submitted_at}}`, `{{fullName}}`, `{{contact}}`, `{{email}}`, `{{education}}`, `{{subject}}`, `{{position}}`, and `{{experience}}`.
3. In the template's **Attachments** tab, add a **Form File Attachment** and set its **Parameter Name** to `resume`. This must match the file input's `name="resume"`; the form uses EmailJS `sendForm` to send the uploaded document.
   The resume is sent as an email attachment. Do not use `{{resume_url}}` as a link unless you separately implement file hosting; this form does not upload resumes to a URL.
4. Copy the EmailJS public key, service ID, and template ID into `EMAILJS_CONFIG` in `script.js`. The public key is intended for browser use; never put a private key or email account password in this website.
5. Restrict the EmailJS allowed origins to the website's published domain and configure the provider's usage limits before publishing.

Test with a non-sensitive application and resume before sharing the site. EmailJS/provider attachment size limits may apply. This is a third-party email form, not an official college recruitment portal; obtain institutional approval and provide any required privacy notice before using it for real applicants.

If the form reports a timeout, delivery is unconfirmed (the request may still finish). Check **EmailJS → Email History** before submitting again to avoid duplicate applications. If EmailJS reports a send error, verify the template's fixed **To Email**, the connected email service, allowed website origins, and the `resume` attachment parameter.

## Advertisement details included
- Walk-in interview: Thursday, 15 October 2026
- Time: 10:30 AM onwards
- Roles: Professor, Associate Professor, Assistant Professor (Engineering Wing), Lecturer (Diploma Wing)
- Subjects: Computer, Electrical, Mathematics, English, Marathi and History
- Address: Gat No. 166, Bambhori, in front of K.B.C. North Maharashtra University Main Gate, Jalgaon
- Email: nmkcj53926@gmail.com
- Website: https://www.nmkcj.org.in

Institutional details were transcribed from the image supplied by the user. Please confirm the information and eligibility requirements with the institution.
