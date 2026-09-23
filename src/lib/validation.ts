/**
 * Client-side form validation for the auth pages. The database re-checks
 * everything server-side; this gives instant, accessible feedback.
 */

export interface FieldError {
  field: string;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required.";
  if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return "Password needs at least one letter and one number.";
  }
  return null;
}

export function validateSignUp(input: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}): FieldError[] {
  const errors: FieldError[] = [];

  if (!input.fullName.trim()) {
    errors.push({ field: "fullName", message: "Full name is required." });
  } else if (input.fullName.trim().length < 2) {
    errors.push({ field: "fullName", message: "Name looks too short." });
  }

  const email = validateEmail(input.email);
  if (email) errors.push({ field: "email", message: email });

  const password = validatePassword(input.password);
  if (password) errors.push({ field: "password", message: password });

  if (input.confirmPassword !== input.password) {
    errors.push({
      field: "confirmPassword",
      message: "Passwords do not match.",
    });
  }

  if (input.role !== "buyer" && input.role !== "artist") {
    errors.push({ field: "role", message: "Choose an account type." });
  }

  return errors;
}

export function validateSignIn(input: { email: string; password: string }): FieldError[] {
  const errors: FieldError[] = [];
  const email = validateEmail(input.email);
  if (email) errors.push({ field: "email", message: email });
  if (!input.password) {
    errors.push({ field: "password", message: "Password is required." });
  }
  return errors;
}

export function validateResetEmail(email: string): string | null {
  return validateEmail(email);
}
