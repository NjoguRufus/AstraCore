import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { useCollection } from '../../hooks/useFirestore';
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
  Palette, 
  Upload, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Star,
  BarChart3,
  Plus,
  Search,
  Calendar,
  Image,
  Video,
  FileText,
  Download,
  Edit,
  Trash2
} from 'lucide-react';
import { Project, Announcement, User } from '../../types';
import { formatDate } from '../../utils/dateUtils';

export const ContentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useModal();
  const { data: projects, loading: projectsLoading, error: projectsError } = useCollection<Project>('projects');
  const { data: announcements, loading: announcementsLoading, error: announcementsError } = useCollection<Announcement>('announcements');
  const { data: users, loading: usersLoading, error: usersError } = useCollection<User>('users');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
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

  // Convert projects to content tasks for content creators
  const contentTasks = userProjects.map(project => ({
    id: project.id,
    title: project.title,
    description: project.description,
    type: 'banner' as const,
    status: project.status === 'completed' ? 'completed' as const : 
            project.status === 'in-progress' ? 'in-progress' as const : 'pending' as const,
    priority: 'medium' as const,
    deadline: project.deadline,
    attachments: [],
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  }));
  
  const completedTasks = contentTasks.filter(t => t.status === 'completed');
  const inProgressTasks = contentTasks.filter(t => t.status === 'in-progress');
  const reviewTasks = contentTasks.filter(t => t.status === 'submitted-for-review');

  const filteredTasks = contentTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesType = typeFilter === 'all' || task.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'approved': return 'text-blue-600 bg-blue-100';
      case 'submitted-for-review': return 'text-purple-600 bg-purple-100';
      case 'revision-needed': return 'text-orange-600 bg-orange-100';
      case 'in-progress': return 'text-yellow-600 bg-yellow-100';
      case 'pending': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'banner': return <Image className="w-4 h-4" />;
      case 'thumbnail': return <Image className="w-4 h-4" />;
      case 'post': return <FileText className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'graphic': return <Palette className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    if (!user) return;
    
    setIsUpdating(taskId);
    try {
      // In a real implementation, this would update a content_tasks collection
      // For now, we'll update the project status
      const { updateProject } = await import('../../services/firebaseService');
      await updateProject(taskId, { 
        status: newStatus === 'completed' ? 'completed' : 'in-progress',
        updatedAt: new Date()
      });
      
      showNotification({
        title: 'Task Updated',
        message: `Content task status changed to ${newStatus}`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating task:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to update task status',
        type: 'error'
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleCreateTask = () => {
    showNotification({
      title: 'Feature Coming Soon',
      message: 'Content task creation will be available in the next update',
      type: 'info'
    });
  };

  const handleUploadFiles = () => {
    showNotification({
      title: 'Feature Coming Soon',
      message: 'File upload will be available in the next update',
      type: 'info'
    });
  };

  const handleAnalytics = () => {
    showNotification({
      title: 'Feature Coming Soon',
      message: 'Performance analytics will be available in the next update',
      type: 'info'
    });
  };

  const handleDesignGallery = () => {
    showNotification({
      title: 'Feature Coming Soon',
      message: 'Design gallery will be available in the next update',
      type: 'info'
    });
  };

  const quickActions = [
    {
      label: 'New Content Task',
      icon: <Plus className="w-5 h-5" />,
      onClick: handleCreateTask,
      variant: 'primary' as const
    },
    {
      label: 'Upload Files',
      icon: <Upload className="w-5 h-5" />,
      onClick: handleUploadFiles,
      variant: 'outline' as const
    },
    {
      label: 'Performance Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      onClick: handleAnalytics,
      variant: 'outline' as const
    },
    {
      label: 'Design Gallery',
      icon: <Eye className="w-5 h-5" />,
      onClick: handleDesignGallery,
      variant: 'outline' as const
    }
  ];

  const filters = [
    {
      label: 'Status',
      value: statusFilter,
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'submitted-for-review', label: 'Under Review' },
        { value: 'approved', label: 'Approved' },
        { value: 'revision-needed', label: 'Revision Needed' },
        { value: 'completed', label: 'Completed' }
      ],
      onChange: setStatusFilter
    },
    {
      label: 'Type',
      value: typeFilter,
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'banner', label: 'Banner' },
        { value: 'thumbnail', label: 'Thumbnail' },
        { value: 'post', label: 'Post' },
        { value: 'video', label: 'Video' },
        { value: 'graphic', label: 'Graphic' },
        { value: 'other', label: 'Other' }
      ],
      onChange: setTypeFilter
    }
  ];

  const stats = [
    { label: 'Total Tasks', value: contentTasks.length },
    { label: 'In Progress', value: inProgressTasks.length },
    { label: 'Under Review', value: reviewTasks.length },
    { label: 'Completed', value: completedTasks.length }
  ];

  if (projectsLoading || announcementsLoading || usersLoading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading content creator dashboard...</p>
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
              className="bg-purple-600 hover:bg-purple-700"
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
          title="Content Creator Dashboard"
          subtitle="Design, upload, and deliver branded visuals efficiently"
          icon={<Palette className="w-8 h-8 text-white" />}
          color="purple"
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
              announcements={userAnnouncements}
              hasNewNotifications={false}
              onClearNotifications={() => {}}
            />
          </div>
        </div>

        {/* Filters */}
        <DashboardFilters 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filters}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assigned Design Tasks */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Assigned Design Tasks</h3>
              <span className="text-sm text-gray-500">{filteredTasks.length} tasks</span>
            </div>
            <div className="space-y-4">
              {filteredTasks.map(task => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(task.type)}
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                  
                  {/* Task Details */}
                  <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Deadline: {formatDate(task.deadline)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Created: {formatDate(task.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Actions */}
                  <div className="flex gap-2">
                    {task.status !== 'completed' && (
                      <Button
                        size="sm"
                        onClick={() => updateTaskStatus(task.id, 'completed')}
                        disabled={isUpdating === task.id}
                        className="flex items-center space-x-1"
                      >
                        {isUpdating === task.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        <span>Mark Done</span>
                      </Button>
                    )}
                    {task.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTaskStatus(task.id, 'in-progress')}
                        disabled={isUpdating === task.id}
                        className="flex items-center space-x-1"
                      >
                        {isUpdating === task.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                        ) : (
                          <Edit className="w-4 h-4" />
                        )}
                        <span>Start</span>
                      </Button>
                    )}
                    {task.status === 'in-progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTaskStatus(task.id, 'submitted-for-review')}
                        disabled={isUpdating === task.id}
                        className="flex items-center space-x-1"
                      >
                        {isUpdating === task.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span>Submit for Review</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Upload Section */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Section</h3>
              <Button
                size="sm"
                onClick={handleUploadFiles}
                className="flex items-center space-x-1"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Files</span>
              </Button>
            </div>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Your Designs</h4>
              <p className="text-gray-600 mb-4">Drag and drop your files here or click to browse</p>
              <Button onClick={handleUploadFiles} variant="outline">
                Choose Files
              </Button>
            </div>
          </Card>
        </div>

        {/* Review Status */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Review Status</h3>
            <span className="text-sm text-gray-500">{reviewTasks.length} under review</span>
          </div>
          <div className="space-y-4">
            {reviewTasks.length > 0 ? (
              reviewTasks.map(task => (
                <div key={task.id} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Under Review
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Submitted: {formatDate(task.updatedAt)}</span>
                    <span>Deadline: {formatDate(task.deadline)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No tasks under review at the moment</p>
              </div>
            )}
          </div>
        </Card>

        {/* Performance Analytics */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance Analytics</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAnalytics}
              className="flex items-center space-x-1"
            >
              <BarChart3 className="w-4 h-4" />
              <span>View Details</span>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">1,250</div>
              <div className="text-sm text-gray-600">Total Views</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">85%</div>
              <div className="text-sm text-gray-600">Engagement Rate</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">12</div>
              <div className="text-sm text-gray-600">Conversions</div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};