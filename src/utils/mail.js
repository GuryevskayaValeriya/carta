const nodemailer = require('nodemailer');

let transporter;

function isMailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

function getTransporter() {
  if (!isMailConfigured()) {
    throw new Error('SMTP configuration is incomplete');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: String(process.env.SMTP_SECURE || 'true') === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  return transporter;
}

async function sendVerificationCodeEmail({ email, code }) {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;

  await getTransporter().sendMail({
    from,
    to: email,
    subject: 'StudentMap: code confirmation',
    text: [
      'Your StudentMap confirmation code:',
      code,
      '',
      'The code is valid for 15 minutes.'
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
        <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px;border:1px solid #e2e8f0;">
          <div style="font-size:24px;font-weight:700;color:#0f172a;margin-bottom:12px;">StudentMap</div>
          <div style="font-size:16px;color:#334155;margin-bottom:20px;">Use this code to complete your registration:</div>
          <div style="font-size:36px;letter-spacing:10px;font-weight:800;color:#2563eb;margin-bottom:20px;">${code}</div>
          <div style="font-size:14px;color:#64748b;">The code is valid for 15 minutes.</div>
        </div>
      </div>
    `
  });
}

module.exports = {
  isMailConfigured,
  sendVerificationCodeEmail
};
