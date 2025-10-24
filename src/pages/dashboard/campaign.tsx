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
  Megaphone, 
  Users, 
  Target, 
  BarChart3, 
  Calendar,
  Play,
  Pause,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Eye,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Project, Announcement, User } from '../../types';
import { formatDate } from '../../utils/dateUtils';

export const CampaignDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useModal();
  const { data: projects, loading: projectsLoading, error: projectsError } = useCollection<Project>('projects');
  const { data: announcements, loading: announcementsLoading, error: announcementsError } = useCollection<Announcement>('announcements');
  const { data: users, loading: usersLoading, error: usersError } = useCollection<User>('users');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showUploadReport, setShowUploadReport] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
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

  // Convert projects to campaigns for campaign managers
  const campaigns = userProjects.map(project => ({
    id: project.id,
    title: project.title,
    description: project.description,
    objective: `Increase ${project.title.toLowerCase()} engagement and conversions`,
    deadline: project.deadline,
    status: project.status === 'completed' ? 'completed' as const : 
            project.status === 'in-progress' ? 'active' as const : 'planning' as const,
    assignedCreators: [user?.uid || ''],
    assignedSalesAgents: [user?.uid || ''],
    budget: 0, // Will be set when creating campaigns
    metrics: {
      reach: 0,
      engagement: 0,
      clicks: 0,
      conversions: 0,
      costPerClick: 0,
      costPerConversion: 0,
      lastUpdated: new Date()
    },
    reports: [],
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    companyId: user?.companyId || '',
    createdBy: 'admin-1'
  }));
  
  const activeCampaigns = campaigns.filter(campaign => campaign.status === 'active');
  const completedCampaigns = campaigns.filter(campaign => campaign.status === 'completed');
  const planningCampaigns = campaigns.filter(campaign => campaign.status === 'planning');

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.objective.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'planning': return 'text-purple-600 bg-purple-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const updateCampaignStatus = async (campaignId: string, newStatus: string) => {
    if (!user) return;
    
    setIsUpdating(campaignId);
    try {
      // In a real implementation, this would update a campaigns collection
      // For now, we'll update the project status
      const { updateProject } = await import('../../services/firebaseService');
      await updateProject(campaignId, { 
        status: newStatus === 'completed' ? 'completed' : 'in-progress',
        updatedAt: new Date()
      });
      
      showNotification({
        title: 'Campaign Updated',
        message: `Campaign status changed to ${newStatus}`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating campaign:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to update campaign status',
        type: 'error'
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleCreateCampaign = () => {
    showNotification({
      title: 'Feature Coming Soon',
      message: 'Campaign creation will be available in the next update',
      type: 'info'
    });
  };

  const handleUploadReport = () => {
    showNotification({
      title: 'Feature Coming Soon',
      message: 'Report upload will be available in the next update',
      type: 'info'
    });
  };

  const handleViewAnalytics = () => {
    showNotification({
      title: 'Feature Coming Soon',
      message: 'Campaign analytics will be available in the next update',
      type: 'info'
    });
  };

  const handleManageTeam = () => {
    showNotification({
      title: 'Feature Coming Soon',
      message: 'Team management will be available in the next update',
      type: 'info'
    });
  };

  const quickActions = [
    {
      label: 'New Campaign',
      icon: <Plus className="w-5 h-5" />,
      onClick: handleCreateCampaign,
      variant: 'primary' as const
    },
    {
      label: 'Upload Report',
      icon: <FileText className="w-5 h-5" />,
      onClick: handleUploadReport,
      variant: 'outline' as const
    },
    {
      label: 'View Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      onClick: handleViewAnalytics,
      variant: 'outline' as const
    },
    {
      label: 'Manage Team',
      icon: <Users className="w-5 h-5" />,
      onClick: handleManageTeam,
      variant: 'outline' as const
    }
  ];

  const filters = [
    {
      label: 'Status',
      value: statusFilter,
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'planning', label: 'Planning' },
        { value: 'active', label: 'Active' },
        { value: 'paused', label: 'Paused' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
      ],
      onChange: setStatusFilter
    }
  ];

  const stats = [
    { label: 'Total Campaigns', value: campaigns.length },
    { label: 'Active', value: activeCampaigns.length },
    { label: 'Completed', value: completedCampaigns.length },
    { label: 'Planning', value: planningCampaigns.length }
  ];

  const totalBudget = campaigns.reduce((sum, campaign) => sum + (campaign.budget || 0), 0);
  const totalReach = campaigns.reduce((sum, campaign) => sum + (campaign.metrics.reach || 0), 0);
  const totalConversions = campaigns.reduce((sum, campaign) => sum + (campaign.metrics.conversions || 0), 0);

  if (projectsLoading || announcementsLoading || usersLoading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading campaign manager dashboard...</p>
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
              className="bg-orange-600 hover:bg-orange-700"
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
          title="Campaign Manager Dashboard"
          subtitle="Create, manage, and track marketing campaigns efficiently"
          icon={<Megaphone className="w-8 h-8 text-white" />}
          color="orange"
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
          {/* Active Campaigns List */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Active Campaigns</h3>
              <span className="text-sm text-gray-500">{filteredCampaigns.length} campaigns</span>
            </div>
            <div className="space-y-4">
              {filteredCampaigns.map(campaign => (
                <div key={campaign.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{campaign.title}</h4>
                      <p className="text-sm text-gray-600">{campaign.objective}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </div>
                  
                  {/* Campaign Details */}
                  <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Deadline: {formatDate(campaign.deadline)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="w-3 h-3" />
                        <span>Budget: KSH {campaign.budget?.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-orange-600 font-medium">
                      {campaign.metrics.reach?.toLocaleString()} reach
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{campaign.description}</p>

                  {/* Status Actions */}
                  <div className="flex gap-2">
                    {campaign.status === 'planning' && (
                      <Button
                        size="sm"
                        onClick={() => updateCampaignStatus(campaign.id, 'active')}
                        disabled={isUpdating === campaign.id}
                        className="flex items-center space-x-1"
                      >
                        {isUpdating === campaign.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        <span>Launch</span>
                      </Button>
                    )}
                    {campaign.status === 'active' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCampaignStatus(campaign.id, 'paused')}
                          disabled={isUpdating === campaign.id}
                          className="flex items-center space-x-1"
                        >
                          {isUpdating === campaign.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                          ) : (
                            <Pause className="w-4 h-4" />
                          )}
                          <span>Pause</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateCampaignStatus(campaign.id, 'completed')}
                          disabled={isUpdating === campaign.id}
                          className="flex items-center space-x-1 bg-green-600 hover:bg-green-700"
                        >
                          {isUpdating === campaign.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          <span>Complete</span>
                        </Button>
                      </div>
                    )}
                    {campaign.status === 'paused' && (
                      <Button
                        size="sm"
                        onClick={() => updateCampaignStatus(campaign.id, 'active')}
                        disabled={isUpdating === campaign.id}
                        className="flex items-center space-x-1"
                      >
                        {isUpdating === campaign.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        <span>Resume</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Campaign Creation Form */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Campaign</h3>
              <Button
                size="sm"
                onClick={handleCreateCampaign}
                className="flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>New Campaign</span>
              </Button>
            </div>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Megaphone className="w-8 h-8 text-orange-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Start a New Campaign</h4>
              <p className="text-gray-600 mb-4">Create and launch your next marketing campaign</p>
              <Button onClick={handleCreateCampaign} variant="outline">
                Create Campaign
              </Button>
            </div>
          </Card>
        </div>

        {/* Assigned Team Overview */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Assigned Team Overview</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={handleManageTeam}
              className="flex items-center space-x-1"
            >
              <Users className="w-4 h-4" />
              <span>Manage Team</span>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-gray-900">Content Creators</h4>
              </div>
              <div className="text-sm text-gray-600">
                {campaigns.reduce((sum, campaign) => sum + campaign.assignedCreators.length, 0)} creators assigned
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-gray-900">Sales Agents</h4>
              </div>
              <div className="text-sm text-gray-600">
                {campaigns.reduce((sum, campaign) => sum + campaign.assignedSalesAgents.length, 0)} agents assigned
              </div>
            </div>
          </div>
        </Card>

        {/* Progress Analytics */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Progress Analytics</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewAnalytics}
              className="flex items-center space-x-1"
            >
              <BarChart3 className="w-4 h-4" />
              <span>View Details</span>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">KSH {totalBudget.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Budget</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalReach.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Reach</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalConversions}</div>
              <div className="text-sm text-gray-600">Total Conversions</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((totalConversions / totalReach) * 100) || 0}%
              </div>
              <div className="text-sm text-gray-600">Conversion Rate</div>
            </div>
          </div>
        </Card>

        {/* Performance Reports Upload */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance Reports</h3>
            <Button
              size="sm"
              onClick={handleUploadReport}
              className="flex items-center space-x-1"
            >
              <FileText className="w-4 h-4" />
              <span>Upload Report</span>
            </Button>
          </div>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Campaign Reports</h4>
            <p className="text-gray-600 mb-4">Share performance data and insights</p>
            <Button onClick={handleUploadReport} variant="outline">
              Upload Report
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
};