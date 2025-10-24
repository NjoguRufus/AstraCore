import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { Layout } from '../../components/Layout/Layout';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
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
  Filter,
  Search,
  Calendar,
  Image,
  Video,
  FileText,
  Download,
  Edit,
  Trash2
} from 'lucide-react';
import { ContentTask, ContentAttachment, ContentPerformance } from '../../types';

export const ContentCreatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useModal();
  
  const [contentTasks, setContentTasks] = useState<ContentTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ContentTask | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    const mockTasks: ContentTask[] = [
      {
        id: '1',
        title: 'Website Banner Design',
        description: 'Create a modern banner for the homepage featuring our latest product',
        assignedTo: user?.uid || '',
        projectId: 'proj-1',
        type: 'banner',
        status: 'in-progress',
        priority: 'high',
        deadline: new Date('2024-01-15'),
        attachments: [
          {
            id: 'att-1',
            fileName: 'banner-draft.png',
            fileUrl: 'https://example.com/banner-draft.png',
            fileType: 'image/png',
            fileSize: 1024000,
            uploadedAt: new Date('2024-01-10'),
            uploadedBy: user?.uid || ''
          }
        ],
        adminFeedback: 'Great start! Please adjust the color scheme to match our brand guidelines.',
        performanceMetrics: {
          views: 1250,
          engagement: 85,
          clicks: 45,
          conversions: 12,
          campaignId: 'campaign-1',
          lastUpdated: new Date()
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        companyId: user?.companyId || '',
        createdBy: 'admin-1'
      },
      {
        id: '2',
        title: 'Social Media Post Series',
        description: 'Create 5 Instagram posts for the product launch campaign',
        assignedTo: user?.uid || '',
        projectId: 'proj-2',
        type: 'post',
        status: 'submitted-for-review',
        priority: 'medium',
        deadline: new Date('2024-01-20'),
        attachments: [
          {
            id: 'att-2',
            fileName: 'post-1.jpg',
            fileUrl: 'https://example.com/post-1.jpg',
            fileType: 'image/jpeg',
            fileSize: 512000,
            uploadedAt: new Date('2024-01-12'),
            uploadedBy: user?.uid || ''
          },
          {
            id: 'att-3',
            fileName: 'post-2.jpg',
            fileUrl: 'https://example.com/post-2.jpg',
            fileType: 'image/jpeg',
            fileSize: 480000,
            uploadedAt: new Date('2024-01-12'),
            uploadedBy: user?.uid || ''
          }
        ],
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date(),
        companyId: user?.companyId || '',
        createdBy: 'admin-1'
      }
    ];

    setContentTasks(mockTasks);
    setIsLoading(false);
  }, [user]);

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

  const updateTaskStatus = (taskId: string, newStatus: string) => {
    setContentTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus as any, updatedAt: new Date() }
        : task
    ));
    showNotification({
      title: 'Task Updated',
      message: `Task status changed to ${newStatus}`,
      type: 'success'
    });
  };

  const handleFileUpload = (taskId: string, file: File) => {
    // Mock file upload - in real implementation, upload to Cloudinary
    const newAttachment: ContentAttachment = {
      id: `att-${Date.now()}`,
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date(),
      uploadedBy: user?.uid || ''
    };

    setContentTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            attachments: [...task.attachments, newAttachment],
            updatedAt: new Date()
          }
        : task
    ));

    showNotification({
      title: 'File Uploaded',
      message: `${file.name} has been uploaded successfully`,
      type: 'success'
    });
  };

  if (isLoading) {
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

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-8">
            {/* Title Section */}
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Content Creator Dashboard
                </h1>
                <p className="text-purple-100 text-sm">
                  Design, upload, and deliver branded visuals efficiently
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">{contentTasks.length}</div>
                <div className="text-purple-100 text-xs">Total Tasks</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">{contentTasks.filter(t => t.status === 'in-progress').length}</div>
                <div className="text-purple-100 text-xs">In Progress</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">{contentTasks.filter(t => t.status === 'submitted-for-review').length}</div>
                <div className="text-purple-100 text-xs">Under Review</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">{contentTasks.filter(t => t.status === 'completed').length}</div>
                <div className="text-purple-100 text-xs">Completed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => setShowCreateTask(true)}
            className="flex items-center justify-center space-x-2 p-4 h-auto"
          >
            <Plus className="w-5 h-5" />
            <span>New Content Task</span>
          </Button>
          <Button
            onClick={() => setShowUploadModal(true)}
            variant="outline"
            className="flex items-center justify-center space-x-2 p-4 h-auto"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Files</span>
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center space-x-2 p-4 h-auto"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Performance Analytics</span>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search content tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="submitted-for-review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="revision-needed">Revision Needed</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Types</option>
                <option value="banner">Banner</option>
                <option value="thumbnail">Thumbnail</option>
                <option value="post">Post</option>
                <option value="video">Video</option>
                <option value="graphic">Graphic</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Content Tasks */}
        <div className="space-y-4">
          {filteredTasks.map(task => (
            <Card key={task.id}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      {getTypeIcon(task.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                      <p className="text-sm text-gray-600">{task.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                      {task.status.replace('-', ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>

                {/* Attachments */}
                {task.attachments.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments ({task.attachments.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {task.attachments.map(attachment => (
                        <div key={attachment.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            {attachment.fileType.startsWith('image/') ? (
                              <Image className="w-4 h-4 text-blue-600" />
                            ) : attachment.fileType.startsWith('video/') ? (
                              <Video className="w-4 h-4 text-red-600" />
                            ) : (
                              <FileText className="w-4 h-4 text-gray-600" />
                            )}
                            <span className="text-xs font-medium text-gray-700 truncate">
                              {attachment.fileName}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {(attachment.fileSize / 1024).toFixed(1)} KB
                            </span>
                            <div className="flex space-x-1">
                              <button className="text-blue-600 hover:text-blue-800">
                                <Eye className="w-3 h-3" />
                              </button>
                              <button className="text-green-600 hover:text-green-800">
                                <Download className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Feedback */}
                {task.adminFeedback && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Admin Feedback</h4>
                    <p className="text-sm text-blue-800">{task.adminFeedback}</p>
                  </div>
                )}

                {/* Performance Metrics */}
                {task.performanceMetrics && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="text-sm font-medium text-green-900 mb-2">Performance Metrics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-700">{task.performanceMetrics.views}</div>
                        <div className="text-xs text-green-600">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-700">{task.performanceMetrics.engagement}%</div>
                        <div className="text-xs text-green-600">Engagement</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-700">{task.performanceMetrics.clicks}</div>
                        <div className="text-xs text-green-600">Clicks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-700">{task.performanceMetrics.conversions}</div>
                        <div className="text-xs text-green-600">Conversions</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                  </div>
                  <div className="flex gap-2">
                    {task.status === 'in-progress' && (
                      <Button
                        size="sm"
                        onClick={() => updateTaskStatus(task.id, 'submitted-for-review')}
                        className="flex items-center space-x-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Submit for Review</span>
                      </Button>
                    )}
                    {task.status === 'revision-needed' && (
                      <Button
                        size="sm"
                        onClick={() => updateTaskStatus(task.id, 'in-progress')}
                        className="flex items-center space-x-1"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Start Revision</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTask(task);
                        setShowUploadModal(true);
                      }}
                      className="flex items-center space-x-1"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No content tasks found</h3>
              <p className="text-gray-600 mb-4">Create your first content task or adjust your filters</p>
              <Button onClick={() => setShowCreateTask(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Content Task
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};
