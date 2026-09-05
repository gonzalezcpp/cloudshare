import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'service_tn80ye9';
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'template_pp00kbr';
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'NVdiyUwoyD2wFvEaW';

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  try {
    emailjs.init(EMAILJS_PUBLIC_KEY);

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        email: email,
        passcode: code,
        time: new Date(Date.now() + 10 * 60 * 1000).toLocaleTimeString(),
        to_name: 'CloudShare User',
      }
    );

    console.log('Email sent:', result.status);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}
