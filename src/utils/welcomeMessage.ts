// src/utils/welcomeMessage.ts
// Utility functions for generating dynamic welcome messages
import { getRoleTeamName, getRoleEmoji } from './roleMapping';

export interface WelcomeMessageData {
  userName: string;
  teamName: string;
  userRole: string;
}

/**
 * Generates a dynamic welcome message using the provided user data
 * @param data - User information for personalizing the message
 * @returns Formatted welcome message string
 */
export const generateWelcomeMessage = (data: WelcomeMessageData): string => {
  const { userName, teamName } = data;
  const name = userName || "New Member";
  const team = teamName || "Astraronix Team";
  
  return `Welcome aboard, ${name}! 👋
You're now part of the ${team} Team at Astraronix Solutions.
Get ready to collaborate, create, and grow with us.
Explore your dashboard to start your first tasks, connect with your team, and see how Astraronix builds digital excellence together.`;
};

/**
 * Generates a role-specific welcome message
 * @param data - User information including role
 * @returns Role-specific welcome message
 */
export const generateRoleWelcomeMessage = (data: WelcomeMessageData): string => {
  const { userName, teamName, userRole } = data;
  const name = userName || "New Member";
  const team = teamName || "Astraronix Team";
  
  const roleMessages = {
    sales: `Welcome to the Sales Team, ${name}! 🎯
You're now part of the ${team} at Astraronix Solutions.
Your mission: Help Kenyan businesses discover the power of digital solutions.
Ready to drive growth and build lasting relationships?`,
    
    design: `Welcome to the Content Team, ${name}! ✨
You're now part of the ${team} at Astraronix Solutions.
Your mission: Craft compelling stories that connect us with our audience.
Ready to create engaging content that showcases our expertise?`,
    
    dev: `Welcome to the Development Team, ${name}! 💻
You're now part of the ${team} at Astraronix Solutions.
Your mission: Build digital experiences that empower Kenyan businesses.
Ready to code solutions that drive real-world impact?`,
    
    admin: `Welcome to the Admin Team, ${name}! ⚙️
You're now part of the ${team} at Astraronix Solutions.
Your mission: Keep operations running smoothly and ensure team success.
Ready to oversee excellence across all our projects?`,
    
    cyber: `Welcome to the Cybersecurity Team, ${name}! 🔒
You're now part of the ${team} at Astraronix Solutions.
Your mission: Protect our digital assets and ensure security compliance.
Ready to safeguard our systems and data?`,
    
    analyst: `Welcome to the Analytics Team, ${name}! 📊
You're now part of the ${team} at Astraronix Solutions.
Your mission: Turn data into insights that drive business decisions.
Ready to analyze and optimize our performance?`,
    
    marketing: `Welcome to the Marketing Team, ${name}! 📈
You're now part of the ${team} at Astraronix Solutions.
Your mission: Drive our digital presence and engage our audience.
Ready to create campaigns that convert?`,
    
    campaign: `Welcome to the Campaign Team, ${name}! 🚀
You're now part of the ${team} at Astraronix Solutions.
Your mission: Coordinate campaigns and optimize marketing efforts.
Ready to launch successful campaigns?`
  };
  
  return roleMessages[userRole as keyof typeof roleMessages] || roleMessages.dev;
};

/**
 * Generates a welcome message for notifications or emails
 * @param data - User information
 * @returns Short welcome message for notifications
 */
export const generateNotificationWelcomeMessage = (data: WelcomeMessageData): string => {
  const { userName, teamName } = data;
  const name = userName || "New Member";
  const team = teamName || "Astraronix Team";
  
  return `Welcome aboard, ${name}! You're now part of the ${team} Team at Astraronix Solutions. 🎉`;
};

/**
 * Generates a welcome message for dashboard headers
 * @param data - User information
 * @returns Dashboard welcome message
 */
export const generateDashboardWelcomeMessage = (data: WelcomeMessageData): string => {
  const { userName, teamName } = data;
  const name = userName || "Team Member";
  const team = teamName || "Astraronix Team";
  
  return `Welcome back, ${name}! Ready to make an impact with the ${team}?`;
};
