import React from 'react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Bell, User, Settings, LogOut, CheckCircle, Plus, MessageSquare, Calendar, DollarSign, Target, FileText, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Project, SalesLead, Task, Announcement } from '../../types';

// Utility function to format time ago
const getTimeAgo = (date: Date | string | undefined): string => {
  if (!date) return 'Unknown time';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) return 'Invalid date';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
};

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'green' | 'orange';
  stats?: Array<{
    label: string;
    value: string | number;
  }>;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  icon,
  color,
  stats = []
}) => {
  const { user, logout } = useAuth();

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600'
  };

  const textColorClasses = {
    blue: 'text-blue-100',
    purple: 'text-purple-100',
    green: 'text-green-100',
    orange: 'text-orange-100'
  };

  return (
    <div className={`bg-gradient-to-r ${colorClasses[color]} rounded-2xl shadow-lg p-6 text-white`}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-8">
        {/* Title Section */}
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl p-3 shadow-lg">
            {icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {title}
            </h1>
            <p className={`${textColorClasses[color]} text-sm`}>
              {subtitle}
            </p>
          </div>
        </div>
        
        {/* Stats Section */}
        {stats.length > 0 && (
          <div className="flex gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">{stat.value}</div>
                <div className={`${textColorClasses[color]} text-xs`}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface QuickActionsProps {
  actions: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'outline';
  }>;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <Button
          key={index}
          onClick={action.onClick}
          variant={action.variant || 'primary'}
          className="flex items-center justify-center space-x-2 p-4 h-auto"
        >
          {action.icon}
          <span>{action.label}</span>
        </Button>
      ))}
    </div>
  );
};

interface DashboardFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: Array<{
    label: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
  }>;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filters
}) => {
  return (
    <Card>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2">
          {filters.map((filter, index) => (
            <select
              key={index}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>
    </Card>
  );
};

interface ProfileSummaryProps {
  user: any;
  projects?: Project[];
  salesLeads?: SalesLead[];
  tasks?: Task[];
  announcements?: Announcement[];
}

export const ProfileSummary: React.FC<ProfileSummaryProps> = ({ 
  user, 
  projects = [], 
  salesLeads = [], 
  tasks = [], 
  announcements = [] 
}) => {
  // Generate recent activity from real data
  const generateRecentActivity = () => {
    const activities: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      timestamp: Date;
      icon: React.ReactNode;
      bgColor: string;
      iconColor: string;
    }> = [];

    // Add recent projects
    const recentProjects = projects
      .filter(project => project.assignedTo?.includes(user?.uid || '') && project.updatedAt)
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return dateB - dateA;
      })
      .slice(0, 2);

    recentProjects.forEach(project => {
      // Only add if project has valid updatedAt date
      if (project.updatedAt) {
        activities.push({
          id: `project-${project.id}`,
          type: 'project',
          title: 'Project Updated',
          description: project.title,
          timestamp: project.updatedAt,
          icon: <CheckCircle className="w-4 h-4 text-white" />,
          bgColor: 'bg-blue-50',
          iconColor: 'bg-blue-500'
        });
      }
    });

    // Add recent sales leads
    const recentLeads = salesLeads
      .filter(lead => lead.assignedTo === user?.uid && lead.updatedAt)
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return dateB - dateA;
      })
      .slice(0, 2);

    recentLeads.forEach(lead => {
      // Only add if lead has valid updatedAt date
      if (lead.updatedAt) {
        activities.push({
          id: `lead-${lead.id}`,
          type: 'lead',
          title: 'Lead Updated',
          description: `${lead.clientName} - ${lead.status}`,
          timestamp: lead.updatedAt,
          icon: <DollarSign className="w-4 h-4 text-white" />,
          bgColor: 'bg-green-50',
          iconColor: 'bg-green-500'
        });
      }
    });

    // Add recent announcements
    const recentAnnouncements = announcements
      .filter(announcement => {
        if (!announcement.createdAt) return false;
        if (announcement.targetType === 'all') return true;
        if (announcement.targetType === 'team' && announcement.targetTeam === user?.team) return true;
        if (announcement.targetType === 'individual' && announcement.targetMembers?.includes(user?.uid || '')) return true;
        return false;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      })
      .slice(0, 1);

    recentAnnouncements.forEach(announcement => {
      // Only add if announcement has valid createdAt date
      if (announcement.createdAt) {
        activities.push({
          id: `announcement-${announcement.id}`,
          type: 'announcement',
          title: 'New Announcement',
          description: announcement.title,
          timestamp: announcement.createdAt,
          icon: <MessageSquare className="w-4 h-4 text-white" />,
          bgColor: 'bg-purple-50',
          iconColor: 'bg-purple-500'
        });
      }
    });

    // Sort by timestamp and return latest 4 activities
    return activities
      .sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateB - dateA;
      })
      .slice(0, 4);
  };

  const recentActivities = generateRecentActivity();

  // Calculate stats from real data
  const activeProjects = projects.filter(project => 
    project.assignedTo?.includes(user?.uid || '') && project.status === 'in-progress'
  ).length;

  const completedTasks = tasks.filter(task => 
    task.assignedTo === user?.uid && task.status === 'completed'
  ).length;

  const completedThisWeek = tasks.filter(task => {
    if (task.status !== 'completed' || !task.completedAt) return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(task.completedAt) > weekAgo;
  }).length;

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
        
        <div className="space-y-3">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div key={activity.id} className={`flex items-center space-x-3 p-3 ${activity.bgColor} rounded-lg`}>
                <div className={`w-8 h-8 ${activity.iconColor} rounded-full flex items-center justify-center`}>
                  {activity.icon}
            </div>
            <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {getTimeAgo(activity.timestamp)}
                  </p>
            </div>
          </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-gray-400" />
            </div>
              <p className="text-sm text-gray-500">No recent activity</p>
              <p className="text-xs text-gray-400 mt-1">Your recent actions will appear here</p>
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Active Projects</span>
            <span className="font-semibold text-gray-900">{activeProjects}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600">Tasks Completed</span>
            <span className="font-semibold text-gray-900">{completedTasks}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600">This Week</span>
            <span className="font-semibold text-gray-900">{completedThisWeek}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

interface NotificationsWidgetProps {
  announcements?: any[];
  notifications?: any[];
  hasNewNotifications?: boolean;
  onClearNotifications?: () => void;
}

export const NotificationsWidget: React.FC<NotificationsWidgetProps> = ({
  announcements = [],
  notifications = [],
  hasNewNotifications = false,
  onClearNotifications = () => {}
}) => {
  // Use announcements if notifications is not provided
  const displayItems = notifications.length > 0 ? notifications : announcements;
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          {hasNewNotifications && (
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          )}
          <Button size="sm" variant="outline" onClick={onClearNotifications}>
            Clear All
          </Button>
        </div>
        <div className="space-y-3">
          {displayItems.length > 0 ? (
            displayItems.map((item, index) => (
              <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  {item.message || item.title || 'New notification'}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No new notifications</p>
          )}
        </div>
      </div>
    </Card>
  );
};
