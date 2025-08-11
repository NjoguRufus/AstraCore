export interface User {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: 'admin' | 'dev' | 'design' | 'cyber' | 'analyst';
  team: string;
  skills: string[];
  github?: string;
  linkedin?: string;
  phone?: string;
  idCode: string;
  isAdmin?: boolean;
  status: 'active' | 'deactivated';
  createdAt: Date;
  onboardingCompleted?: boolean;
  contractSigned?: boolean;
  contractId?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  assignedTo: string[]; // UIDs of assigned members
  assignedTeam?: string; // Team name if assigned to entire team
  team?: string;
  status: 'upcoming' | 'in-progress' | 'completed';
  deadline: Date;
  createdAt: Date;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
}

export interface Contract {
  id: string;
  uid: string;
  idCode: string;
  contractURL: string;
  signedAt: Date | null;
  signatureData: string;
  memberSignatureUrl?: string;
  selfieImageUrl?: string;
  termsAccepted: boolean;
  termsAcceptedAt: Date;
  status: 'pending' | 'signed' | 'completed';
  memberName: string;
  memberRole: string;
  memberEmail: string;
  contractVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WikiDoc {
  id: string;
  title: string;
  markdownContent: string;
  tags: string[];
  team?: string;
  visibility: 'public' | 'team' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  author: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export interface TermsAndConditions {
  id: string;
  version: string;
  content: string;
  effectiveDate: Date;
  isActive: boolean;
}