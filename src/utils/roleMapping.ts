// src/utils/roleMapping.ts
// Centralized role mapping utilities

/**
 * Maps role codes to human-readable display names
 */
export const getRoleDisplayName = (roleCode: string): string => {
  const roleMap: Record<string, string> = {
    admin: 'Administrator',
    dev: 'Developer',
    design: 'Content Creator',
    'content-creator': 'Content Creator',
    cyber: 'Cybersecurity Specialist',
    analyst: 'Data Analyst',
    sales: 'Sales Agent',
    marketing: 'Digital Marketing Agent',
    campaign: 'Campaign Manager'
  };
  
  return roleMap[roleCode] || roleCode;
};

/**
 * Maps role codes to team names
 */
export const getRoleTeamName = (roleCode: string): string => {
  const teamMap: Record<string, string> = {
    admin: 'Admin Team',
    dev: 'Development Team',
    design: 'Content Team',
    'content-creator': 'Content Team',
    cyber: 'Cybersecurity Team',
    analyst: 'Analytics Team',
    sales: 'Sales Team',
    marketing: 'Marketing Team',
    campaign: 'Campaign Team'
  };
  
  return teamMap[roleCode] || 'Astraronix Team';
};

/**
 * Maps role codes to emojis
 */
export const getRoleEmoji = (roleCode: string): string => {
  const emojiMap: Record<string, string> = {
    admin: '👑',
    dev: '💻',
    design: '🎨',
    'content-creator': '🎨',
    cyber: '🔒',
    analyst: '📊',
    sales: '🎯',
    marketing: '📈',
    campaign: '🚀'
  };
  
  return emojiMap[roleCode] || '👋';
};

/**
 * Gets all available roles with their display information
 */
export const getAllRoles = () => {
  return [
    { code: 'admin', name: 'Administrator', team: 'Admin Team', emoji: '👑' },
    { code: 'dev', name: 'Developer', team: 'Development Team', emoji: '💻' },
    { code: 'design', name: 'Content Creator', team: 'Content Team', emoji: '🎨' },
    { code: 'content-creator', name: 'Content Creator', team: 'Content Team', emoji: '🎨' },
    { code: 'cyber', name: 'Cybersecurity Specialist', team: 'Cybersecurity Team', emoji: '🔒' },
    { code: 'analyst', name: 'Data Analyst', team: 'Analytics Team', emoji: '📊' },
    { code: 'sales', name: 'Sales Agent', team: 'Sales Team', emoji: '🎯' },
    { code: 'marketing', name: 'Digital Marketing Agent', team: 'Marketing Team', emoji: '📈' },
    { code: 'campaign', name: 'Campaign Manager', team: 'Campaign Team', emoji: '🚀' }
  ];
};
