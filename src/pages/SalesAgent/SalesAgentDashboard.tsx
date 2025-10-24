import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { Layout } from '../../components/Layout/Layout';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { 
  DollarSign, 
  Users, 
  Phone, 
  Mail, 
  Calendar,
  TrendingUp,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  FileText,
  BarChart3,
  Award
} from 'lucide-react';
import { SalesLead, Commission } from '../../types';

export const SalesAgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useModal();
  
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    const mockLeads: SalesLead[] = [
      {
        id: '1',
        clientName: 'John Smith',
        company: 'TechCorp Solutions',
        email: 'john@techcorp.com',
        phone: '+254 712 345 678',
        source: 'website',
        status: 'qualified',
        value: 50000,
        probability: 75,
        assignedTo: user?.uid || '',
        notes: 'Interested in web development services. Budget confirmed. Decision maker identified.',
        lastContact: new Date('2024-01-10'),
        nextFollowUp: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        companyId: user?.companyId || '',
        createdBy: 'admin-1'
      },
      {
        id: '2',
        clientName: 'Sarah Johnson',
        company: 'StartupXYZ',
        email: 'sarah@startupxyz.com',
        phone: '+254 723 456 789',
        source: 'referral',
        status: 'proposal-sent',
        value: 75000,
        probability: 60,
        assignedTo: user?.uid || '',
        notes: 'Referred by existing client. Needs mobile app development. Proposal sent, waiting for response.',
        lastContact: new Date('2024-01-12'),
        nextFollowUp: new Date('2024-01-18'),
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date(),
        companyId: user?.companyId || '',
        createdBy: 'admin-1'
      },
      {
        id: '3',
        clientName: 'Mike Wilson',
        company: 'E-commerce Plus',
        email: 'mike@ecommerceplus.com',
        phone: '+254 734 567 890',
        source: 'cold-call',
        status: 'closed-won',
        value: 100000,
        probability: 100,
        assignedTo: user?.uid || '',
        notes: 'Successfully closed! E-commerce platform development project. Contract signed.',
        lastContact: new Date('2024-01-14'),
        contractId: 'contract-123',
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date(),
        companyId: user?.companyId || '',
        createdBy: 'admin-1'
      }
    ];

    const mockCommissions: Commission[] = [
      {
        id: 'comm-1',
        salesAgentId: user?.uid || '',
        leadId: '3',
        amount: 5000,
        percentage: 5,
        status: 'approved',
        paidAt: new Date('2024-01-15'),
        createdAt: new Date('2024-01-14'),
        companyId: user?.companyId || ''
      }
    ];

    setLeads(mockLeads);
    setCommissions(mockCommissions);
    setIsLoading(false);
  }, [user]);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed-won': return 'text-green-600 bg-green-100';
      case 'closed-lost': return 'text-red-600 bg-red-100';
      case 'negotiation': return 'text-purple-600 bg-purple-100';
      case 'proposal-sent': return 'text-blue-600 bg-blue-100';
      case 'qualified': return 'text-yellow-600 bg-yellow-100';
      case 'contacted': return 'text-orange-600 bg-orange-100';
      case 'lead': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'website': return 'text-blue-600 bg-blue-100';
      case 'referral': return 'text-green-600 bg-green-100';
      case 'social': return 'text-purple-600 bg-purple-100';
      case 'cold-call': return 'text-orange-600 bg-orange-100';
      case 'other': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const updateLeadStatus = (leadId: string, newStatus: string) => {
    setLeads(prev => prev.map(lead => 
      lead.id === leadId 
        ? { ...lead, status: newStatus as any, updatedAt: new Date() }
        : lead
    ));
    showNotification({
      title: 'Lead Updated',
      message: `Lead status changed to ${newStatus}`,
      type: 'success'
    });
  };

  const totalRevenue = leads
    .filter(lead => lead.status === 'closed-won')
    .reduce((sum, lead) => sum + (lead.value || 0), 0);

  const totalCommissions = commissions
    .filter(comm => comm.status === 'paid')
    .reduce((sum, comm) => sum + comm.amount, 0);

  const pendingCommissions = commissions
    .filter(comm => comm.status === 'pending')
    .reduce((sum, comm) => sum + comm.amount, 0);

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading sales dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-8">
            {/* Title Section */}
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Sales Agent Dashboard
                </h1>
                <p className="text-green-100 text-sm">
                  Track leads, clients, and personal performance
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">{leads.length}</div>
                <div className="text-green-100 text-xs">Total Leads</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">{leads.filter(l => l.status === 'closed-won').length}</div>
                <div className="text-green-100 text-xs">Closed Won</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">KSh {totalRevenue.toLocaleString()}</div>
                <div className="text-green-100 text-xs">Revenue</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">KSh {totalCommissions.toLocaleString()}</div>
                <div className="text-green-100 text-xs">Commissions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button
            onClick={() => setShowCreateLead(true)}
            className="flex items-center justify-center space-x-2 p-4 h-auto"
          >
            <Plus className="w-5 h-5" />
            <span>New Lead</span>
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center space-x-2 p-4 h-auto"
          >
            <Phone className="w-5 h-5" />
            <span>Call Log</span>
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center space-x-2 p-4 h-auto"
          >
            <FileText className="w-5 h-5" />
            <span>Contracts</span>
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center space-x-2 p-4 h-auto"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Analytics</span>
          </Button>
        </div>

        {/* Commission Summary */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-700">KSh {totalCommissions.toLocaleString()}</div>
                <div className="text-sm text-green-600">Total Earned</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-700">KSh {pendingCommissions.toLocaleString()}</div>
                <div className="text-sm text-yellow-600">Pending</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-700">{commissions.length}</div>
                <div className="text-sm text-blue-600">Total Commissions</div>
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
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Status</option>
                <option value="lead">Lead</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal-sent">Proposal Sent</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed-won">Closed Won</option>
                <option value="closed-lost">Closed Lost</option>
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Sources</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="social">Social Media</option>
                <option value="cold-call">Cold Call</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Leads Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredLeads.map(lead => (
            <Card key={lead.id}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{lead.clientName}</h3>
                    <p className="text-sm text-gray-600">{lead.company}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Mail className="w-4 h-4" />
                        <span>{lead.email}</span>
                      </div>
                      {lead.phone && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Phone className="w-4 h-4" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(lead.status)}`}>
                      {lead.status.replace('-', ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSourceColor(lead.source)}`}>
                      {lead.source}
                    </span>
                  </div>
                </div>

                {/* Value and Probability */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    {lead.value && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">KSh {lead.value.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Value</div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{lead.probability}%</div>
                      <div className="text-xs text-gray-500">Probability</div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>Created: {new Date(lead.createdAt).toLocaleDateString()}</div>
                    {lead.lastContact && (
                      <div>Last Contact: {new Date(lead.lastContact).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {lead.notes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{lead.notes}</p>
                  </div>
                )}

                {/* Next Follow Up */}
                {lead.nextFollowUp && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Next Follow Up:</span>
                      <span className="text-sm text-blue-700">{new Date(lead.nextFollowUp).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedLead(lead);
                        setShowLeadDetails(true);
                      }}
                      className="flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedLead(lead);
                        setShowCreateLead(true);
                      }}
                      className="flex items-center space-x-1"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    {lead.status === 'qualified' && (
                      <Button
                        size="sm"
                        onClick={() => updateLeadStatus(lead.id, 'proposal-sent')}
                        className="flex items-center space-x-1"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Send Proposal</span>
                      </Button>
                    )}
                    {lead.status === 'proposal-sent' && (
                      <Button
                        size="sm"
                        onClick={() => updateLeadStatus(lead.id, 'negotiation')}
                        className="flex items-center space-x-1"
                      >
                        <Target className="w-4 h-4" />
                        <span>Start Negotiation</span>
                      </Button>
                    )}
                    {lead.status === 'negotiation' && (
                      <Button
                        size="sm"
                        onClick={() => updateLeadStatus(lead.id, 'closed-won')}
                        className="flex items-center space-x-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Close Won</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
              <p className="text-gray-600 mb-4">Create your first lead or adjust your filters</p>
              <Button onClick={() => setShowCreateLead(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Lead
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};
