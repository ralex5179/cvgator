import type { CvData, CvPreviewRequest, TemplateSummary } from './types';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE_URL = configuredBaseUrl && configuredBaseUrl.length > 0 ? configuredBaseUrl : 'http://localhost:8080';

const buildUrl = (path: string) => `${API_BASE_URL}${path}`;

export const fetchTemplates = async (): Promise<TemplateSummary[]> => {
  const response = await fetch(buildUrl('/api/templates'));

  if (!response.ok) {
    throw new Error('Unable to load templates right now.');
  }

  return (await response.json()) as TemplateSummary[];
};

export const previewCv = async (templateId: string, cvData: CvData): Promise<string> => {
  const requestBody: CvPreviewRequest = {
    templateId,
    ...cvData,
  };

  const response = await fetch(buildUrl('/api/cv/preview'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error('Unable to generate preview right now.');
  }

  return response.text();
};

export const exportCvPdf = async (templateId: string, cvData: CvData): Promise<Blob> => {
  const requestBody: CvPreviewRequest = {
    templateId,
    ...cvData,
  };

  const response = await fetch(buildUrl('/api/cv/pdf'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error('Unable to export PDF right now.');
  }

  return response.blob();
};
