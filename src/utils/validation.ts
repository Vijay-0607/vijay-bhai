export function validateEmailOrPhone(input: string): { isValid: boolean; message?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: false, message: 'Email or phone number is required.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^(\+91[\-\s]?)?[6-9]\d{9}$/;

  if (emailRegex.test(trimmed) || phoneRegex.test(trimmed.replace(/[\s\-]/g, ''))) {
    return { isValid: true };
  }

  // Also accept demo user logins or 10-digit numbers
  if (trimmed.length >= 4 && (trimmed.includes('@') || /^\d{10}$/.test(trimmed))) {
    return { isValid: true };
  }

  return { isValid: false, message: 'Please enter a valid email address or 10-digit mobile number.' };
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password) {
    return { isValid: false, message: 'Password is required.' };
  }
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters.' };
  }
  return { isValid: true };
}

export function validateNumberPositive(val: number, fieldName: string): { isValid: boolean; message?: string } {
  if (isNaN(val) || val <= 0) {
    return { isValid: false, message: `${fieldName} must be a positive number greater than 0.` };
  }
  return { isValid: true };
}

export function validateDateNotPast(dateStr: string, fieldName: string): { isValid: boolean; message?: string } {
  if (!dateStr) {
    return { isValid: false, message: `${fieldName} is required.` };
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { isValid: false, message: `Please select a valid date for ${fieldName}.` };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date < today) {
    return { isValid: false, message: `${fieldName} cannot be in the past.` };
  }
  return { isValid: true };
}
