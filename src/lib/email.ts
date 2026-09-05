import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('GMAIL_USER or GMAIL_APP_PASSWORD not set');
      return false;
    }

    await transporter.sendMail({
      from: `"CloudShare" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Your CloudShare verification code: ${code}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:400px;margin:40px auto;background:white;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
          <div style="padding:32px;text-align:center;">
            <div style="margin-bottom:16px;">
              <img src="https://cloudshare-liart.vercel.app/logo-email.svg" alt="CloudShare" width="64" height="64" style="display:inline-block;border-radius:14px;" />
            </div>
            <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">Verify your email</h1>
            <p style="margin:0 0 24px;font-size:14px;color:#64748b;">Enter this code to verify your account</p>
            <div style="background:#f1f5f9;border-radius:12px;padding:16px;margin-bottom:24px;">
              <span style="font-size:32px;font-weight:700;color:#2563eb;letter-spacing:8px;font-family:monospace;">${code}</span>
            </div>
            <p style="margin:0;font-size:12px;color:#94a3b8;">This code expires in 10 minutes</p>
          </div>
          <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    console.log('Verification email sent to:', email);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}
