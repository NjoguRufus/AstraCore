import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { useCollection } from '../../hooks/useFirestore';
import { useProjectNotifications } from '../../hooks/useProjectNotifications';
import { Layout } from '../../components/Layout/Layout';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { 
  DashboardHeader, 
  QuickActions, 
  DashboardFilters, 
  ProfileSummary, 
  NotificationsWidget 
} from '../../components/shared/DashboardComponents';
import { 
  Code, 
  Github, 
  ExternalLink, 
  Bug, 
  GitPullRequest, 
  Lightbulb,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Plus,
  Search,
  Calendar,
  BarChart3,
  Target,
  Edit,
  Trash2
} from 'lucide-react';
import { Project, Announcement, User } from '../../types';
import { updateProject, completeProject, resetCompletedProject } from '../../services/firebaseService';
import { formatDate, getDaysUntilDeadline, getDeadlineColor } from '../../utils/dateUtils';

export const DeveloperDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useModal();
  const { data: projects, loading: projectsLoading } = useCollection<Project>('projects');
  const { data: announcements, loading: announcementsLoading } = useCollection<Announcement>('announcements');
  const { data: users, loading: usersLoading, error: usersError } = useCollection<User>('users');
  const { newProjects, hasNewNotifications, clearNotifications } = useProjectNotifications();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateBug, setShowCreateBug] = useState(false);
  const [showCreatePR, setShowCreatePR] = useState(false);
  const [showCreateFeature, setShowCreateFeature] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Check if onboarding is completed
  useEffect(() => {
    if (user && !user.onboardingCompleted && !user.contractSigned) {
      window.location.href = '/onboarding';
    }
  }, [user]);

  // Filter projects for the current user (with error handling)
  const userProjects = projects?.filter(project => 
    project.assignedTo?.includes(user?.uid || '')
  ) || [];
  
  // Filter announcements for the current user (with error handling)
  const userAnnouncements = announcements?.filter(announcement => {
    if (announcement.targetType === 'all') return true;
    if (announcement.targetType === 'team' && announcement.targetTeam === user?.team) return true;
    if (announcement.targetType === 'individual' && announcement.targetMembers?.includes(user?.uid || '')) return true;
    if (!announcement.targetType) return true;
    return false;
  }) || [];
  
  const completedProjects = userProjects.filter(p => p.status === 'completed');
  const inProgressProjects = userProjects.filter(p => p.status === 'in-progress');
  const upcomingProjects = userProjects.filter(p => p.status === 'upcoming');

  const filteredProjects = userProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'upcoming': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const updateProjectStatus = async (projectId: string, newStatus: string) => {
    if (!user) return;
    
    setIsUpdating(projectId);
    try {
      if (newStatus === 'completed') {
        await completeProject(projectId, user.uid);
        showNotification({
          title: 'Project Completed',
          message: 'Project has been marked as completed successfully',
          type: 'success'
        });
      } else {
        await updateProject(projectId, { 
          status: newStatus as any,
          updatedAt: new Date()
        });
        showNotification({
          title: 'Project Updated',
          message: `Project status changed to ${newStatus}`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error updating project:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to update project status',
        type: 'error'
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const resetProject = async (projectId: string) => {
    if (!user) return;
    
    setIsUpdating(projectId);
    try {
      await resetCompletedProject(projectId);
      showNotification({
        title: 'Project Reset',
        message: 'Project has been reset to in-progress',
        type: 'success'
      });
    } catch (error) {
      console.error('Error resetting project:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to reset project',
        type: 'error'
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const quickActions = [
    {
      label: 'New Task',
      icon: <Plus className="w-5 h-5" />,
      onClick: () => {
        showNotification({
          title: 'Feature Coming Soon',
          message: 'Task creation will be available in the next update',
          type: 'info'
        });
      },
      variant: 'primary' as const
    },
    {
      label: 'Report Bug',
      icon: <Bug className="w-5 h-5" />,
      onClick: () => {
        showNotification({
          title: 'Feature Coming Soon',
          message: 'Bug reporting will be available in the next update',
          type: 'info'
        });
      },
      variant: 'outline' as const
    },
    {
      label: 'New PR',
      icon: <GitPullRequest className="w-5 h-5" />,
      onClick: () => {
        showNotification({
          title: 'Feature Coming Soon',
          message: 'Pull request creation will be available in the next update',
          type: 'info'
        });
      },
      variant: 'outline' as const
    },
    {
      label: 'Feature Request',
      icon: <Lightbulb className="w-5 h-5" />,
      onClick: () => {
        showNotification({
          title: 'Feature Coming Soon',
          message: 'Feature request creation will be available in the next update',
          type: 'info'
        });
      },
      variant: 'outline' as const
    }
  ];

  const filters = [
    {
      label: 'Status',
      value: statusFilter,
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'upcoming', label: 'Upcoming' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' }
      ],
      onChange: setStatusFilter
    },
    {
      label: 'Priority',
      value: priorityFilter,
      options: [
        { value: 'all', label: 'All Priority' },
        { value: 'urgent', label: 'Urgent' },
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' }
      ],
      onChange: setPriorityFilter
    }
  ];

  const stats = [
    { label: 'Total Projects', value: userProjects.length },
    { label: 'In Progress', value: inProgressProjects.length },
    { label: 'Completed', value: completedProjects.length },
    { label: 'Upcoming', value: upcomingProjects.length }
  ];

  if (projectsLoading || announcementsLoading || usersLoading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading developer dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error message if there are Firebase permission issues
  if (projectsError || announcementsError || usersError) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this data. Please contact your administrator to ensure your account is properly configured.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              Retry
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <DashboardHeader
          title="Developer Dashboard"
          subtitle="Build, track progress, and report on development tasks"
          icon={<Code className="w-8 h-8 text-white" />}
          color="blue"
          stats={stats}
        />

        {/* Quick Actions */}
        <QuickActions actions={quickActions} />

        {/* Profile Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProfileSummary user={user} />
          </div>
          <div>
            <NotificationsWidget 
              notifications={userAnnouncements.map(ann => ({
                message: ann.title,
                createdAt: ann.createdAt
              }))}
              onClear={() => {}}
            />
          </div>
        </div>

        {/* Filters */}
        <DashboardFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filters}
        />

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Projects */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Active Projects</h3>
              <span className="text-sm text-gray-500">{filteredProjects.length} projects</span>
            </div>
            <div className="space-y-4">
              {filteredProjects.map(project => (
                <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{project.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                  
                  {/* Project Details */}
                  <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Deadline: {formatDate(project.deadline)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span className={getDeadlineColor(project.deadline)}>
                          {getDaysUntilDeadline(project.deadline)} days left
                        </span>
                      </div>
                    </div>
                    {project.completedAt && (
                      <div className="text-green-600">
                        Completed: {formatDate(project.completedAt)}
                      </div>
                    )}
                  </div>

                  {/* Status Actions */}
                  <div className="flex gap-2">
                    {project.status !== 'completed' && (
                      <Button
                        size="sm"
                        onClick={() => updateProjectStatus(project.id, 'completed')}
                        disabled={isUpdating === project.id}
                        className="flex items-center space-x-1"
                      >
                        {isUpdating === project.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        <span>Mark Done</span>
                      </Button>
                    )}
                    {project.status === 'upcoming' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateProjectStatus(project.id, 'in-progress')}
                        disabled={isUpdating === project.id}
                        className="flex items-center space-x-1"
                      >
                        {isUpdating === project.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        <span>Start</span>
                      </Button>
                    )}
                    {project.status === 'in-progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateProjectStatus(project.id, 'upcoming')}
                        disabled={isUpdating === project.id}
                        className="flex items-center space-x-1"
                      >
                        {isUpdating === project.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : (
                          <Pause className="w-4 h-4" />
                        )}
                        <span>Pause</span>
                      </Button>
                    )}
                    {project.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resetProject(project.id)}
                        disabled={isUpdating === project.id}
                        className="flex items-center space-x-1"
                      >
                        {isUpdating === project.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : (
                          <Edit className="w-4 h-4" />
                        )}
                        <span>Reset</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Development Tools */}
          <div className="space-y-6">
            {/* Bug Reports */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Bug Reports</h3>
                <Button size="sm" onClick={() => setShowCreateBug(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Report Bug
                </Button>
              </div>
              <div className="space-y-3">
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">Login button not responding on mobile</h4>
                    <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100">
                      High
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Users cannot tap the login button on mobile devices</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">Status: Open</span>
                    <span className="text-xs text-gray-500">2 days ago</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Pull Requests */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Pull Requests</h3>
                <Button size="sm" onClick={() => setShowCreatePR(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  New PR
                </Button>
              </div>
              <div className="space-y-3">
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">Add dark mode support</h4>
                    <span className="px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-100">
                      Open
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">Implement dark mode toggle and theme switching</p>
                  <a href="#" className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800">
                    <Github className="w-3 h-3" />
                    <span>View on GitHub</span>
                  </a>
                </div>
              </div>
            </Card>

            {/* Feature Requests */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Feature Requests</h3>
                <Button size="sm" onClick={() => setShowCreateFeature(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Request Feature
                </Button>
              </div>
              <div className="space-y-3">
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">Real-time notifications</h4>
                    <span className="px-2 py-1 rounded-full text-xs font-medium text-yellow-600 bg-yellow-100">
                      Medium
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">Add WebSocket-based real-time notifications for task updates</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Status: Requested</span>
                    <span className="text-xs text-gray-500">1 week ago</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};
