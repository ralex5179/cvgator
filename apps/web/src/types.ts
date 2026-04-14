export type TemplateSummary = {
  id: string;
  displayName: string;
  description: string;
};

export type PersonalDetails = {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
};

export type ExperienceItem = {
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  highlights: string[];
};

export type EducationItem = {
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
};

export type SkillItem = {
  name: string;
};

export type CvData = {
  personal: PersonalDetails;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
};

export type CvPreviewRequest = CvData & {
  templateId: string;
};
