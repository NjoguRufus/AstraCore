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
  employeeID: string;
  isAdmin?: boolean;
  createdAt: Date;
}

export interface PendingMember {
  employeeID: string;
  name: string;
  role: 'dev' | 'design' | 'cyber' | 'analyst';
  team: string;
  createdAt: Date;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  assignedTo: string[];
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
  uid: string;
  employeeID: string;
  contractURL: string;
  signedAt: Date;
  signatureData: string;
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