export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
  if (!accessKey) {
    console.error('WEB3FORMS_ACCESS_KEY is not set');
    return false;
  }

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `CloudShare Verification Code: ${code}`,
        from_name: 'CloudShare',
        to: email,
        message: `Your CloudShare verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, ignore this email.`,
      }),
    });

    const result = await response.json();
    console.log('Web3Forms result:', result);
    return result.success === true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}
