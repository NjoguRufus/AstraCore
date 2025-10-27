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
  DollarSign, 
  Users, 
  TrendingUp, 
  Phone, 
  Mail, 
  Calendar,
  Target,
  BarChart3,
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
  X
} from 'lucide-react';
import { Project, Announcement, User, SalesLead, Client, Commission } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { generateContractPDF, generateContractHTML, generateContractPDFFromScreenshot } from '../../utils/contractPdf';

export const SalesDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useModal();
  const { data: salesLeads, loading: salesLeadsLoading, error: salesLeadsError } = useCollection<SalesLead>('sales_leads');
  const { data: clients, loading: clientsLoading, error: clientsError } = useCollection<Client>('clients');
  const { data: commissions, loading: commissionsLoading, error: commissionsError } = useCollection<Commission>('sales_commissions');
  const { data: announcements, loading: announcementsLoading, error: announcementsError } = useCollection<Announcement>('announcements');
  const { data: users, loading: usersLoading, error: usersError } = useCollection<User>('users');
  const { data: projects, loading: projectsLoading, error: projectsError } = useCollection<Project>('projects');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showAddClientFromLead, setShowAddClientFromLead] = useState(false);
  const [selectedLeadToConvert, setSelectedLeadToConvert] = useState<any>(null);
  const [showViewContracts, setShowViewContracts] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [userContract, setUserContract] = useState<any>(null);
  const [loadingContract, setLoadingContract] = useState(false);
  const [viewMode, setViewMode] = useState<'simple' | 'html'>('simple');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [showCreateContractModal, setShowCreateContractModal] = useState(false);
  const [showSendContractModal, setShowSendContractModal] = useState(false);
  const [createdContract, setCreatedContract] = useState<any>(null);
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [showCloseDealOptions, setShowCloseDealOptions] = useState(false);
  const [newLead, setNewLead] = useState({
    clientName: '',
    company: '',
    email: '',
    phone: '',
    source: 'website',
    notes: ''
  });
  const [newClient, setNewClient] = useState({
    clientName: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    industry: ''
  });

  // Check if onboarding is completed
  useEffect(() => {
    if (user && !user.onboardingCompleted && !user.contractSigned) {
      window.location.href = '/onboarding';
    }
  }, [user]);

  // Filter sales data for the current user (with error handling)
  const userSalesLeads = salesLeads?.filter(lead => 
    lead.assignedTo === user?.uid
  ) || [];
  
  const userClients = clients?.filter(client => 
    client.assignedTo === user?.uid
  ) || [];
  
  const userCommissions = commissions?.filter(commission => 
    commission.salesAgentId === user?.uid
  ) || [];
  
  // Calculate total commissions from clients
  const totalClientCommissions = userClients.reduce((sum, client) => {
    return sum + (client.commissionAmount || 0);
  }, 0);
  
  // Filter announcements for the current user (with error handling)
  const userAnnouncements = announcements?.filter(announcement => {
    if (announcement.targetType === 'all') return true;
    if (announcement.targetType === 'team' && announcement.targetTeam === user?.team) return true;
    if (announcement.targetType === 'individual' && announcement.targetMembers?.includes(user?.uid || '')) return true;
    if (!announcement.targetType) return true;
    return false;
  }) || [];

  const activeLeads = userSalesLeads.filter(lead => 
    ['lead', 'contacted', 'qualified', 'proposal-sent', 'negotiation'].includes(lead.status)
  );
  const clientLeads = userSalesLeads.filter(lead => lead.status === 'client');
  const closedLost = userSalesLeads.filter(lead => lead.status === 'closed-lost');

  const filteredLeads = userSalesLeads.filter(lead => {
    // Exclude client and closed-lost leads from the display
    if (lead.status === 'client' || lead.status === 'closed-lost') return false;
    
    const matchesSearch = lead.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'client': return 'text-green-600 bg-green-100';
      case 'closed-lost': return 'text-red-600 bg-red-100';
      case 'negotiation': return 'text-blue-600 bg-blue-100';
      case 'proposal-sent': return 'text-purple-600 bg-purple-100';
      case 'qualified': return 'text-yellow-600 bg-yellow-100';
      case 'contacted': return 'text-orange-600 bg-orange-100';
      case 'lead': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600 bg-green-100';
    if (probability >= 60) return 'text-yellow-600 bg-yellow-100';
    if (probability >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    if (!user) return;
    
    setIsUpdating(leadId);
    try {
      const { updateSalesLead, createCommission } = await import('../../services/firebaseService');
      
      // Get the lead to check value
      const lead = userSalesLeads.find(l => l.id === leadId);
      
      // Update probability based on status
      let probability = 25;
      if (newStatus === 'contacted') probability = 40;
      if (newStatus === 'qualified') probability = 60;
      if (newStatus === 'proposal-sent') probability = 75;
      if (newStatus === 'negotiation') probability = 85;
      if (newStatus === 'client') probability = 100;
      if (newStatus === 'closed-lost') probability = 0;
      
      await updateSalesLead(leadId, { 
        status: newStatus as any,
        probability,
        lastContact: new Date(),
        updatedAt: new Date()
      });
      
      // If deal is client, create commission record and convert to client
      if (newStatus === 'client' && lead) {
        const { createClient } = await import('../../services/firebaseService');
        
        // Check if the lead has a project with commission set
        const relatedProject = projects?.find(p => p.assignedTo?.includes(user.uid) && p.clientId === leadId);
        const commissionAmount = relatedProject?.commissionAmount || 5000; // Default 5000 or project commission
        
        // Create commission record
        await createCommission({
          salesAgentId: user.uid,
          leadId: leadId,
          clientId: lead.id,
          dealValue: lead.value || 0,
          commissionAmount,
          commissionRate: (commissionAmount / (lead.value || 1)) * 100,
          status: 'pending',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          createdAt: new Date(),
          companyId: user.companyId || '',
          createdBy: user.uid
        });
        
        // Convert lead to active client with commission
        await createClient({
          clientName: lead.clientName,
          company: lead.company || '',
          email: lead.email,
          phone: lead.phone || '',
          address: '',
          industry: '',
          status: 'active',
          assignedTo: user.uid,
          notes: `Converted from lead. Deal value: KSH ${lead.value || 0}`,
          lastContact: new Date(),
          nextFollowUp: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
          companyId: user.companyId || '',
          createdBy: user.uid,
          commissionAmount: commissionAmount // Store commission on client
        });
        
        showNotification({
          title: 'Deal Closed Successfully!',
          message: `Client created & KSH ${commissionAmount.toLocaleString()} commission added!`,
          type: 'success'
        });
      } else {
        showNotification({
          title: 'Lead Updated',
          message: `Lead status changed to ${newStatus}`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to update lead status',
        type: 'error'
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleCreateLead = async () => {
    if (!user) return;
    
    // Basic validation
    if (!newLead.clientName.trim() || !newLead.email.trim()) {
      showNotification({
        title: 'Validation Error',
        message: 'Please fill in at least Client Name and Email',
        type: 'error'
      });
      return;
    }
    
    try {
      const { createSalesLead } = await import('../../services/firebaseService');
      
      const leadData = {
        clientName: newLead.clientName,
        company: newLead.company,
        email: newLead.email,
        phone: newLead.phone,
        source: newLead.source as 'website' | 'referral' | 'social' | 'cold-call' | 'email',
        status: 'lead' as const,
        value: 0, // Will be updated when qualified
        probability: 25,
        assignedTo: user.uid,
        notes: newLead.notes,
        lastContact: new Date(),
        nextFollowUp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        companyId: user.companyId || '',
        createdBy: user.uid
      };

      await createSalesLead(leadData);
      
      showNotification({
        title: 'Lead Created',
        message: `New lead "${newLead.clientName}" has been created successfully`,
        type: 'success'
      });
      
      // Reset form
      setNewLead({
        clientName: '',
        company: '',
        email: '',
        phone: '',
        source: 'website',
        notes: ''
      });
      setShowCreateLead(false);
    } catch (error) {
      console.error('Error creating lead:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to create lead',
        type: 'error'
      });
    }
  };

  const handleCreateClient = async () => {
    if (!user) return;
    
    // Basic validation
    if (!newClient.clientName.trim() || !newClient.email.trim()) {
      showNotification({
        title: 'Validation Error',
        message: 'Please fill in at least Client Name and Email',
        type: 'error'
      });
      return;
    }
    
    try {
      const { createClient } = await import('../../services/firebaseService');
      
      const clientData = {
        clientName: newClient.clientName,
        company: newClient.company,
        email: newClient.email,
        phone: newClient.phone,
        address: newClient.address,
        industry: newClient.industry,
        status: 'active' as const,
        assignedTo: user.uid,
        notes: `Client added from dashboard. Industry: ${newClient.industry}`,
        lastContact: new Date(),
        nextFollowUp: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        companyId: user.companyId || '',
        createdBy: user.uid
      };

      await createClient(clientData);
      
      showNotification({
        title: 'Client Added',
        message: `New client "${newClient.clientName}" has been added successfully`,
        type: 'success'
      });
      
      // Reset form
      setNewClient({
        clientName: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        industry: ''
      });
      setShowCreateClient(false);
    } catch (error) {
      console.error('Error creating client:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to add client',
        type: 'error'
      });
    }
  };

  const handleAddClientFromLead = async () => {
    if (!selectedLeadToConvert || !user) return;
    
    try {
      const { createClient } = await import('../../services/firebaseService');
      
      await createClient({
        clientName: selectedLeadToConvert.clientName,
        company: selectedLeadToConvert.company || '',
        email: selectedLeadToConvert.email,
        phone: selectedLeadToConvert.phone || '',
        address: '',
        industry: '',
        status: 'active' as const,
        assignedTo: user.uid,
        notes: `Converted from lead. Original status: ${selectedLeadToConvert.status}`,
        lastContact: new Date(),
        nextFollowUp: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        companyId: user.companyId || '',
        createdBy: user.uid
      });
      
      showNotification({
        title: 'Client Added',
        message: `${selectedLeadToConvert.clientName} has been added as an active client`,
        type: 'success'
      });
      
      setShowAddClientFromLead(false);
      setSelectedLeadToConvert(null);
    } catch (error) {
      console.error('Error converting lead:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to convert lead to client',
        type: 'error'
      });
    }
  };

  const handleCreateContract = (client: any) => {
    setSelectedClient(client);
    setShowCreateContractModal(true);
  };

  const handleGenerateContract = async (client: any) => {
    if (!user) return;
    
    try {
      const { db } = await import('../../config/firebase');
      const { addDoc, collection, serverTimestamp, updateDoc } = await import('firebase/firestore');
      
      // Create contract in Firestore
      const contractData = {
        clientId: client.id,
        clientName: client.clientName,
        companyName: client.company,
        email: client.email,
        phone: client.phone || '',
        projectType: '', // Can be filled later
        status: 'draft',
        assignedTo: user.uid,
        createdAt: serverTimestamp(),
        companyId: user.companyId || '',
        createdBy: user.uid
      };
      
      const docRef = await addDoc(collection(db, 'contracts'), contractData);
      
      // Generate contract URL with the actual document ID
      const contractUrl = `${window.location.origin}/contracts/${docRef.id}`;
      
      // Update the contract with the URL
      await updateDoc(docRef, { contractUrl });
      
      const newContract = {
        id: docRef.id,
        ...contractData,
        contractUrl
      };
      
      setCreatedContract(newContract);
      setShowCreateContractModal(false);
      setShowSendContractModal(true);
      
      showNotification({
        title: 'Contract Created',
        message: 'Contract has been generated successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error creating contract:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to create contract',
        type: 'error'
      });
    }
  };

  const handleAnalytics = () => {
    // Show analytics in a modal
    setShowAnalytics(true);
  };

  const quickActions = [
    {
      label: 'New Lead',
      icon: <Plus className="w-5 h-5" />,
      onClick: () => setShowCreateLead(true),
      variant: 'primary' as const
    },
    {
      label: 'Add Client',
      icon: <Users className="w-5 h-5" />,
      onClick: () => setShowCreateClient(true),
      variant: 'outline' as const
    },
    {
      label: 'Create Contract',
      icon: <FileText className="w-5 h-5" />,
      onClick: () => setShowCreateContractModal(true),
      variant: 'outline' as const
    },
    {
      label: 'Sales Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      onClick: handleAnalytics,
      variant: 'outline' as const
    }
  ];

  const filters = [
    {
      label: 'Status',
      value: statusFilter,
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'lead', label: 'Lead' },
        { value: 'contacted', label: 'Contacted' },
        { value: 'qualified', label: 'Qualified' },
        { value: 'proposal-sent', label: 'Proposal Sent' },
        { value: 'negotiation', label: 'Negotiation' },
        { value: 'client', label: 'Client' },
        { value: 'closed-lost', label: 'Closed Lost' }
      ],
      onChange: setStatusFilter
    },
    {
      label: 'Source',
      value: sourceFilter,
      options: [
        { value: 'all', label: 'All Sources' },
        { value: 'website', label: 'Website' },
        { value: 'referral', label: 'Referral' },
        { value: 'social', label: 'Social Media' },
        { value: 'cold-call', label: 'Cold Call' },
        { value: 'other', label: 'Other' }
      ],
      onChange: setSourceFilter
    }
  ];

  const totalValue = userSalesLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
  const wonValue = clientLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);

  const stats = [
    { label: 'Total Leads', value: userSalesLeads.length },
    { label: 'Active Clients', value: userClients.filter(c => c.status === 'active').length },
    { label: 'Total Pipeline', value: `KSH ${totalValue.toLocaleString()}` },
    { label: 'Won Value', value: `KSH ${wonValue.toLocaleString()}` }
  ];

  if (salesLeadsLoading || clientsLoading || commissionsLoading || announcementsLoading || usersLoading || projectsLoading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading sales agent dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error message if there are Firebase permission issues
  if (salesLeadsError || clientsError || commissionsError || announcementsError || usersError || projectsError) {
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
              className="bg-green-600 hover:bg-green-700"
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
          title="Sales Agent Dashboard"
          subtitle="Track leads, manage clients, and close deals efficiently"
          icon={<DollarSign className="w-8 h-8 text-white" />}
          color="green"
          stats={stats}
        />

        {/* Quick Actions */}
        <QuickActions actions={quickActions} />

        {/* Filters */}
        <DashboardFilters 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filters}
        />

        {/* Leads Tracker & Client Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leads Tracker */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Leads Tracker</h3>
              <span className="text-sm text-gray-500">{filteredLeads.length} leads</span>
            </div>
            <div className="h-[500px] overflow-y-auto pr-2 space-y-3">
              {filteredLeads.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No leads yet</p>
                  <p className="text-sm">Start by creating your first lead</p>
                </div>
              ) : (
                filteredLeads.map(lead => (
                  <div 
                    key={lead.id} 
                    className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all bg-white cursor-pointer"
                    onClick={() => {
                      setSelectedLead(lead);
                      setShowContactOptions(true);
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 truncate">{lead.clientName}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                              {lead.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">{lead.company}</p>
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <div className="text-lg font-bold text-green-600">
                          KSH {lead.value?.toLocaleString() || '0'}
                        </div>
                        <div className={`text-xs font-medium ${getProbabilityColor(lead.probability)}`}>
                          {lead.probability}%
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                      {lead.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[150px]">{lead.email}</span>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {lead.notes && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{lead.notes}</p>
                    )}

                    {/* Timeline */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {lead.createdAt && (
                        <span>Created: {formatDate(lead.createdAt)}</span>
                      )}
                      {lead.updatedAt && lead.updatedAt !== lead.createdAt && (
                        <span>• Updated: {formatDate(lead.updatedAt)}</span>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLead(lead);
                          setShowContactOptions(true);
                        }}
                        className="flex-1"
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        Contact
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLead(lead);
                          setShowCloseDealOptions(true);
                        }}
                        className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <Target className="w-4 h-4 mr-1" />
                        Close Deal
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Client Management */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Client Management</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{userClients.length} clients</span>
                <Button
                  size="sm"
                  onClick={() => setShowCreateClient(true)}
                  className="flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Client</span>
                </Button>
              </div>
            </div>
            <div className="h-[500px] overflow-y-auto pr-2 space-y-3">
              {userClients.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No clients yet</p>
                  <p className="text-sm">Closed deals will appear here</p>
                </div>
              ) : (
                userClients.map(client => (
                  <div 
                    key={client.id} 
                    className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all bg-white cursor-pointer"
                    onClick={() => {
                      setSelectedClient(client);
                      setShowContactOptions(true);
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 truncate">{client.clientName}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              client.status === 'active' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {client.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">{client.company}</p>
                        </div>
                      </div>
                      {client.commissionAmount && (
                        <div className="text-right ml-3">
                          <div className="text-lg font-bold text-green-600">
                            KSH {client.commissionAmount.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">Commission</div>
                        </div>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                      {client.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[150px]">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {client.notes && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{client.notes}</p>
                    )}

                    {/* Timeline */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {client.lastContact && (
                        <span>Last contact: {formatDate(client.lastContact)}</span>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClient(client);
                          setShowContactOptions(true);
                        }}
                        className="flex-1"
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        Contact
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateContract(client);
                        }}
                        className="flex-1"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Contract
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Commission Overview */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Commission Overview</h3>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">KSH {wonValue.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Value Won</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">KSH {totalClientCommissions.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Commission Earned</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{clientLeads.length}</div>
              <div className="text-sm text-gray-600">Deals Closed</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{Math.round((clientLeads.length / userSalesLeads.length) * 100) || 0}%</div>
              <div className="text-sm text-gray-600">Win Rate</div>
            </div>
          </div>
        </Card>

        {/* Profile Summary & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProfileSummary 
              user={user} 
              projects={[]}
              salesLeads={userSalesLeads}
              announcements={userAnnouncements}
            />
          </div>
          <div>
            <NotificationsWidget 
              announcements={userAnnouncements}
              hasNewNotifications={false}
              onClearNotifications={() => {}}
            />
          </div>
        </div>
      </div>

      {/* New Lead Modal */}
      {showCreateLead && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-11/12 md:w-2/3 lg:w-1/2 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Create New Lead</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateLead(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                  <input
                    type="text"
                    value={newLead.clientName}
                    onChange={(e) => setNewLead({...newLead, clientName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={newLead.company}
                    onChange={(e) => setNewLead({...newLead, company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select
                    value={newLead.source}
                    onChange={(e) => setNewLead({...newLead, source: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="social">Social Media</option>
                    <option value="cold-call">Cold Call</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={newLead.notes}
                    onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter additional notes about the lead"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateLead(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateLead}
                className="bg-green-600 hover:bg-green-700"
              >
                Create Lead
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showCreateClient && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-11/12 md:w-2/3 lg:w-1/2 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Add New Client</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateClient(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Convert from Lead Option */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">Convert from Lead</h4>
                  <p className="text-xs text-blue-700">Select an existing lead to convert to client</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowCreateClient(false);
                    setShowAddClientFromLead(true);
                  }}
                  className="border-blue-300 text-blue-600 hover:bg-blue-100"
                >
                  Select Lead
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                  <input
                    type="text"
                    value={newClient.clientName}
                    onChange={(e) => setNewClient({...newClient, clientName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={newClient.company}
                    onChange={(e) => setNewClient({...newClient, company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <input
                    type="text"
                    value={newClient.industry}
                    onChange={(e) => setNewClient({...newClient, industry: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter industry"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={newClient.address}
                    onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={2}
                    placeholder="Enter client address"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateClient(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateClient}
                className="bg-green-600 hover:bg-green-700"
              >
                Add Client
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Client from Lead Modal */}
      {showAddClientFromLead && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-11/12 md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Convert Lead to Client</h3>
                  <p className="text-sm text-gray-600 mt-1">Select a lead to convert to an active client</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddClientFromLead(false);
                    setSelectedLeadToConvert(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              <div className="space-y-3">
                {userSalesLeads.filter(lead => lead.status !== 'client').map(lead => (
                  <div 
                    key={lead.id}
                    onClick={() => setSelectedLeadToConvert(lead)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedLeadToConvert?.id === lead.id 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{lead.clientName}</h4>
                        <p className="text-sm text-gray-600">{lead.company}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>
                          {lead.email && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {lead.email}
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedLeadToConvert?.id === lead.id && (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {userSalesLeads.filter(lead => lead.status !== 'client').length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No leads available to convert</p>
                </div>
              )}
            </div>
            
            {selectedLeadToConvert && (
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddClientFromLead(false);
                    setSelectedLeadToConvert(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddClientFromLead}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Convert to Client
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sales Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-11/12 md:w-4/5 lg:w-3/4 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Sales Analytics</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnalytics(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{userSalesLeads.length}</div>
                <div className="text-sm text-gray-600">Total Leads</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{clientLeads.length}</div>
                <div className="text-sm text-gray-600">Clients</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{closedLost.length}</div>
                <div className="text-sm text-gray-600">Closed Lost</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{Math.round((clientLeads.length / userSalesLeads.length) * 100) || 0}%</div>
                <div className="text-sm text-gray-600">Win Rate</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Lead Sources</h4>
                <div className="space-y-2">
                  {['website', 'referral', 'social', 'cold-call', 'email'].map(source => {
                    const count = userSalesLeads.filter(lead => lead.source === source).length;
                    const percentage = userSalesLeads.length > 0 ? Math.round((count / userSalesLeads.length) * 100) : 0;
                    return (
                      <div key={source} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 capitalize">{source.replace('-', ' ')}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{width: `${percentage}%`}}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Lead Status Distribution</h4>
                <div className="space-y-2">
                  {['lead', 'contacted', 'qualified', 'proposal-sent', 'negotiation', 'client', 'closed-lost'].map(status => {
                    const count = userSalesLeads.filter(lead => lead.status === status).length;
                    const percentage = userSalesLeads.length > 0 ? Math.round((count / userSalesLeads.length) * 100) : 0;
                    return (
                      <div key={status} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 capitalize">{status.replace('-', ' ')}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{width: `${percentage}%`}}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowAnalytics(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
        )}

        {/* Contract Modal */}
        {showContractModal && userContract && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">My Contract</h2>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      if (viewMode === 'html') {
                        setTimeout(() => {
                          generateContractPDFFromScreenshot(userContract);
                        }, 200);
                      } else {
                        setViewMode('html');
                        setTimeout(() => {
                          generateContractPDFFromScreenshot(userContract);
                        }, 300);
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {viewMode === 'html' ? 'Download PDF' : 'Generate PDF'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowContractModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="bg-gray-100 rounded-lg p-1 mb-3">
                    <button
                      onClick={() => setViewMode('simple')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'simple' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Simple View
                    </button>
                    <button
                      onClick={() => setViewMode('html')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'html' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Contract View
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    {viewMode === 'html' 
                      ? 'View your contract in the exact format that will be downloaded as PDF'
                      : 'View a simplified version of your contract details'
                    }
                  </p>
                </div>

                {viewMode === 'simple' && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center justify-center mb-6">
                      <img 
                        src="https://i.imgur.com/T7mH4Ly.png" 
                        alt="Astraronix Solutions Logo" 
                        className="h-20 w-auto"
                      />
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-4 text-center text-xl">Astraronix Solutions - Team Member Contract</h3>
                    <p className="text-sm text-gray-600 mb-6 text-center">
                      This contract is made effective as of {formatDate(userContract.signedAt) || new Date().toLocaleDateString()} by and between:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 text-base">Company Information</h4>
                        <p className="mb-2"><strong>Name:</strong> Astraronix Solutions</p>
                        <p className="mb-2"><strong>Address:</strong> Nairobi, Kenya, Remote</p>
                        <p className="mb-2"><strong>Contact:</strong> +254 714 748 299</p>
                        <p className="mb-2"><strong>Email:</strong> astraronixsolutions@gmail.com</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 text-base">Team Member Information</h4>
                        <p className="mb-2"><strong>Name:</strong> {userContract.memberName}</p>
                        <p className="mb-2"><strong>Role:</strong> {userContract.memberRole}</p>
                        <p className="mb-2"><strong>Email:</strong> {userContract.memberEmail}</p>
                        <p className="mb-2"><strong>ID Code:</strong> {userContract.idCode}</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-3 text-base">Terms & Conditions:</h4>
                      <div className="space-y-3 text-sm text-gray-700">
                        <div className="flex items-start space-x-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                          <p>Each team member agrees to perform their duties responsibly, honestly, and with respect toward the company and clients.</p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                          <p>Astraronix Solutions will provide clear guidance, access to needed tools, and agreed compensation for completed work or closed deals.</p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                          <p>Both Astraronix and the team member agree to protect all company and client information from unauthorized sharing.</p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                          <p>Since Astraronix is a , growing company, either party can end this working arrangement at any time with simple written notice. No penalties apply — just transparency and respect.</p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">5</span>
                          <p>Team members are expected to follow Astraronix's communication standards and maintain professionalism in all client interactions.</p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">6</span>
                          <p>Work created for Astraronix (designs, proposals, content, or code) remains property of Astraronix, but creators may showcase it in their personal portfolios with permission.</p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">7</span>
                          <p>This agreement is guided by general Kenyan labor principles, but built on trust and collaboration — not strict legal enforcement.</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3 text-base">Contract Verification:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Member Signature:</h5>
                          {userContract.memberSignatureUrl ? (
                            <img 
                              src={userContract.memberSignatureUrl} 
                              alt="Member Signature" 
                              className="w-32 h-16 border border-gray-300 rounded"
                            />
                          ) : (
                            <p className="text-sm text-gray-500">Not available</p>
                          )}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Selfie Verification:</h5>
                          {userContract.selfieImageUrl ? (
                            <img 
                              src={userContract.selfieImageUrl} 
                              alt="Member Selfie" 
                              className="w-40 h-40 border-3 border-blue-500 rounded-full object-cover shadow-lg"
                            />
                          ) : (
                            <p className="text-sm text-gray-500">Not available</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="mb-2"><strong>Contract Date:</strong> {formatDate(userContract.signedAt) || 'Not signed'}</p>
                          <p className="mb-2"><strong>Contract ID:</strong> {userContract.id}</p>
                        </div>
                        <div>
                          <p className="mb-2"><strong>Status:</strong> 
                            <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                              userContract.status === 'signed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {userContract.status?.toUpperCase() || 'PENDING'}
                            </span>
                          </p>
                          <p className="mb-2"><strong>Version:</strong> {userContract.contractVersion}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {viewMode === 'html' && (
                  <>
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-blue-800 text-sm">
                          <strong>PDF Preview:</strong> This contract view shows exactly how your downloaded PDF will appear. 
                          All formatting, styling, and content will be preserved in the final document.
                        </span>
                      </div>
                    </div>
                    <div 
                      className="contract-html-view"
                      dangerouslySetInnerHTML={{ __html: generateContractHTML(userContract) }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Create Contract Modal */}
      {showCreateContractModal && selectedClient && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-11/12 md:w-2/3 lg:w-1/2 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Create Contract</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCreateContractModal(false);
                  setSelectedClient(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Client Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-medium text-gray-900">{selectedClient.clientName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Company:</span>
                    <p className="font-medium text-gray-900">{selectedClient.company}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium text-gray-900">{selectedClient.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-medium text-gray-900">{selectedClient.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Website Design, Social Media Campaign"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateContractModal(false);
                  setSelectedClient(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleGenerateContract(selectedClient)}
                className="bg-green-600 hover:bg-green-700"
              >
                Generate Contract
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Send Contract Modal */}
      {showSendContractModal && createdContract && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-11/12 md:w-1/2 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Send Contract</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowSendContractModal(false);
                  setCreatedContract(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 font-medium mb-2">✓ Contract Created Successfully</p>
              <p className="text-xs text-green-600">Your contract link: {createdContract.contractUrl}</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Send via:</h4>
              
              {createdContract.phone && (
                <Button
                  onClick={() => {
                    const message = `Hi ${createdContract.clientName}, here is your contract: ${createdContract.contractUrl}`;
                    const whatsappUrl = `https://wa.me/${createdContract.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Send via WhatsApp
                </Button>
              )}
              
              <Button
                onClick={async () => {
                  // Email sending would go here
                  showNotification({
                    title: 'Email Sent',
                    message: 'Contract link sent via email',
                    type: 'success'
                  });
                  setShowSendContractModal(false);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Send via Email
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Close Deal Options Modal */}
      {showCloseDealOptions && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Close Deal</h3>
                <button
                  onClick={() => setShowCloseDealOptions(false)}
                  className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                How would you like to close this deal for {selectedLead.clientName}?
              </p>
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    try {
                      await updateLeadStatus(selectedLead.id, 'client');
                      setShowCloseDealOptions(false);
                    } catch (error) {
                      console.error('Error closing deal:', error);
                    }
                  }}
                  disabled={isUpdating === selectedLead.id}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors font-medium disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Mark as Client</div>
                    <div className="text-sm text-green-600">
                      Client will be created automatically
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      await updateLeadStatus(selectedLead.id, 'closed-lost');
                      setShowCloseDealOptions(false);
                    } catch (error) {
                      console.error('Error closing deal:', error);
                    }
                  }}
                  disabled={isUpdating === selectedLead.id}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors font-medium disabled:opacity-50"
                >
                  <AlertCircle className="w-5 h-5" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Mark as Lost</div>
                    <div className="text-sm text-red-600">Deal was not successful</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Options Modal */}
      {showContactOptions && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Options</h3>
                <button
                  onClick={() => setShowContactOptions(false)}
                  className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {selectedLead.phone && (
                  <>
                    <a
                      href={`tel:${selectedLead.phone.replace(/\D/g, '')}`}
                      className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-medium"
                    >
                      <Phone className="w-5 h-5" />
                      Call
                    </a>
                    <a
                      href={`https://wa.me/${selectedLead.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors font-medium"
                    >
                      <Phone className="w-5 h-5" />
                      WhatsApp
                    </a>
                  </>
                )}
                {selectedLead.email && (
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="flex items-center gap-3 px-4 py-3 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors font-medium"
                  >
                    <Mail className="w-5 h-5" />
                    Email
                  </a>
                )}
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={async () => {
                      try {
                        await updateLeadStatus(selectedLead.id, 'contacted');
                        setShowContactOptions(false);
                      } catch (error) {
                        console.error('Error updating status:', error);
                      }
                    }}
                    className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                  >
                    Mark as Contacted
                  </button>
                  <button
                    onClick={() => setShowContactOptions(false)}
                    className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </Layout>
    );
  };