'use strict';

const nodemailer = require('nodemailer');

function sanitizeInput(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[<>&"']/g, (char) => ({
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      '\'': '&#39;'
    }[char]))
    .trim()
    .substring(0, 5000);
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

module.exports = async function azureContact(context, req) {
  try {
    const { name, email, message } = req.body || {};

    if (!name || !email || !message) {
      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          message: 'All fields are required.'
        }
      };
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          message: 'Invalid email address.'
        }
      };
      return;
    }

    const safeName = sanitizeInput(name);
    const safeEmail = sanitizeInput(email);
    const safeMessage = sanitizeInput(message);

    if (!safeName || !safeEmail || !safeMessage) {
      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          message: 'Invalid input detected.'
        }
      };
      return;
    }

    const transporter = createTransporter();
    const now = new Date().toLocaleString();

    await transporter.sendMail({
      from: `"Zero B.S. Guide Website" <${process.env.SMTP_USER}>`,
      to: 'service@hillviewgroupinc.com',
      replyTo: safeEmail,
      subject: `New Contact Form Submission from ${safeName}`,
      text: `
NEW CONTACT FORM SUBMISSION
===========================

Name:    ${safeName}
Email:   ${safeEmail}
Date:    ${now}

Message:
--------
${safeMessage}

===========================
This message was sent via the Zero B.S. Guide website contact form.
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f5f5f5;">
  <div style="background:#0a0a0a;padding:24px;border-radius:4px;margin-bottom:20px;">
    <h1 style="color:#c9a84c;font-size:20px;margin:0;letter-spacing:2px;">ZERO B.S. GUIDE</h1>
    <p style="color:#666;font-size:13px;margin:4px 0 0;">Contact Form Submission</p>
  </div>
  <div style="background:#fff;padding:28px;border-radius:4px;border:1px solid #e0e0e0;">
    <h2 style="color:#111;font-size:18px;margin-top:0;">New Message Received</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr>
        <td style="padding:10px;background:#f9f9f9;border:1px solid #eee;font-weight:bold;width:100px;color:#555;">Name</td>
        <td style="padding:10px;border:1px solid #eee;color:#111;">${safeName}</td>
      </tr>
      <tr>
        <td style="padding:10px;background:#f9f9f9;border:1px solid #eee;font-weight:bold;color:#555;">Email</td>
        <td style="padding:10px;border:1px solid #eee;"><a href="mailto:${safeEmail}" style="color:#c9a84c;">${safeEmail}</a></td>
      </tr>
      <tr>
        <td style="padding:10px;background:#f9f9f9;border:1px solid #eee;font-weight:bold;color:#555;">Date</td>
        <td style="padding:10px;border:1px solid #eee;color:#666;">${now}</td>
      </tr>
    </table>
    <h3 style="color:#333;font-size:15px;border-bottom:1px solid #eee;padding-bottom:8px;">Message</h3>
    <p style="color:#444;line-height:1.7;white-space:pre-wrap;">${safeMessage}</p>
    <div style="margin-top:24px;padding:16px;background:#f5f5f5;border-radius:4px;">
      <a href="mailto:${safeEmail}?subject=Re: Your message to Zero B.S. Guide"
         style="background:#c9a84c;color:#000;padding:10px 20px;border-radius:3px;text-decoration:none;font-weight:bold;font-size:13px;">
        Reply to ${safeName}
      </a>
    </div>
  </div>
  <p style="color:#999;font-size:12px;text-align:center;margin-top:16px;">
    Sent via the Zero B.S. Guide website contact form.
  </p>
</body>
</html>
      `
    });

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        message: 'Message sent successfully.'
      }
    };
  } catch (error) {
    context.log.error('Contact form error:', error.message);
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        message: 'Failed to send message. Please try again or email us directly at service@hillviewgroupinc.com'
      }
    };
  }
};
