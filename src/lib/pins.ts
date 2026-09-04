import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const PIN_LENGTH = parseInt(process.env.PIN_LENGTH || '6', 10);
const PIN_CHARSET = process.env.PIN_CHARSET || 'alphanumeric';

export function generateShareToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function hashPin(pin: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(pin, salt);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export function validatePin(pin: string): { valid: boolean; error?: string } {
  if (pin.length !== PIN_LENGTH) {
    return { valid: false, error: `PIN must be exactly ${PIN_LENGTH} characters` };
  }

  if (PIN_CHARSET === 'numeric') {
    if (!/^\d{6}$/.test(pin)) {
      return { valid: false, error: 'PIN must contain only digits (0-9)' };
    }
  } else if (PIN_CHARSET === 'alphanumeric') {
    if (!/^[a-zA-Z0-9]{6}$/.test(pin)) {
      return { valid: false, error: 'PIN must contain only letters and numbers' };
    }
  }

  return { valid: true };
}

export function generateRandomPin(): string {
  if (PIN_CHARSET === 'numeric') {
    return crypto.randomInt(100000, 999999).toString();
  }
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < PIN_LENGTH; i++) {
    result += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return result;
}
