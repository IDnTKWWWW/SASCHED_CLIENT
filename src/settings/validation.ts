import type { UserSettings } from "./types";

export interface ValidationErrors {
  fullName?: string;
  studentId?: string;
  programSection?: string;
  contactNumber?: string;
}

export function sanitizeText(value: string, maxLen = 80): string {
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, maxLen);
}

/**
 * Validates Student / Institutional ID:
 * Empty is allowed (optional field), otherwise 6–15 alphanumeric or hyphen characters
 * (e.g., "02000123456" or "2024-100234").
 */
export function validateStudentId(raw: string): string | undefined {
  const val = raw.trim();
  if (!val) return undefined;
  if (!/^[A-Za-z0-9-]{6,15}$/.test(val)) {
    return "Student ID must be 6–15 letters, digits, or hyphens (e.g., 02000123456).";
  }
  return undefined;
}

/**
 * Validates Program / Year & Section:
 * Empty is allowed, otherwise 2–50 standard academic characters (e.g., "BSIT - 502").
 */
export function validateProgramSection(raw: string): string | undefined {
  const val = raw.trim();
  if (!val) return undefined;
  if (val.length < 2 || val.length > 50) {
    return "Program & Section must be between 2 and 50 characters (e.g., BSIT - 502).";
  }
  if (!/^[A-Za-z0-9\s.,/&()-]+$/.test(val)) {
    return "Contains invalid special characters.";
  }
  return undefined;
}

/**
 * Validates PH Mobile Number:
 * Empty is allowed, otherwise must match 09XXXXXXXXX (11 digits) or +639XXXXXXXXX (13 chars).
 */
export function validateContactNumber(raw: string): string | undefined {
  const val = raw.trim();
  if (!val) return undefined;
  const compact = val.replace(/[\s-]/g, "");
  if (!/^(09\d{9}|\+639\d{9})$/.test(compact)) {
    return "Enter a valid PH mobile number (e.g., 09171234567 or +639171234567).";
  }
  return undefined;
}

/**
 * Validates Full Name for one-time setup when name is missing or "SASCHED User"
 */
export function validateFullName(raw: string): string | undefined {
  const val = raw.trim();
  if (!val) return "Full name cannot be empty.";
  if (val.toLowerCase() === "sasched user") {
    return "Please enter your real full name.";
  }
  if (val.length < 3 || val.length > 80) {
    return "Full name must be between 3 and 80 characters.";
  }
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s.'-]+$/.test(val)) {
    return "Name may only contain letters, spaces, periods, hyphens, and apostrophes.";
  }
  return undefined;
}

export function validateUserSettings(
  settings: Pick<UserSettings, "studentId" | "programSection" | "contactNumber">
): ValidationErrors {
  const errors: ValidationErrors = {};
  const sidErr = validateStudentId(settings.studentId);
  if (sidErr) errors.studentId = sidErr;

  const progErr = validateProgramSection(settings.programSection);
  if (progErr) errors.programSection = progErr;

  const phoneErr = validateContactNumber(settings.contactNumber);
  if (phoneErr) errors.contactNumber = phoneErr;

  return errors;
}

export function normalizeContactNumber(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed.replace(/[\s-]/g, "");
}

