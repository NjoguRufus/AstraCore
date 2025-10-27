export interface User {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: 'admin' | 'dev' | 'design' | 'cyber' | 'analyst' | 'sales' | 'marketing' | 'campaign';
  team: string;
  github?: string;
  linkedin?: string;
  phone?: string;
  idCode: string;
  isAdmin?: boolean;
  status: 'active' | 'deactivated' | 'pending';
  createdAt: Date;
  onboardingCompleted?: boolean;
  contractSigned?: boolean;
  contractId?: string;
  // Multi-tenant fields
  companyId: string;
  companyRole: 'company_admin' | 'company_member';
  // Pending member fields
  pendingApproval?: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  // Astraronix onboarding
  roleOnboardingCompleted?: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  assignedTo: string[]; // UIDs of assigned members
  assignedTeam?: string; // Team name if assigned to entire team
  assignedType?: 'individual' | 'team' | 'hybrid';
  team?: string;
  status: 'upcoming' | 'in-progress' | 'completed';
  deadline: Date;
  createdAt: Date;
  completedAt?: Date; // Timestamp when project was marked as completed
  completedBy?: string; // UID of the member who marked it as completed
  // Multi-tenant fields
  companyId: string;
  createdBy: string;
  updatedAt: Date;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
  targetType?: 'all' | 'team' | 'individual';
  targetTeam?: string;
  targetMembers?: string[];
  // Multi-tenant fields
  companyId: string;
  createdBy: string;
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
  // Multi-tenant fields
  companyId: string;
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
  // Multi-tenant fields
  companyId: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  // Multi-tenant fields
  companyId: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  // Multi-tenant fields
  companyId: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
  // Multi-tenant fields
  companyId: string;
}

export interface TermsAndConditions {
  id: string;
  version: string;
  content: string;
  effectiveDate: Date;
  isActive: boolean;
  // Multi-tenant fields
  companyId: string;
}

// New SaaS-specific interfaces
export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignedTo: string; // UID of assigned member
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  completedAt?: Date;
  completedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  // Multi-tenant fields
  companyId: string;
  createdBy: string;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  tagline?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  domain?: string;
  plan: 'free' | 'premium' | 'enterprise';
  maxMembers: number;
  maxProjects: number;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  isActive: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'project' | 'task' | 'announcement' | 'system';
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
  actionUrl?: string;
  // Multi-tenant fields
  companyId: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: 'user' | 'project' | 'task' | 'announcement' | 'system';
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  // Multi-tenant fields
  companyId: string;
}

export interface CompanySettings {
  id: string;
  companyId: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
  };
  branding: {
    logo?: string;
    favicon?: string;
    companyName: string;
    tagline?: string;
  };
  features: {
    enableNotifications: boolean;
    enableAuditLogs: boolean;
    enableAnalytics: boolean;
    enableCustomDomains: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    inAppNotifications: boolean;
    slackWebhook?: string;
  };
  updatedAt: Date;
  updatedBy: string;
}

export interface Subscription {
  id: string;
  companyId: string;
  plan: 'free' | 'premium' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  features: {
    maxMembers: number;
    maxProjects: number;
    maxStorageGB: number;
    customBranding: boolean;
    prioritySupport: boolean;
    advancedAnalytics: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Analytics {
  companyId: string;
  date: string; // YYYY-MM-DD format
  metrics: {
    totalMembers: number;
    activeMembers: number;
    totalProjects: number;
    completedProjects: number;
    totalTasks: number;
    completedTasks: number;
    averageTaskCompletionTime: number; // in hours
    memberActivity: Record<string, number>; // userId -> activity score
  };
  createdAt: Date;
}

// Role-specific interfaces
export interface DevTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // Developer UID
  projectId: string;
  status: 'pending' | 'in-progress' | 'blocked' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: Date;
  githubRepo?: string;
  deploymentLink?: string;
  bugReports: BugReport[];
  pullRequests: PullRequest[];
  featureRequests: FeatureRequest[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  // Multi-tenant fields
  companyId: string;
  createdBy: string;
}

export interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  reportedBy: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  // Multi-tenant fields
  companyId: string;
}

export interface PullRequest {
  id: string;
  title: string;
  description: string;
  githubUrl: string;
  status: 'open' | 'merged' | 'closed';
  createdBy: string;
  createdAt: Date;
  // Multi-tenant fields
  companyId: string;
}

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'requested' | 'approved' | 'in-development' | 'completed' | 'rejected';
  requestedBy: string;
  createdAt: Date;
  // Multi-tenant fields
  companyId: string;
}

export interface ContentTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // Content Creator UID
  projectId: string;
  type: 'banner' | 'thumbnail' | 'post' | 'video' | 'graphic' | 'other';
  status: 'pending' | 'in-progress' | 'submitted-for-review' | 'approved' | 'revision-needed' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: Date;
  attachments: ContentAttachment[];
  adminFeedback?: string;
  performanceMetrics?: ContentPerformance;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  // Multi-tenant fields
  companyId: string;
  createdBy: string;
}

export interface ContentAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface ContentPerformance {
  views?: number;
  engagement?: number;
  clicks?: number;
  conversions?: number;
  campaignId?: string;
  lastUpdated: Date;
}

export interface SalesLead {
  id: string;
  clientName: string;
  company?: string;
  email: string;
  phone?: string;
  source: 'website' | 'referral' | 'social' | 'cold-call' | 'other';
  status: 'lead' | 'contacted' | 'qualified' | 'proposal-sent' | 'negotiation' | 'client' | 'closed-lost';
  value?: number;
  probability: number; // 0-100
  assignedTo: string; // Sales Agent UID
  notes: string;
  lastContact?: Date;
  nextFollowUp?: Date;
  contractId?: string;
  createdAt: Date;
  updatedAt: Date;
  // Multi-tenant fields
  companyId: string;
  createdBy: string;
}

export interface Commission {
  id: string;
  salesAgentId: string;
  leadId: string;
  amount: number;
  percentage: number;
  status: 'pending' | 'approved' | 'paid';
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  companyId: string;
  createdBy: string;
}

export interface Client {
  id: string;
  clientName: string;
  company: string;
  email: string;
  phone?: string;
  address?: string;
  industry?: string;
  status: 'active' | 'inactive' | 'prospect';
  assignedTo: string; // Sales Agent UID
  notes?: string;
  lastContact?: Date;
  nextFollowUp?: Date;
  contractId?: string;
  createdAt: Date;
  updatedAt: Date;
  companyId: string;
  createdBy: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  objective: string;
  deadline: Date;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
  assignedCreators: string[]; // Content Creator UIDs
  assignedSalesAgents: string[]; // Sales Agent UIDs
  budget?: number;
  metrics: CampaignMetrics;
  reports: CampaignReport[];
  createdAt: Date;
  updatedAt: Date;
  // Multi-tenant fields
  companyId: string;
  createdBy: string;
}

export interface CampaignMetrics {
  reach?: number;
  engagement?: number;
  clicks?: number;
  conversions?: number;
  leads?: number;
  revenue?: number;
  lastUpdated: Date;
}

export interface CampaignReport {
  id: string;
  title: string;
  content: string;
  period: 'weekly' | 'monthly';
  metrics: CampaignMetrics;
  attachments: ContentAttachment[];
  createdAt: Date;
  createdBy: string;
}