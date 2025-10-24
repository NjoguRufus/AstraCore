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
  BarChart3,
  Plus,
  Calendar,
  Image,
  Video,
  FileText,
  Download,
  Edit
} from 'lucide-react';
import { Announcement, ContentTask, ContentAttachment } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { 
  getContentTasks, 
  createContentTask, 
  updateContentTask, 
  addContentAttachment,
  getContentPerformanceAnalytics
} from '../../services/firebaseService';

// Create Task Form Component
const CreateTaskForm: React.FC<{
  onSubmit: (data: {
    title: string;
    description: string;
    type: ContentTask['type'];
    priority: ContentTask['priority'];
    deadline?: string;
  }) => void;
}> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'banner' as ContentTask['type'],
    priority: 'medium' as ContentTask['priority'],
    deadline: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title && formData.description) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter task title"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter task description"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type *
          </label>
          <select 
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ContentTask['type'] }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="banner">Banner</option>
            <option value="thumbnail">Thumbnail</option>
            <option value="post">Post</option>
            <option value="video">Video</option>
            <option value="graphic">Graphic</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority *
          </label>
          <select 
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as ContentTask['priority'] }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Deadline
        </label>
        <input
          type="date"
          value={formData.deadline}
          onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="submit"
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          Create Task
        </button>
      </div>
    </form>
  );
};

