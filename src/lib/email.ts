export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  const apiKey = process.env.ELASTIC_EMAIL_API_KEY;
  if (!apiKey) {
    console.error('ELASTIC_EMAIL_API_KEY is not set');
    return false;
  }

  try {
    const response = await fetch('https://api.elasticemail.com/v2/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        apikey: apiKey,
        from: 'CloudShare <xitadodev@gmail.com>',
        to: email,
        subject: 'Your CloudShare verification code',
        body: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:400px;margin:40px auto;background:white;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
            <div style="padding:32px;text-align:center;">
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
          </div>
        `,
        isTransactional: 'true',
      }),
    });

    const result = await response.json();
    console.log('Elastic Email result:', result);
    return result.success !== false;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}
