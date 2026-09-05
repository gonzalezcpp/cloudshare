import { Resend } from 'resend';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set');
  }
  return new Resend(apiKey);
}

export async function sendVerificationEmail(email: string, code: string) {
  try {
    const resend = getResendClient();

    await resend.emails.send({
      from: 'CloudShare <onboarding@resend.dev>',
      to: email,
      subject: 'Verify your email - CloudShare',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="max-width:400px;margin:40px auto;background:white;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
            <div style="padding:32px 32px 24px;text-align:center;">
              <div style="width:48px;height:48px;background:#2563eb;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                <span style="color:white;font-weight:bold;font-size:20px;">C</span>
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
        </body>
        </html>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}
