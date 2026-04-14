import type { CvData, EducationItem, ExperienceItem, PersonalDetails, SkillItem } from './types';

export const createEmptyPersonalDetails = (): PersonalDetails => ({
  fullName: 'Jane Doe',
  title: 'Senior Software Engineer',
  email: 'jane@example.com',
  phone: '+33 6 12 34 56 78',
  location: 'Paris, France',
  summary: 'Backend-focused engineer building reliable web applications and developer platforms.',
});

export const createEmptyExperienceItem = (): ExperienceItem => ({
  role: 'Platform Engineer',
  company: 'Acme',
  location: 'Paris, France',
  startDate: '2022',
  endDate: 'Present',
  highlights: ['Delivered internal platform tooling', 'Improved deployment safety'],
});

export const createEmptyEducationItem = (): EducationItem => ({
  degree: 'MSc Computer Science',
  institution: 'Example University',
  location: 'Lyon, France',
  startDate: '2018',
  endDate: '2020',
});

export const createEmptySkillItem = (): SkillItem => ({
  name: 'Java',
});

export const createDefaultCvData = (): CvData => ({
  personal: createEmptyPersonalDetails(),
  experience: [createEmptyExperienceItem()],
  education: [createEmptyEducationItem()],
  skills: [createEmptySkillItem(), { name: 'Spring Boot' }, { name: 'React' }],
});
