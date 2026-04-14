import type { CvData } from './types';

const isString = (value: unknown): value is string => typeof value === 'string';

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString);

export const isCvData = (value: unknown): value is CvData => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const personal = candidate.personal;

  if (typeof personal !== 'object' || personal === null) {
    return false;
  }

  const personalRecord = personal as Record<string, unknown>;
  const personalValid =
    isString(personalRecord.fullName) &&
    isString(personalRecord.title) &&
    isString(personalRecord.email) &&
    isString(personalRecord.phone) &&
    isString(personalRecord.location) &&
    isString(personalRecord.summary);

  const experienceValid =
    Array.isArray(candidate.experience) &&
    candidate.experience.every((item) => {
      if (typeof item !== 'object' || item === null) {
        return false;
      }

      const record = item as Record<string, unknown>;
      return (
        isString(record.role) &&
        isString(record.company) &&
        isString(record.location) &&
        isString(record.startDate) &&
        isString(record.endDate) &&
        isStringArray(record.highlights)
      );
    });

  const educationValid =
    Array.isArray(candidate.education) &&
    candidate.education.every((item) => {
      if (typeof item !== 'object' || item === null) {
        return false;
      }

      const record = item as Record<string, unknown>;
      return (
        isString(record.degree) &&
        isString(record.institution) &&
        isString(record.location) &&
        isString(record.startDate) &&
        isString(record.endDate)
      );
    });

  const skillsValid =
    Array.isArray(candidate.skills) &&
    candidate.skills.every((item) => {
      if (typeof item !== 'object' || item === null) {
        return false;
      }

      const record = item as Record<string, unknown>;
      return isString(record.name);
    });

  return personalValid && experienceValid && educationValid && skillsValid;
};

export const parseImportedCvData = (text: string): CvData => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Import file is not valid JSON.');
  }

  if (!isCvData(parsed)) {
    throw new Error('Import file does not match the CV data format.');
  }

  return parsed;
};

export const serializeCvData = (cvData: CvData): string => `${JSON.stringify(cvData, null, 2)}\n`;
