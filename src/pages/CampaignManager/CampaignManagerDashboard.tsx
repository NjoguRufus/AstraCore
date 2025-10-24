import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { Layout } from '../../components/Layout/Layout';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { 
  Rocket, 
  Users, 
  Target, 
  Calendar,
  TrendingUp,
  BarChart3,
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  FileText,
  Upload,
  Settings
} from 'lucide-react';
import { Campaign, CampaignMetrics, CampaignReport } from '../../types';

export const CampaignManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useModal();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCampaignDetails, setShowCampaignDetails] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    const mockCampaigns: Campaign[] = [
      {
        id: '1',
        title: 'Q1 Product Launch Campaign',
        description: 'Comprehensive marketing campaign for our new product launch targeting tech startups',
        objective: 'Generate 500 qualified leads and achieve 50 conversions',
        deadline: new Date('2024-03-31'),
        status: 'active',
        assignedCreators: ['creator-1', 'creator-2'],
        assignedSalesAgents: ['sales-1', 'sales-2'],
        budget: 100000,
        metrics: {
          reach: 25000,
          engagement: 12.5,
          clicks: 1250,
          conversions: 45,
          leads: 380,
          revenue: 750000,
          lastUpdated: new Date()
        },
        reports: [
          {
            id: 'report-1',
            title: 'Week 1 Performance Report',
            content: 'Strong start with high engagement rates. Social media posts performing well.',
            period: 'weekly',
            metrics: {
              reach: 15000,
              engagement: 15.2,
              clicks: 750,
              conversions: 25,
              leads: 200,
              revenue: 400000,
              lastUpdated: new Date()
            },
            attachments: [],
            createdAt: new Date('2024-01-08'),
            createdBy: user?.uid || ''
          }
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        companyId: user?.companyId || '',
        createdBy: 'admin-1'
      },
      {
        id: '2',
        title: 'Brand Awareness Campaign',
        description: 'Increase brand recognition and market presence through targeted content',
        objective: 'Reach 100,000 people and increase brand awareness by 30%',
        deadline: new Date('2024-02-28'),
        status: 'planning',
        assignedCreators: ['creator-3'],
        assignedSalesAgents: ['sales-3'],
        budget: 75000,
        metrics: {
          reach: 0,
          engagement: 0,
          clicks: 0,
          conversions: 0,
          leads: 0,
          revenue: 0,
          lastUpdated: new Date()
        },
        reports: [],
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date(),
        companyId: user?.companyId || '',
        createdBy: 'admin-1'
      },
      {
        id: '3',
        title: 'Holiday Sales Campaign',
        description: 'End-of-year sales campaign to boost revenue and clear inventory',
        objective: 'Generate KSh 2M in revenue through holiday promotions',
        deadline: new Date('2024-01-31'),
        status: 'completed',
        assignedCreators: ['creator-1', 'creator-2', 'creator-3'],
        assignedSalesAgents: ['sales-1', 'sales-2', 'sales-3'],
        budget: 150000,
        metrics: {
          reach: 50000,
          engagement: 18.5,
          clicks: 2500,
          conversions: 120,
          leads: 800,
          revenue: 2100000,
          lastUpdated: new Date()
        },
        reports: [
          {
            id: 'report-2',
            title: 'Final Campaign Report',
            content: 'Exceeded all objectives! Generated KSh 2.1M in revenue with 120 conversions.',
            period: 'monthly',
            metrics: {
              reach: 50000,
              engagement: 18.5,
              clicks: 2500,
              conversions: 120,
              leads: 800,
              revenue: 2100000,
              lastUpdated: new Date()
            },
            attachments: [],
            createdAt: new Date('2024-01-31'),
            createdBy: user?.uid || ''
          }
        ],
        createdAt: new Date('2023-12-01'),
        updatedAt: new Date(),
        companyId: user?.companyId || '',
        createdBy: 'admin-1'
      }
    ];

    setCampaigns(mockCampaigns);
    setIsLoading(false);
  }, [user]);

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
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

  const updateCampaignStatus = (campaignId: string, newStatus: string) => {
    setCampaigns(prev => prev.map(campaign => 
      campaign.id === campaignId 
        ? { ...campaign, status: newStatus as any, updatedAt: new Date() }
        : campaign
    ));
    showNotification({
      title: 'Campaign Updated',
      message: `Campaign status changed to ${newStatus}`,
      type: 'success'
    });
  };

  const totalActiveCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalCompletedCampaigns = campaigns.filter(c => c.status === 'completed').length;
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.metrics.revenue || 0), 0);
  const totalLeads = campaigns.reduce((sum, c) => sum + (c.metrics.leads || 0), 0);

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading campaign dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-8">
            {/* Title Section */}
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Campaign Manager Dashboard
                </h1>
                <p className="text-orange-100 text-sm">
                  Coordinate and manage marketing campaigns efficiently
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">{campaigns.length}</div>
                <div className="text-orange-100 text-xs">Total Campaigns</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">{totalActiveCampaigns}</div>
                <div className="text-orange-100 text-xs">Active</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">{totalCompletedCampaigns}</div>
                <div className="text-orange-100 text-xs">Completed</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">{totalLeads}</div>
                <div className="text-orange-100 text-xs">Total Leads</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button
            onClick={() => setShowCreateCampaign(true)}
            className="flex items-center justify-center space-x-2 p-4 h-auto"
          >
            <Plus className="w-5 h-5" />
            <span>New Campaign</span>
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center space-x-2 p-4 h-auto"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Analytics</span>
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center space-x-2 p-4 h-auto"
          >
            <Users className="w-5 h-5" />
            <span>Team Management</span>
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center space-x-2 p-4 h-auto"
          >
            <FileText className="w-5 h-5" />
            <span>Reports</span>
          </Button>
        </div>

        {/* Performance Overview */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-700">{totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-blue-600">Total Revenue (KSh)</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-700">{totalLeads}</div>
                <div className="text-sm text-green-600">Total Leads</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-700">
                  {campaigns.reduce((sum, c) => sum + c.assignedCreators.length, 0)}
                </div>
                <div className="text-sm text-purple-600">Content Creators</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <DollarSign className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-700">
                  {campaigns.reduce((sum, c) => sum + (c.budget || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-orange-600">Total Budget (KSh)</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Campaigns Grid */}
        <div className="space-y-6">
          {filteredCampaigns.map(campaign => (
            <Card key={campaign.id}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{campaign.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{campaign.description}</p>
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Deadline: {new Date(campaign.deadline).toLocaleDateString()}</span>
                      </div>
                      {campaign.budget && (
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span>Budget: KSh {campaign.budget.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Objective */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Objective</h4>
                  <p className="text-sm text-blue-800">{campaign.objective}</p>
                </div>

                {/* Metrics */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Campaign Metrics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">{campaign.metrics.reach?.toLocaleString() || 0}</div>
                      <div className="text-xs text-gray-500">Reach</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">{campaign.metrics.engagement?.toFixed(1) || 0}%</div>
                      <div className="text-xs text-gray-500">Engagement</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">{campaign.metrics.clicks?.toLocaleString() || 0}</div>
                      <div className="text-xs text-gray-500">Clicks</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">{campaign.metrics.conversions || 0}</div>
                      <div className="text-xs text-gray-500">Conversions</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">{campaign.metrics.leads || 0}</div>
                      <div className="text-xs text-gray-500">Leads</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">KSh {(campaign.metrics.revenue || 0).toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Revenue</div>
                    </div>
                  </div>
                </div>

                {/* Team Assignment */}
                <div className="mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="text-sm font-medium text-purple-900 mb-2">Content Creators ({campaign.assignedCreators.length})</h4>
                      <div className="flex flex-wrap gap-1">
                        {campaign.assignedCreators.map((creatorId, index) => (
                          <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            Creator {index + 1}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="text-sm font-medium text-green-900 mb-2">Sales Agents ({campaign.assignedSalesAgents.length})</h4>
                      <div className="flex flex-wrap gap-1">
                        {campaign.assignedSalesAgents.map((agentId, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Agent {index + 1}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reports */}
                {campaign.reports.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Reports ({campaign.reports.length})</h4>
                    <div className="space-y-2">
                      {campaign.reports.slice(0, 2).map(report => (
                        <div key={report.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="text-sm font-medium text-gray-900">{report.title}</h5>
                            <span className="text-xs text-gray-500">{report.period}</span>
                          </div>
                          <p className="text-xs text-gray-600">{report.content}</p>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Created: {new Date(campaign.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setShowCampaignDetails(true);
                      }}
                      className="flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setShowCreateCampaign(true);
                      }}
                      className="flex items-center space-x-1"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </Button>
                    {campaign.status === 'planning' && (
                      <Button
                        size="sm"
                        onClick={() => updateCampaignStatus(campaign.id, 'active')}
                        className="flex items-center space-x-1"
                      >
                        <Play className="w-4 h-4" />
                        <span>Launch</span>
                      </Button>
                    )}
                    {campaign.status === 'active' && (
                      <Button
                        size="sm"
                        onClick={() => updateCampaignStatus(campaign.id, 'paused')}
                        className="flex items-center space-x-1"
                      >
                        <Pause className="w-4 h-4" />
                        <span>Pause</span>
                      </Button>
                    )}
                    {campaign.status === 'paused' && (
                      <Button
                        size="sm"
                        onClick={() => updateCampaignStatus(campaign.id, 'active')}
                        className="flex items-center space-x-1"
                      >
                        <Play className="w-4 h-4" />
                        <span>Resume</span>
                      </Button>
                    )}
                    {campaign.status === 'active' && (
                      <Button
                        size="sm"
                        onClick={() => updateCampaignStatus(campaign.id, 'completed')}
                        className="flex items-center space-x-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Complete</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredCampaigns.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <Rocket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
              <p className="text-gray-600 mb-4">Create your first campaign or adjust your filters</p>
              <Button onClick={() => setShowCreateCampaign(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Campaign
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};