export const ContentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showNotification, openModal, closeModal } = useModal();
  const { data: announcements, loading: announcementsLoading, error: announcementsError } = useCollection<Announcement>('announcements');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [contentTasks, setContentTasks] = useState<ContentTask[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  // Check if onboarding is completed
  useEffect(() => {
    if (user && !user.onboardingCompleted && !user.contractSigned) {
      window.location.href = '/onboarding';
    }
  }, [user]);

  // Fetch content tasks from Firebase
  useEffect(() => {
    const fetchContentTasks = async () => {
      if (!user?.companyId || !user?.uid) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const tasks = await getContentTasks(user.companyId, user.uid);
        setContentTasks(tasks);
        
        // Fetch analytics
        const analyticsData = await getContentPerformanceAnalytics(user.companyId, user.uid);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Error fetching content tasks:', error);
        showNotification({
          title: 'Error',
          message: 'Failed to load content tasks',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContentTasks();
  }, [user, showNotification]);

  // Filter announcements for the current user
  const userAnnouncements = announcements?.filter(announcement => {
    if (announcement.targetType === 'all') return true;
    if (announcement.targetType === 'team' && announcement.targetTeam === user?.team) return true;
    if (announcement.targetType === 'individual' && announcement.targetMembers?.includes(user?.uid || '')) return true;
    if (!announcement.targetType) return true;
    return false;
  }) || [];

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

  const updateTaskStatus = async (taskId: string, newStatus: ContentTask['status']) => {
    if (!user) return;
    
    setIsUpdating(taskId);
    try {
      // Update in Firebase
      await updateContentTask(taskId, { 
        status: newStatus,
        ...(newStatus === 'completed' && { completedAt: new Date() })
      });

      // Update local state
      setContentTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: newStatus, 
              updatedAt: new Date(),
              ...(newStatus === 'completed' && { completedAt: new Date() })
            }
          : task
      ));
      
      showNotification({
        title: 'Task Updated',
        message: `Content task status changed to ${newStatus.replace('-', ' ')}`,
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
    openModal({
      title: 'Create New Content Task',
      content: (
        <CreateTaskForm onSubmit={createNewTask} />
      ),
      actions: [
        {
          label: 'Cancel',
          onClick: closeModal,
          variant: 'outline' as const
        }
      ]
    });
  };

  const createNewTask = async (taskData: {
    title: string;
    description: string;
    type: ContentTask['type'];
    priority: ContentTask['priority'];
    deadline?: string;
  }) => {
    if (!user?.companyId || !user?.uid) return;

    try {
      await createContentTask({
        title: taskData.title,
        description: taskData.description,
        type: taskData.type,
        priority: taskData.priority,
        status: 'pending',
        assignedTo: user.uid,
        projectId: '', // You might want to add project selection
        companyId: user.companyId,
        createdBy: user.uid,
        attachments: [],
        deadline: taskData.deadline ? new Date(taskData.deadline) : undefined
      });

      // Refresh tasks
      const tasks = await getContentTasks(user.companyId, user.uid);
      setContentTasks(tasks);

      showNotification({
        title: 'Task Created',
        message: 'New content task has been created successfully',
        type: 'success'
      });
      closeModal();
    } catch (error) {
      console.error('Error creating task:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to create task',
        type: 'error'
      });
    }
  };

  const handleUploadFiles = (task?: ContentTask) => {
    openModal({
      title: task ? `Upload Files to ${task.title}` : 'Upload Design Files',
      content: (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <input
              type="file"
              multiple
              onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500"
            >
              <span>Select files</span>
            </label>
            <p className="text-xs text-gray-500 mt-2">PNG, JPG, PDF, PSD, AI up to 10MB</p>
          </div>
          
          {selectedFiles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-sm text-gray-600">
                    <span className="truncate">{file.name}</span>
                    <span>{(file.size / 1024).toFixed(2)} KB</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
      actions: [
        {
          label: 'Cancel',
          onClick: () => {
            setSelectedFiles([]);
            closeModal();
          },
          variant: 'outline' as const
        },
        {
          label: 'Upload Files',
          onClick: async () => {
            if (!user?.uid || selectedFiles.length === 0) return;

            try {
              if (task) {
                // Upload to specific task
                const attachments: ContentAttachment[] = selectedFiles.map(file => ({
                  id: `file-${Date.now()}-${Math.random()}`,
                  fileName: file.name,
                  fileUrl: URL.createObjectURL(file), // In real app, upload to storage service
                  fileType: file.type,
                  fileSize: file.size,
                  uploadedAt: new Date(),
                  uploadedBy: user.uid
                }));

                await addContentAttachment(task.id, attachments[0]); // Add one at a time for now
                
                // Refresh tasks
                const tasks = await getContentTasks(user.companyId!, user.uid);
                setContentTasks(tasks);
              }
              
              showNotification({
                title: 'Files Uploaded',
                message: `${selectedFiles.length} files uploaded successfully`,
                type: 'success'
              });
              setSelectedFiles([]);
              closeModal();
            } catch (error) {
              console.error('Error uploading files:', error);
              showNotification({
                title: 'Error',
                message: 'Failed to upload files',
                type: 'error'
              });
            }
          },
          variant: 'primary' as const,
          disabled: selectedFiles.length === 0
        }
      ]
    });
  };

  const handleAnalytics = () => {
    openModal({
      title: 'Performance Analytics',
      size: 'lg' as const,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics?.totalViews || 0}</div>
              <div className="text-sm text-gray-600">Total Views</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{analytics?.totalEngagement || 0}</div>
              <div className="text-sm text-gray-600">Total Engagement</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{analytics?.totalClicks || 0}</div>
              <div className="text-sm text-gray-600">Total Clicks</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{analytics?.totalConversions || 0}</div>
              <div className="text-sm text-gray-600">Total Conversions</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Top Performing Content</h4>
            <div className="space-y-2">
              {analytics?.topPerformingContent?.slice(0, 5).map((task: ContentTask) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">{task.title}</span>
                  <span className="text-sm text-gray-600">{task.performanceMetrics?.views || 0} views</span>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">No performance data available</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Performance by Type</h4>
            <div className="space-y-2">
              {analytics?.performanceByType && Object.entries(analytics.performanceByType).map(([type, data]: [string, any]) => (
                <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium capitalize">{type}</span>
                  <div className="text-sm text-gray-600">
                    {data.count} tasks • {data.avgViews.toFixed(0)} avg views
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">No performance data by type</p>
              )}
            </div>
          </div>
        </div>
      ),
      actions: [
        {
          label: 'Close',
          onClick: closeModal,
          variant: 'primary' as const
        }
      ]
    });
  };

  const handleDesignGallery = () => {
    const allAttachments = contentTasks.flatMap(task => 
      task.attachments.map(attachment => ({ ...attachment, taskTitle: task.title }))
    );

    openModal({
      title: 'Design Gallery',
      size: 'xl' as const,
      content: (
        <div className="space-y-4">
          {allAttachments.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {allAttachments.map(attachment => (
                <div key={attachment.id} className="border rounded-lg overflow-hidden">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    <Image className="w-12 h-12 text-gray-400" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                    <p className="text-xs text-gray-500 truncate">From: {attachment.taskTitle}</p>
                    <div className="flex space-x-2 mt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleFileDownload(attachment)}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Image className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No designs uploaded yet</p>
            </div>
          )}
        </div>
      ),
      actions: [
        {
          label: 'Close',
          onClick: closeModal,
          variant: 'primary' as const
        }
      ]
    });
  };

  const handleFileDownload = (attachment: ContentAttachment) => {
    // Simulate file download
    const link = document.createElement('a');
    link.href = attachment.fileUrl;
    link.download = attachment.fileName;
    link.click();
    
    showNotification({
      title: 'Download Started',
      message: `Downloading ${attachment.fileName}`,
      type: 'success'
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
      onClick: () => handleUploadFiles(),
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

  if (loading || announcementsLoading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading content creator dashboard...</p>
            <p className="mt-2 text-sm text-gray-500">Fetching your content tasks and analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (announcementsError) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this data. Please contact your administrator.
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
              {filteredTasks.length > 0 ? (
                filteredTasks.map(task => (
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
                        {task.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                  
                  {/* Task Details */}
                  <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                      {task.deadline && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Deadline: {formatDate(task.deadline)}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Created: {formatDate(task.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Attachments */}
                  {task.attachments.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-2">Attachments:</p>
                      <div className="space-y-1">
                        {task.attachments.map(attachment => (
                          <div key={attachment.id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 truncate flex-1">{attachment.fileName}</span>
                            <div className="flex space-x-1 ml-2">
                              <button 
                                onClick={() => handleFileDownload(attachment)}
                                className="text-green-600 hover:text-green-800 p-1"
                              >
                                <Download size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status Actions */}
                  <div className="flex gap-2 flex-wrap">
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUploadFiles(task)}
                      className="flex items-center space-x-1"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Add Files</span>
                    </Button>
                  </div>
                </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Palette className="w-8 h-8 text-purple-600" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Content Tasks Yet</h4>
                  <p className="text-gray-600 mb-4">You don't have any content tasks assigned to you yet.</p>
                  <Button onClick={handleCreateTask} variant="outline">
                    Create Your First Task
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Upload Section */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Section</h3>
              <Button
                size="sm"
                onClick={() => handleUploadFiles()}
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
              <Button onClick={() => handleUploadFiles()} variant="outline">
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
                    {task.deadline && <span>Deadline: {formatDate(task.deadline)}</span>}
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
              <div className="text-2xl font-bold text-blue-600">{analytics?.totalViews || 0}</div>
              <div className="text-sm text-gray-600">Total Views</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analytics?.totalEngagement || 0}</div>
              <div className="text-sm text-gray-600">Total Engagement</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{analytics?.totalConversions || 0}</div>
              <div className="text-sm text-gray-600">Total Conversions</div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};