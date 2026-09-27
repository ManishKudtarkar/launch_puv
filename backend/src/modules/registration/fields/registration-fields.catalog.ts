export type RegistrationFieldCategory =
  'SYSTEM' | 'ACADEMIC' | 'PERSONAL' | 'TECHNICAL' | 'HACKATHON' | 'WORKSHOP';

export type RegistrationFieldInputType =
  | 'TEXT'
  | 'EMAIL'
  | 'PHONE'
  | 'NUMBER'
  | 'DATE'
  | 'URL'
  | 'TEXTAREA'
  | 'SELECT'
  | 'RADIO'
  | 'CHECKBOX'
  | 'MULTI_SELECT';

export interface RegistrationFieldDefinition {
  key: string;
  label: string;
  category: RegistrationFieldCategory;
  inputType: RegistrationFieldInputType;
  systemMandatory: boolean;
  options?: string[];
}

export const REGISTRATION_FIELDS: RegistrationFieldDefinition[] = [
  // SYSTEM
  {
    key: 'FULL_NAME',
    label: 'Full Name',
    category: 'SYSTEM',
    inputType: 'TEXT',
    systemMandatory: true,
  },
  {
    key: 'EMAIL',
    label: 'University Email',
    category: 'SYSTEM',
    inputType: 'EMAIL',
    systemMandatory: true,
  },
  {
    key: 'UNIVERSITY_ID',
    label: 'University ID',
    category: 'SYSTEM',
    inputType: 'TEXT',
    systemMandatory: true,
  },
  {
    key: 'PHONE_NUMBER',
    label: 'Phone Number',
    category: 'SYSTEM',
    inputType: 'PHONE',
    systemMandatory: true,
  },
  {
    key: 'COLLEGE',
    label: 'College',
    category: 'SYSTEM',
    inputType: 'TEXT',
    systemMandatory: true,
  },
  {
    key: 'DEPARTMENT',
    label: 'Department',
    category: 'SYSTEM',
    inputType: 'TEXT',
    systemMandatory: true,
  },

  // ACADEMIC
  {
    key: 'COURSE',
    label: 'Course',
    category: 'ACADEMIC',
    inputType: 'TEXT',
    systemMandatory: false,
  },
  {
    key: 'YEAR',
    label: 'Year',
    category: 'ACADEMIC',
    inputType: 'NUMBER',
    systemMandatory: false,
  },
  {
    key: 'SEMESTER',
    label: 'Semester',
    category: 'ACADEMIC',
    inputType: 'NUMBER',
    systemMandatory: false,
  },
  {
    key: 'CGPA',
    label: 'CGPA',
    category: 'ACADEMIC',
    inputType: 'NUMBER',
    systemMandatory: false,
  },

  // PERSONAL
  {
    key: 'GENDER',
    label: 'Gender',
    category: 'PERSONAL',
    inputType: 'TEXT',
    systemMandatory: false,
  },
  {
    key: 'DATE_OF_BIRTH',
    label: 'Date of Birth',
    category: 'PERSONAL',
    inputType: 'DATE',
    systemMandatory: false,
  },
  {
    key: 'CITY',
    label: 'City',
    category: 'PERSONAL',
    inputType: 'TEXT',
    systemMandatory: false,
  },

  // TECHNICAL
  {
    key: 'GITHUB',
    label: 'GitHub Profile',
    category: 'TECHNICAL',
    inputType: 'URL',
    systemMandatory: false,
  },
  {
    key: 'LINKEDIN',
    label: 'LinkedIn Profile',
    category: 'TECHNICAL',
    inputType: 'URL',
    systemMandatory: false,
  },
  {
    key: 'TECHNICAL_SKILLS',
    label: 'Technical Skills',
    category: 'TECHNICAL',
    inputType: 'TEXTAREA',
    systemMandatory: false,
  },
  {
    key: 'PROGRAMMING_LANGUAGES',
    label: 'Programming Languages',
    category: 'TECHNICAL',
    inputType: 'TEXTAREA',
    systemMandatory: false,
  },

  // HACKATHON
  {
    key: 'TEAM_NAME',
    label: 'Team Name',
    category: 'HACKATHON',
    inputType: 'TEXT',
    systemMandatory: false,
  },
  {
    key: 'TEAM_SIZE',
    label: 'Team Size',
    category: 'HACKATHON',
    inputType: 'NUMBER',
    systemMandatory: false,
  },
  {
    key: 'PROJECT_TITLE',
    label: 'Project Title',
    category: 'HACKATHON',
    inputType: 'TEXT',
    systemMandatory: false,
  },
  {
    key: 'PROJECT_DESCRIPTION',
    label: 'Project Description',
    category: 'HACKATHON',
    inputType: 'TEXTAREA',
    systemMandatory: false,
  },
  {
    key: 'TECHNOLOGY_STACK',
    label: 'Technology Stack',
    category: 'HACKATHON',
    inputType: 'TEXTAREA',
    systemMandatory: false,
  },

  // WORKSHOP
  {
    key: 'EXPERIENCE_LEVEL',
    label: 'Experience Level',
    category: 'WORKSHOP',
    inputType: 'TEXT',
    systemMandatory: false,
  },
  {
    key: 'LEARNING_GOAL',
    label: 'Learning Goal',
    category: 'WORKSHOP',
    inputType: 'TEXTAREA',
    systemMandatory: false,
  },
];
