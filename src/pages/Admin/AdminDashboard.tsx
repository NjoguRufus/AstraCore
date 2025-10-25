import React, { useState, useEffect } from 'react';
import { useCollection } from '../../hooks/useFirestore';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { 
  createUser, 
  createProject, 
  createAnnouncement, 
  generateIdCode,
  toggleUserStatus,
  getContractByUserId,
  createTeam,
  getTeams,
  resetCompletedProject
} from '../../services/firebaseService';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Layout } from '../../components/Layout/Layout';
import { generateContractPDF, generateContractPDFFromScreenshot } from '../../utils/contractPdf';
import { formatDate } from '../../utils/dateUtils';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  UserPlus, 
  FileText,
  Bell,
  Target,
  BookOpen,
  RefreshCw,
  UserCheck,
  UserX,
  Power,
  PowerOff,
  Download,
  AlertCircle,
  X,
  Activity,
  Monitor,
  Eye,
  TrendingUp,
  Clock,
  Shield,
  Search,
  Filter,
  Calendar,
  BarChart3,
  Settings,
  UserCog,
  FileUp,
  FileDown,
  Trash,
  LogIn,
  LogOut,
  Database,
  HardDrive,
  Network,
  Zap
} from 'lucide-react';
import { User, Project, Announcement, Team } from '../../types';
import ContentDashboard from '../../dashboards/ContentDashboard';
import { DeveloperDashboard } from '../dashboard/developer';
import { SalesDashboard } from '../dashboard/sales';
import { CampaignDashboard } from '../dashboard/campaign';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useModal();
  const { data: users } = useCollection<User>('users');
  const { data: projects } = useCollection<Project>('projects');
  const { data: announcements } = useCollection<Announcement>('announcements');
  const { data: teams } = useCollection<Team>('teams');
  const { data: activityLogs } = useCollection<any>('activity_logs');
  const { data: loginLogs } = useCollection<any>('login_logs');
  const { data: fileUploads } = useCollection<any>('uploaded_files');
  const { data: contentTasks } = useCollection<any>('content_tasks');
  const { data: notifications } = useCollection<any>('notifications');
  


  const [showCreateMember, setShowCreateMember] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedMemberContract, setSelectedMemberContract] = useState<any>(null);
  const [loadingContract, setLoadingContract] = useState(false);
  
  // Team Management States
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('7'); // days

  const [memberForm, setMemberForm] = useState({
    name: '',
    role: 'dev' as 'admin' | 'dev' | 'design' | 'cyber' | 'analyst' | 'sales' | 'marketing' | 'campaign',
    team: '',
    idCode: '',
    status: 'pending' as 'active' | 'deactivated' | 'pending'
  });

  const [showNewTeamInput, setShowNewTeamInput] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [resettingProject, setResettingProject] = useState<string | null>(null);

  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    assignedTo: [] as string[],
    assignedTeam: '',
    assignedType: '' as '' | 'individual' | 'team' | 'hybrid',
    status: 'upcoming' as 'upcoming' | 'in-progress' | 'completed',
    deadline: ''
  });



  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    targetType: '' as '' | 'all' | 'team' | 'individual',
    targetTeam: '',
    targetMembers: [] as string[]
  });

  const activeMembers = users?.filter(u => u.status === 'active') || [];
  const deactivatedMembers = users?.filter(u => u.status === 'deactivated') || [];
  
  // Team Management Helper Functions
  const getFilteredMembers = () => {
    let filtered = users || [];
    
    if (searchTerm) {
      filtered = filtered.filter(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.idCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterTeam !== 'all') {
      filtered = filtered.filter(member => member.team === filterTeam);
    }
    
    if (filterRole !== 'all') {
      filtered = filtered.filter(member => member.role === filterRole);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(member => member.status === filterStatus);
    }
    
    return filtered;
  };
  
  const getMemberActivity = (memberId: string) => {
    return activityLogs?.filter(log => log.userId === memberId) || [];
  };
  
  const getMemberLoginLogs = (memberId: string) => {
    return loginLogs?.filter(log => log.userId === memberId) || [];
  };
  
  const getMemberFileUploads = (memberId: string) => {
    return fileUploads?.filter(file => file.uploadedBy === memberId) || [];
  };
  
  const getMemberContentTasks = (memberId: string) => {
    return contentTasks?.filter(task => task.assignedTo === memberId) || [];
  };
  
  const getMemberStats = (memberId: string) => {
    const activities = getMemberActivity(memberId);
    const logins = getMemberLoginLogs(memberId);
    const uploads = getMemberFileUploads(memberId);
    const tasks = getMemberContentTasks(memberId);
    
    return {
      totalActivities: activities.length,
      totalLogins: logins.length,
      totalUploads: uploads.length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'approved').length,
      lastLogin: logins.length > 0 ? logins[0].timestamp : null,
      lastActivity: activities.length > 0 ? activities[0].timestamp : null
    };
  };
  
  const getTeamStats = () => {
    const teamStats: { [key: string]: any } = {};
    
    teams?.forEach(team => {
      const teamMembers = activeMembers.filter(member => member.team === team.name);
      const totalActivities = teamMembers.reduce((sum, member) => sum + getMemberActivity(member.uid).length, 0);
      const totalUploads = teamMembers.reduce((sum, member) => sum + getMemberFileUploads(member.uid).length, 0);
      const totalTasks = teamMembers.reduce((sum, member) => sum + getMemberContentTasks(member.uid).length, 0);
      
      teamStats[team.name] = {
        memberCount: teamMembers.length,
        totalActivities,
        totalUploads,
        totalTasks,
        avgActivitiesPerMember: teamMembers.length > 0 ? Math.round(totalActivities / teamMembers.length) : 0
      };
    });
    
    return teamStats;
  };

  // Function to render member dashboard based on their role
  const renderMemberDashboard = (member: User) => {
    // Create a mock user object for the dashboard with the member's data
    const mockUser = {
      ...member,
      uid: member.uid,
      name: member.name,
      email: member.email,
      role: member.role,
      team: member.team,
      status: member.status,
      onboardingCompleted: true,
      contractSigned: true
    };

    switch (member.role) {
      case 'design':
      case 'content-creator':
        return <ContentDashboard />;
      case 'dev':
        return <DeveloperDashboard />;
      case 'sales':
        return <SalesDashboard />;
      case 'campaign':
        return <CampaignDashboard />;
      case 'cyber':
      case 'analyst':
        return <DeveloperDashboard />;
      default:
        return (
          <div className="p-6 text-center">
            <div className="text-gray-500 mb-4">
              <Users className="w-12 h-12 mx-auto mb-2" />
              <p>No dashboard available for role: {member.role}</p>
            </div>
          </div>
        );
    }
  };
  

  
  // Helper function to get team members
  const getTeamMembers = (teamName: string) => {
    return activeMembers.filter(member => member.team === teamName);
  };
  
  // Helper function to get target audience count
  const getTargetAudienceCount = () => {
    switch (announcementForm.targetType) {
      case 'all':
        return activeMembers.length;
      case 'team':
        return announcementForm.targetTeam ? getTeamMembers(announcementForm.targetTeam).length : 0;
      case 'individual':
        return announcementForm.targetMembers.length;
      default:
        return 0;
    }
  };
  
  // Helper function to handle team assignment
  const handleTeamAssignment = (teamName: string) => {
    if (teamName) {
      const teamMembers = getTeamMembers(teamName);
      setProjectForm(prev => ({
        ...prev,
        assignedTeam: teamName,
        assignedTo: teamMembers.map(member => member.uid)
      }));
    } else {
      setProjectForm(prev => ({
        ...prev,
        assignedTeam: '',
        assignedTo: []
      }));
    }
  };
  
  // Helper function to reset member form
  const resetMemberForm = () => {
    setMemberForm({ name: '', role: '' as any, team: '', idCode: '', status: 'pending' });
    setShowNewTeamInput(false);
    setNewTeamName('');
  };
  
  // Helper function to reset project form
  const resetProjectForm = () => {
    setProjectForm({
      title: '',
      description: '',
      assignedTo: [],
      assignedTeam: '',
      assignedType: '',
      status: 'upcoming',
      deadline: ''
    });
  };

  const generateRandomID = () => {
    return generateIdCode();
  };

  const handleGenerateID = () => {
    setMemberForm(prev => ({
      ...prev,
      idCode: generateRandomID()
    }));
  };

  const handleViewMemberContract = async (memberId: string) => {
    setLoadingContract(true);
    try {
      const contract = await getContractByUserId(memberId);
      
      if (contract) {
        setSelectedMemberContract(contract);
        setShowContractModal(true);
      } else {
        showNotification({
          title: 'No Contract Found',
          message: 'No contract found for this member.',
          type: 'warning'
        });
      }
    } catch (error) {
      console.error('Error fetching member contract:', error);
      showNotification({
        title: 'Error',
        message: 'Error loading contract. Please try again.',
        type: 'error'
      });
    } finally {
      setLoadingContract(false);
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name || !memberForm.idCode || !memberForm.team || !memberForm.role) {
      showNotification({
        title: 'Validation Error',
        message: 'Please fill in all required fields including role selection.',
        type: 'warning'
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 Admin creating member with data:', {
        name: memberForm.name,
        role: memberForm.role,
        team: memberForm.team,
        idCode: memberForm.idCode,
        status: memberForm.status
      });

      await createUser({
        name: memberForm.name,
        email: '', // Will be filled during registration
        role: memberForm.role,
        team: memberForm.team,
        bio: '', // Default empty bio
        github: '',
        linkedin: '',
        phone: '',
        idCode: memberForm.idCode,
        isAdmin: memberForm.role === 'admin',
        status: memberForm.status,
        pendingApproval: memberForm.status === 'pending',
        companyId: '', // Will be set during registration
        companyRole: 'company_member'
      });

      resetMemberForm();
      setShowCreateMember(false);
      showNotification({
        title: 'Success',
        message: 'Team member created successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error creating member:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to create member. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'deactivated' : 'active';
    try {
      await toggleUserStatus(userId, newStatus);
    } catch (error) {
      console.error('Error toggling user status:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to update user status. Please try again.',
        type: 'error'
      });
    }
  };

  const handleResetProject = async (projectId: string) => {
    setResettingProject(projectId);
    try {
      await resetCompletedProject(projectId);
      showNotification({
        title: 'Success',
        message: 'Project has been reset and can be restarted.',
        type: 'success'
      });
    } catch (error) {
      console.error('Error resetting project:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to reset project. Please try again.',
        type: 'error'
      });
    } finally {
      setResettingProject(null);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title || !projectForm.description) return;
    
    // Validate that project has assignments
    if (projectForm.assignedTo.length === 0 && !projectForm.assignedTeam) {
      showNotification({
        title: 'Validation Error',
        message: 'Please assign the project to at least one team member or team.',
        type: 'warning'
      });
      return;
    }

    // Validate deadline
    if (!projectForm.deadline) {
      showNotification({
        title: 'Validation Error',
        message: 'Please select a project deadline.',
        type: 'warning'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Clean the project data before sending to Firebase
      const cleanProjectData: any = {
        title: projectForm.title.trim(),
        description: projectForm.description.trim(),
        assignedTo: (projectForm.assignedTo || []).filter(id => id && typeof id === 'string' && id.length > 0),
        status: projectForm.status,
        deadline: new Date(projectForm.deadline)
      };

      // Validate deadline date
      if (isNaN(cleanProjectData.deadline.getTime())) {
        showNotification({
          title: 'Validation Error',
          message: 'Invalid deadline date. Please select a valid date.',
          type: 'warning'
        });
        return;
      }

      // Only add assignedTeam if it has a value
      if (projectForm.assignedTeam && projectForm.assignedTeam.trim()) {
        cleanProjectData.assignedTeam = projectForm.assignedTeam.trim();
      }

      // Remove any empty strings or undefined values, but preserve assignedTo array
      Object.keys(cleanProjectData).forEach(key => {
        if (cleanProjectData[key] === undefined || cleanProjectData[key] === '' || 
            (key !== 'assignedTo' && Array.isArray(cleanProjectData[key]) && cleanProjectData[key].length === 0)) {
          delete cleanProjectData[key];
        }
      });

      // Final deep clean - remove any remaining undefined values
      const finalCleanData = JSON.parse(JSON.stringify(cleanProjectData));

      // Additional validation for assignedTo array
      if (finalCleanData.assignedTo.length === 0) {
        showNotification({
          title: 'Validation Error',
          message: 'Please assign the project to at least one team member.',
          type: 'warning'
        });
        return;
      }

      // Validate that all assignedTo IDs are valid
      const invalidIds = finalCleanData.assignedTo.filter((id: any) => !id || typeof id !== 'string' || id.length === 0);
      if (invalidIds.length > 0) {
        console.error('Invalid member IDs found:', invalidIds);
        showNotification({
          title: 'Validation Error',
          message: 'Some team member assignments are invalid. Please try selecting members again.',
          type: 'warning'
        });
        return;
      }



      const projectId = await createProject(finalCleanData);
      console.log('Project created successfully with ID:', projectId);
      console.log('Project data sent:', finalCleanData);

      resetProjectForm();
      setShowCreateProject(false);
      showNotification({
        title: 'Success',
        message: 'Project created successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error creating project:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to create project. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) return;
    
    // Validate targeting
    if (announcementForm.targetType === 'team' && !announcementForm.targetTeam) {
      showNotification({
        title: 'Validation Error',
        message: 'Please select a team for team targeting.',
        type: 'warning'
      });
      return;
    }
    
    if (announcementForm.targetType === 'individual' && announcementForm.targetMembers.length === 0) {
      showNotification({
        title: 'Validation Error',
        message: 'Please select at least one member for individual targeting.',
        type: 'warning'
      });
      return;
    }

    setIsLoading(true);
    try {
      await createAnnouncement(announcementForm);

      setAnnouncementForm({ 
        title: '', 
        content: '', 
        priority: 'medium',
        targetType: '',
        targetTeam: '',
        targetMembers: []
      });
      setShowCreateAnnouncement(false);
      showNotification({
        title: 'Success',
        message: 'Announcement created successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error creating announcement:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to create announcement. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'dev': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'design': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cyber': return 'bg-green-100 text-green-800 border-green-200';
      case 'analyst': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'team-management', label: 'Team Management', icon: Users },
    { id: 'member-monitoring', label: 'Member Monitoring', icon: Monitor },
    { id: 'activity-logs', label: 'Activity Logs', icon: Activity },
    { id: 'file-tracking', label: 'File Tracking', icon: HardDrive },
    { id: 'login-logs', label: 'Login Logs', icon: LogIn },
    { id: 'system-analytics', label: 'System Analytics', icon: TrendingUp }
  ];

  return (
    <Layout>
      {/* Admin View Mode Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .admin-view-mode {
            pointer-events: none;
          }
          
          .admin-view-mode button:not(.navigation-button),
          .admin-view-mode input,
          .admin-view-mode textarea,
          .admin-view-mode select,
          .admin-view-mode [role="button"],
          .admin-view-mode [onclick],
          .admin-view-mode [onchange],
          .admin-view-mode [onsubmit] {
            pointer-events: none !important;
            opacity: 0.6;
            cursor: not-allowed !important;
          }
          
          .admin-view-mode .navigation-button {
            pointer-events: auto !important;
            opacity: 1 !important;
            cursor: pointer !important;
          }
          
          .admin-view-mode a[href] {
            pointer-events: auto !important;
            opacity: 1 !important;
            cursor: pointer !important;
          }
          
          .admin-view-mode .tab-button,
          .admin-view-mode .nav-button,
          .admin-view-mode .menu-button {
            pointer-events: auto !important;
            opacity: 1 !important;
            cursor: pointer !important;
          }
        `
      }} />
      
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-8">
            {/* Logo and Title Section */}
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                <img
                  src="https://imgur.com/T7mH4Ly.png"
                  alt="Astraronix Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Admin Dashboard
                </h1>
                <p className="text-blue-100 text-sm">
                  Manage team members, projects, and system operations
                </p>
              </div>
            </div>
            
            {/* Stats Section */}
            <div className="flex gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">{activeMembers.length}</div>
                <div className="text-blue-100 text-xs">Active Members</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">{projects?.length || 0}</div>
                <div className="text-blue-100 text-xs">Projects</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">{announcements?.length || 0}</div>
                <div className="text-blue-100 text-xs">Announcements</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">{teams?.length || 0}</div>
                <div className="text-blue-100 text-xs">Teams</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                onClick={() => setShowCreateMember(true)}
                className="flex items-center justify-center space-x-2 py-4"
              >
                <UserPlus className="w-5 h-5" />
                <span>Add Member</span>
              </Button>
              <Button
                onClick={() => setShowCreateProject(true)}
                variant="outline"
                className="flex items-center justify-center space-x-2 py-4"
              >
                <Target className="w-5 h-5" />
                <span>New Project</span>
              </Button>
              <Button
                onClick={() => setShowCreateAnnouncement(true)}
                variant="outline"
                className="flex items-center justify-center space-x-2 py-4"
              >
                <Bell className="w-5 h-5" />
                <span>Announcement</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center justify-center space-x-2 py-4"
                onClick={() => window.location.href = '/admin/contracts'}
              >
                <FileText className="w-5 h-5" />
                <span>Contracts</span>
              </Button>
            </div>

        {/* Member Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Members */}
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                <span>Active Members</span>
              </h2>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {!users ? '...' : activeMembers.length}
              </span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {!users ? (
                <p className="text-center text-gray-500 py-8">Loading members...</p>
              ) : activeMembers.length > 0 ? (
                activeMembers.map((member) => (
                  <div key={member.uid} className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-600">ID: {member.idCode}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(member.role)}`}>
                          {member.role}
                        </span>
                        <span className="text-xs text-gray-500 bg-green-100 px-2 py-1 rounded-full">{member.team}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handleViewMemberContract(member.uid)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        disabled={loadingContract}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleToggleStatus(member.uid, member.status)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <PowerOff className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No active members</p>
              )}
            </div>
          </Card>

          {/* Deactivated Members */}
          <Card className="border-red-200 bg-gradient-to-br from-red-50 to-rose-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <UserX className="w-5 h-5 text-red-600" />
                <span>Deactivated Members</span>
              </h2>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                {!users ? '...' : deactivatedMembers.length}
              </span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {!users ? (
                <p className="text-center text-gray-500 py-8">Loading members...</p>
              ) : deactivatedMembers.length > 0 ? (
                deactivatedMembers.map((member) => (
                  <div key={member.uid} className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-100 shadow-sm hover:shadow-md transition-shadow opacity-90">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-600">ID: {member.idCode}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(member.role)}`}>
                          {member.role}
                        </span>
                        <span className="text-xs text-gray-500 bg-red-100 px-2 py-1 rounded-full">{member.team}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handleViewMemberContract(member.uid)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        disabled={loadingContract}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleToggleStatus(member.uid, member.status)}
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No deactivated members</p>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Projects */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Recent Projects</span>
            </h2>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {!projects ? (
              <p className="text-center text-gray-500 py-8 col-span-full">Loading projects...</p>
            ) : projects.length > 0 ? (
              projects.slice(0, 6).map((project) => (
                <div key={project.id} className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">{project.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                  
                  {/* Completion Timestamp */}
                  {project.status === 'completed' && project.completedAt && (
                    <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
                      <div className="text-green-700">
                        <strong>Completed:</strong> {formatDate(project.completedAt)}
                      </div>
                      {project.completedBy && (
                        <div className="text-green-600 mt-1">
                          By: {users?.find(u => u.uid === project.completedBy)?.name || 'Unknown'}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      project.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : project.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {project.status.replace('-', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {project.assignedTo.length} assigned
                    </span>
                  </div>
                  
                  {/* Reset Button for Completed Projects */}
                  {project.status === 'completed' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <Button
                        onClick={() => handleResetProject(project.id)}
                        variant="outline"
                        size="sm"
                        disabled={resettingProject === project.id}
                        className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
                      >
                        {resettingProject === project.id ? 'Resetting...' : 'Reset Project'}
                      </Button>
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        Allow member to restart this project
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8 col-span-full">No projects found</p>
            )}
          </div>
        </Card>

            {/* Team Management Overview */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Team Overview</h2>
                </div>
                <Button
                  onClick={() => setActiveTab('team-management')}
                  variant="outline"
                  size="sm"
                >
                  Manage Teams
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams?.map((team) => {
                  const teamMembers = getTeamMembers(team.name);
                  const activeMembers = teamMembers.filter(member => member.status === 'active');
                  const teamStats = getTeamStats()[team.name];
                  
                  return (
                    <div key={team.id} className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{team.name}</h3>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {activeMembers.length} active
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="text-sm text-gray-600 text-center">
                          <span className="font-medium">{team.description || 'No description'}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center bg-white rounded-lg p-2">
                            <div className="font-bold text-blue-600">{teamStats?.totalActivities || 0}</div>
                            <div className="text-gray-500">Activities</div>
                          </div>
                          <div className="text-center bg-white rounded-lg p-2">
                            <div className="font-bold text-green-600">{teamStats?.totalUploads || 0}</div>
                            <div className="text-gray-500">Uploads</div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 text-center">
                          Click to view team members
                        </div>
                        
                        <Button
                          onClick={() => {
                            setSelectedTeam(team);
                            setShowTeamDetails(true);
                          }}
                          className="w-full text-xs py-2"
                          size="sm"
                        >
                          View Team Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
                
                {teams?.length === 0 && (
                  <p className="text-center text-gray-500 py-8 col-span-full">No teams found</p>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Team Management Tab */}
        {activeTab === 'team-management' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Team Management
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setShowCreateMember(true)}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Member
                  </Button>
                </div>
              </div>

              {/* Teams Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {teams?.map((team) => {
                  const teamMembers = getTeamMembers(team.name);
                  const teamStats = getTeamStats()[team.name];
                  const activeTeamMembers = teamMembers.filter(member => member.status === 'active');
                  
                  return (
                    <div key={team.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                      {/* Team Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                          <p className="text-xs text-gray-600">{team.description || 'No description'}</p>
                        </div>
                      </div>

                      {/* Team Stats */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center bg-blue-50 rounded-lg p-2">
                          <div className="text-lg font-bold text-blue-600">{activeTeamMembers.length}</div>
                          <div className="text-xs text-gray-500">Members</div>
                        </div>
                        <div className="text-center bg-green-50 rounded-lg p-2">
                          <div className="text-lg font-bold text-green-600">{teamStats?.totalActivities || 0}</div>
                          <div className="text-xs text-gray-500">Activities</div>
                        </div>
                        <div className="text-center bg-purple-50 rounded-lg p-2">
                          <div className="text-lg font-bold text-purple-600">{teamStats?.totalUploads || 0}</div>
                          <div className="text-xs text-gray-500">Uploads</div>
                        </div>
                      </div>

                      {/* Team Info */}
                      <div className="mb-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-2">
                            {team.description || 'No description available'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Click "View Team Details" to see team members
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={() => {
                          setSelectedTeam(team);
                          setShowTeamDetails(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Eye className="w-4 h-4" />
                        View Team Details
                      </Button>
                    </div>
                  );
                })}
                
                {(!teams || teams.length === 0) && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No teams found</h3>
                    <p className="text-gray-500 mb-4">Create teams to organize your members</p>
                    <Button
                      onClick={() => setShowCreateMember(true)}
                      className="flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Create First Team
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Member Monitoring Tab */}
        {activeTab === 'member-monitoring' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-blue-600" />
                  Member Monitoring
                </h2>
                <div className="flex items-center gap-2">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="1">Last 24 hours</option>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                  </select>
                </div>
              </div>

              {/* Member Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeMembers.map((member) => {
                  const stats = getMemberStats(member.uid);
                  const activities = getMemberActivity(member.uid);
                  const recentActivities = activities.slice(0, 3);
                  
                  return (
                    <div key={member.uid} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{member.name}</h3>
                            <p className="text-sm text-gray-500">{member.role} • {member.team}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {member.status}
                        </span>
                      </div>

                      {/* Basic Information */}
                      <div className="mb-4">
                        <div className="text-xs text-gray-600 space-y-1">
                          <div><strong>Email:</strong> {member.email}</div>
                          <div><strong>ID Code:</strong> {member.idCode}</div>
                          <div><strong>Role:</strong> {member.role}</div>
                          <div><strong>Team:</strong> {member.team}</div>
                          <div><strong>Status:</strong> {member.status}</div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{stats.totalActivities}</div>
                          <div className="text-xs text-gray-500">Activities</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{stats.totalUploads}</div>
                          <div className="text-xs text-gray-500">Uploads</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">{stats.totalTasks}</div>
                          <div className="text-xs text-gray-500">Tasks</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">{stats.completedTasks}</div>
                          <div className="text-xs text-gray-500">Completed</div>
                        </div>
                      </div>

                      {/* Additional Stats */}
                      <div className="mb-4">
                        <div className="text-xs text-gray-600 space-y-1">
                          <div><strong>Login Sessions:</strong> {stats.totalLogins}</div>
                          <div><strong>Last Login:</strong> {stats.lastLogin ? new Date(stats.lastLogin).toLocaleDateString() : 'Never'}</div>
                          <div><strong>Last Activity:</strong> {stats.lastActivity ? new Date(stats.lastActivity).toLocaleDateString() : 'Never'}</div>
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h5>
                        <div className="space-y-1">
                          {activities.slice(0, 3).map((activity, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-gray-700 truncate">{activity.action}</span>
                              <span className="text-gray-400 text-xs">
                                {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : 'Unknown'}
                              </span>
                            </div>
                          ))}
                          {activities.length === 0 && (
                            <p className="text-xs text-gray-400">No recent activity</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <Button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowMemberDetails(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Dashboard
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Activity Logs Tab */}
        {activeTab === 'activity-logs' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Activity Logs
                </h2>
                <div className="flex items-center gap-2">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="1">Last 24 hours</option>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {activityLogs?.slice(0, 50).map((log, index) => {
                  const member = users?.find(u => u.uid === log.userId);
                  return (
                    <div key={index} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Activity className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {member?.name || 'Unknown User'}
                          </span>
                          <span className="text-sm text-gray-500">{log.action}</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {log.details || 'No additional details'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown time'}
                      </div>
                    </div>
                  );
                })}
                
                {(!activityLogs || activityLogs.length === 0) && (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No activity logs</h3>
                    <p className="text-gray-500">Activity logs will appear here as members use the system</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* File Tracking Tab */}
        {activeTab === 'file-tracking' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-blue-600" />
                  File Tracking
                </h2>
                <div className="flex items-center gap-2">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="1">Last 24 hours</option>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {fileUploads?.slice(0, 50).map((file, index) => {
                  const member = users?.find(u => u.uid === file.uploadedBy);
                  return (
                    <div key={index} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <FileUp className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{file.fileName}</span>
                          <span className="text-sm text-gray-500">by {member?.name || 'Unknown User'}</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {file.description || 'No description'} • {file.category}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {file.tags?.map((tag: string, tagIndex: number) => (
                            <span key={tagIndex} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {file.uploadedAt ? new Date(file.uploadedAt).toLocaleString() : 'Unknown time'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => window.open(file.fileURL, '_blank')}
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = file.fileURL;
                            link.download = file.fileName;
                            link.click();
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                
                {(!fileUploads || fileUploads.length === 0) && (
                  <div className="text-center py-12">
                    <HardDrive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No file uploads</h3>
                    <p className="text-gray-500">File uploads will appear here as members upload files</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Login Logs Tab */}
        {activeTab === 'login-logs' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <LogIn className="w-5 h-5 text-blue-600" />
                  Login Logs
                </h2>
                <div className="flex items-center gap-2">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="1">Last 24 hours</option>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {loginLogs?.slice(0, 50).map((log, index) => {
                  const member = users?.find(u => u.uid === log.userId);
                  return (
                    <div key={index} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        log.action === 'login' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {log.action === 'login' ? (
                          <LogIn className="w-4 h-4 text-green-600" />
                        ) : (
                          <LogOut className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {member?.name || 'Unknown User'}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            log.action === 'login' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {log.action}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          IP: {log.ipAddress || 'Unknown'} • Device: {log.deviceInfo || 'Unknown'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown time'}
                      </div>
                    </div>
                  );
                })}
                
                {(!loginLogs || loginLogs.length === 0) && (
                  <div className="text-center py-12">
                    <LogIn className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No login logs</h3>
                    <p className="text-gray-500">Login logs will appear here as members sign in and out</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* System Analytics Tab */}
        {activeTab === 'system-analytics' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  System Analytics
                </h2>
                <div className="flex items-center gap-2">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                  </select>
                </div>
              </div>

              {/* Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Users</p>
                      <p className="text-2xl font-bold text-blue-700">{users?.length || 0}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Active Users</p>
                      <p className="text-2xl font-bold text-green-700">{activeMembers.length}</p>
                    </div>
                    <UserCheck className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">File Uploads</p>
                      <p className="text-2xl font-bold text-purple-700">{fileUploads?.length || 0}</p>
                    </div>
                    <FileUp className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Total Activities</p>
                      <p className="text-2xl font-bold text-orange-700">{activityLogs?.length || 0}</p>
                    </div>
                    <Activity className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Team Performance */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teams?.map((team) => {
                    const teamStats = getTeamStats()[team.name];
                    return (
                      <div key={team.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{team.name}</h4>
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {teamStats?.memberCount || 0} members
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Activities:</span>
                            <span className="font-medium">{teamStats?.totalActivities || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Uploads:</span>
                            <span className="font-medium">{teamStats?.totalUploads || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tasks:</span>
                            <span className="font-medium">{teamStats?.totalTasks || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Avg/Member:</span>
                            <span className="font-medium">{teamStats?.avgActivitiesPerMember || 0}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Activity Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Most Active Users</h4>
                    <div className="space-y-2">
                      {activeMembers
                        .map(member => ({
                          ...member,
                          activityCount: getMemberActivity(member.uid).length
                        }))
                        .sort((a, b) => b.activityCount - a.activityCount)
                        .slice(0, 5)
                        .map((member, index) => (
                          <div key={member.uid} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{member.name}</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {member.activityCount} activities
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Recent Logins</h4>
                    <div className="space-y-2">
                      {loginLogs?.slice(0, 5).map((log, index) => {
                        const member = users?.find(u => u.uid === log.userId);
                        return (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{member?.name || 'Unknown User'}</span>
                            <span className="text-gray-500">
                              {log.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'Unknown'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Member Details Modal */}
        {showMemberDetails && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
            <div className="bg-white rounded-lg w-full h-[95vh] overflow-hidden">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {selectedMember.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedMember.name}'s Dashboard
                    </h2>
                    <p className="text-sm text-gray-600">{selectedMember.role} • {selectedMember.team}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    View Only Mode
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowMemberDetails(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
              
              {/* Dashboard Container with Disabled Interactions */}
              <div className="h-full overflow-y-auto">
                <div className="admin-view-mode">
                  {renderMemberDashboard(selectedMember)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Details Modal */}
        {showTeamDetails && selectedTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedTeam.name} - Team Dashboard
                    </h2>
                    <p className="text-sm text-gray-600">View team members and their individual dashboards</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowTeamDetails(false)}
                >
                  Close
                </Button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Team Overview */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{getTeamMembers(selectedTeam.name).length}</div>
                      <div className="text-sm text-gray-600">Total Members</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{getTeamMembers(selectedTeam.name).filter(m => m.status === 'active').length}</div>
                      <div className="text-sm text-gray-600">Active Members</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{getTeamStats()[selectedTeam.name]?.totalActivities || 0}</div>
                      <div className="text-sm text-gray-600">Total Activities</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">{getTeamStats()[selectedTeam.name]?.totalUploads || 0}</div>
                      <div className="text-sm text-gray-600">File Uploads</div>
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getTeamMembers(selectedTeam.name).map((member) => {
                      const stats = getMemberStats(member.uid);
                      return (
                        <div key={member.uid} className="border border-gray-200 rounded-xl bg-white shadow-sm p-4">
                          {/* Member Header */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-lg">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900">{member.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                                  {member.role}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {member.status}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Member Stats */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                              <div className="text-lg font-bold text-blue-600">{stats.totalActivities}</div>
                              <div className="text-xs text-gray-600">Activities</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3 text-center">
                              <div className="text-lg font-bold text-green-600">{stats.totalUploads}</div>
                              <div className="text-xs text-gray-600">Uploads</div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3 text-center">
                              <div className="text-lg font-bold text-purple-600">{stats.totalTasks}</div>
                              <div className="text-xs text-gray-600">Tasks</div>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-3 text-center">
                              <div className="text-lg font-bold text-orange-600">{stats.completedTasks}</div>
                              <div className="text-xs text-gray-600">Completed</div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                setSelectedMember(member);
                                setShowMemberDetails(true);
                                setShowTeamDetails(false);
                              }}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Dashboard
                            </Button>
                            <Button
                              onClick={() => handleViewMemberContract(member.uid)}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Contract
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Team Analytics */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Analytics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Most Active Member</h4>
                      {(() => {
                        const mostActive = getTeamMembers(selectedTeam.name)
                          .map(member => ({
                            ...member,
                            activityCount: getMemberActivity(member.uid).length
                          }))
                          .sort((a, b) => b.activityCount - a.activityCount)[0];
                        
                        return mostActive ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-xs">
                                {mostActive.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium">{mostActive.name}</div>
                              <div className="text-xs text-gray-500">{mostActive.activityCount} activities</div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No activity data</p>
                        );
                      })()}
                    </div>
                    
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Top Uploader</h4>
                      {(() => {
                        const topUploader = getTeamMembers(selectedTeam.name)
                          .map(member => ({
                            ...member,
                            uploadCount: getMemberFileUploads(member.uid).length
                          }))
                          .sort((a, b) => b.uploadCount - a.uploadCount)[0];
                        
                        return topUploader ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 font-medium text-xs">
                                {topUploader.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium">{topUploader.name}</div>
                              <div className="text-xs text-gray-500">{topUploader.uploadCount} uploads</div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No upload data</p>
                        );
                      })()}
                    </div>
                    
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Task Completion Rate</h4>
                      {(() => {
                        const teamMembers = getTeamMembers(selectedTeam.name);
                        const totalTasks = teamMembers.reduce((sum, member) => sum + getMemberContentTasks(member.uid).length, 0);
                        const completedTasks = teamMembers.reduce((sum, member) => sum + getMemberContentTasks(member.uid).filter(t => t.status === 'approved').length, 0);
                        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                        
                        return (
                          <div>
                            <div className="text-2xl font-bold text-purple-600">{completionRate}%</div>
                            <div className="text-xs text-gray-500">{completedTasks}/{totalTasks} tasks</div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Member Modal */}
        {showCreateMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Member</h2>
              <form onSubmit={handleCreateMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Code
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={memberForm.idCode}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, idCode: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="AST12345"
                      required
                    />
                    <Button
                      type="button"
                      onClick={handleGenerateID}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Generate</span>
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={memberForm.name}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={memberForm.role}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a role</option>
                    <option value="admin">Administrator</option>
                    <option value="dev">Developer</option>
                    <option value="design">Content Creator</option>
                    <option value="cyber">Cybersecurity Specialist</option>
                    <option value="analyst">Data Analyst</option>
                    <option value="sales">Sales Agent</option>
                    <option value="marketing">Digital Marketing Agent</option>
                    <option value="campaign">Campaign Manager</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    This role will determine the member's dashboard, permissions, and responsibilities
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Status
                  </label>
                  <select
                    value={memberForm.status}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending Approval</option>
                    <option value="active">Active (Auto-approve)</option>
                    <option value="deactivated">Deactivated</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {memberForm.status === 'pending' 
                      ? 'Member will need admin approval before accessing the system'
                      : memberForm.status === 'active'
                      ? 'Member will be immediately active'
                      : 'Member will be deactivated'
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Select an existing team or create a new one. The team will be saved to the database.
                  </p>
                  <div className="space-y-2">
                    {/* Existing Teams Dropdown */}
                    <select
                      value={showNewTeamInput ? '' : memberForm.team}
                      onChange={(e) => {
                        if (e.target.value === 'new') {
                          setShowNewTeamInput(true);
                          setMemberForm(prev => ({ ...prev, team: '' }));
                        } else {
                          setShowNewTeamInput(false);
                          setMemberForm(prev => ({ ...prev, team: e.target.value }));
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={!showNewTeamInput}
                    >
                      <option value="">Select a team</option>
                                             {teams?.map((team) => {
                         const teamMembers = getTeamMembers(team.name);
                         return (
                           <option key={team.id} value={team.name}>
                             {team.name} ({teamMembers.length} members)
                           </option>
                         );
                       })}
                      <option value="new">+ Add New Team</option>
                    </select>

                    {/* New Team Input */}
                    {showNewTeamInput && (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newTeamName}
                          onChange={(e) => setNewTeamName(e.target.value)}
                          placeholder="Enter new team name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                                                  <Button
                            type="button"
                            onClick={async () => {
                              if (newTeamName.trim()) {
                                // Check if team already exists
                                if (teams?.some(team => team.name.toLowerCase() === newTeamName.trim().toLowerCase())) {
                                  showNotification({
                                    title: 'Team Already Exists',
                                    message: `A team with the name "${newTeamName.trim()}" already exists.`,
                                    type: 'warning'
                                  });
                                  return;
                                }
                                
                                setCreatingTeam(true);
                                try {
                                  // Create the team in Firestore first
                                  await createTeam({
                                    name: newTeamName.trim(),
                                    description: '',
                                    color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
                                    createdBy: user?.uid || 'admin',
                                    isActive: true
                                  });
                                  
                                  // Update the member form with the new team
                                  setMemberForm(prev => ({ ...prev, team: newTeamName.trim() }));
                                  setShowNewTeamInput(false);
                                  setNewTeamName('');
                                  
                                  showNotification({
                                    title: 'Success',
                                    message: `Team "${newTeamName.trim()}" created and selected successfully!`,
                                    type: 'success'
                                  });
                                } catch (error) {
                                  console.error('Error creating new team:', error);
                                  showNotification({
                                    title: 'Error',
                                    message: `Failed to create team "${newTeamName.trim()}". Please try again.`,
                                    type: 'error'
                                  });
                                } finally {
                                  setCreatingTeam(false);
                                }
                              }
                            }}
                            disabled={creatingTeam || !newTeamName.trim()}
                            variant="outline"
                            size="sm"
                            className="px-3 py-2"
                          >
                            {creatingTeam ? 'Creating...' : 'Add'}
                          </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            setShowNewTeamInput(false);
                            setNewTeamName('');
                          }}
                          variant="outline"
                          size="sm"
                          className="px-3 py-2 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}

                    {/* Selected Team Display */}
                    {memberForm.team && !showNewTeamInput && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <p className="text-sm text-green-700">
                              Selected Team: <span className="font-medium">{memberForm.team}</span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setMemberForm(prev => ({ ...prev, team: '' }))}
                            className="text-green-600 hover:text-green-800"
                            title="Clear team selection"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Team is ready for member creation
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Status
                  </label>
                  <select
                    value={memberForm.status}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="deactivated">Deactivated</option>
                  </select>
                </div>

                {/* Form Status */}
                {memberForm.team ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Ready to create member for team: <span className="font-medium">{memberForm.team}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <p className="text-sm text-yellow-700">
                        Please select or create a team to continue
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowCreateMember(false);
                      resetMemberForm();
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    disabled={!memberForm.team}
                    className="flex-1"
                  >
                    Create Member
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Project</h2>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Title
                  </label>
                  <input
                    type="text"
                    value={projectForm.title}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={projectForm.description}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment Type
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Choose how to assign this project. You can assign to individual members, an entire team, or use hybrid assignment for more flexibility.
                  </p>
                  <select
                    value={projectForm.assignedType}
                    onChange={(e) => {
                      if (e.target.value === 'team') {
                        setProjectForm(prev => ({ ...prev, assignedTo: [], assignedTeam: '', assignedType: 'team' }));
                      } else if (e.target.value === 'individual') {
                        setProjectForm(prev => ({ ...prev, assignedTo: [], assignedTeam: '', assignedType: 'individual' }));
                      } else if (e.target.value === 'hybrid') {
                        setProjectForm(prev => ({ ...prev, assignedType: 'hybrid' }));
                      } else {
                        setProjectForm(prev => ({ ...prev, assignedTo: [], assignedTeam: '', assignedType: '' }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select assignment type</option>
                    <option value="individual">Assign to Individual Members</option>
                    <option value="team">Assign to Entire Team</option>
                    <option value="hybrid">Assign to Team + Specific Members</option>
                  </select>
                </div>

                {/* Team Selection for Team/Hybrid Assignment */}
                {(projectForm.assignedType === 'team' || projectForm.assignedType === 'hybrid') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Team
                    </label>
                    <select
                      value={projectForm.assignedTeam}
                      onChange={(e) => {
                        const selectedTeam = e.target.value;
                        setProjectForm(prev => ({ ...prev, assignedTeam: selectedTeam }));
                        // If hybrid mode, show team members for additional selection
                        if (projectForm.assignedType === 'hybrid' && selectedTeam) {
                          const teamMembers = getTeamMembers(selectedTeam);
                          setProjectForm(prev => ({ 
                            ...prev, 
                            assignedTeam: selectedTeam,
                            // Pre-select all team members
                            assignedTo: teamMembers.map(m => m.uid)
                          }));
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a team</option>
                      {teams?.map((team) => {
                        const teamMembers = getTeamMembers(team.name);
                        return (
                          <option key={team.id} value={team.name}>
                            {team.name} ({teamMembers.length} members)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* Individual Member Selection */}
                {projectForm.assignedType === 'individual' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Team Members
                    </label>
                    <div className="space-y-3">
                      {/* Team Filter */}
                      <div>
                        <select
                          value={projectForm.assignedTeam || ''}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, assignedTeam: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">All Teams</option>
                          {teams?.map((team) => (
                            <option key={team.id} value={team.name}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Member List */}
                      <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-2">
                        {activeMembers
                          .filter(member => !projectForm.assignedTeam || member.team === projectForm.assignedTeam)
                          .map((member) => (
                            <label key={member.uid} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={projectForm.assignedTo.includes(member.uid)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setProjectForm(prev => ({
                                      ...prev,
                                      assignedTo: [...prev.assignedTo, member.uid]
                                    }));
                                  } else {
                                    setProjectForm(prev => ({
                                      ...prev,
                                      assignedTo: prev.assignedTo.filter(id => id !== member.uid)
                                    }));
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-700">{member.name}</span>
                                <span className="text-xs text-gray-500 ml-2">({member.role})</span>
                                <span className="text-xs text-gray-400 ml-2">• {member.team}</span>
                              </div>
                            </label>
                          ))}
                        {activeMembers.filter(member => !projectForm.assignedTeam || member.team === projectForm.assignedTeam).length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-2">
                            {projectForm.assignedTeam ? `No members found in ${projectForm.assignedTeam}` : 'No active members found'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Hybrid Member Selection (Team + Specific Members) */}
                {projectForm.assignedType === 'hybrid' && projectForm.assignedTeam && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Member Selection (Optional)
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      All team members are pre-selected. You can deselect specific members if needed.
                    </p>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-2">
                      {getTeamMembers(projectForm.assignedTeam).map((member) => (
                        <label key={member.uid} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={projectForm.assignedTo.includes(member.uid)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setProjectForm(prev => ({
                                  ...prev,
                                  assignedTo: [...prev.assignedTo, member.uid]
                                }));
                              } else {
                                setProjectForm(prev => ({
                                  ...prev,
                                  assignedTo: prev.assignedTo.filter(id => id !== member.uid)
                                }));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-700">{member.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({member.role})</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Assignment Summary */}
                {(projectForm.assignedTo.length > 0 || projectForm.assignedTeam) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Assignment Summary:</h4>
                    
                    {projectForm.assignedType === 'team' && projectForm.assignedTeam ? (
                      <div>
                        <p className="text-sm text-blue-700 mb-1">
                          <span className="font-medium">Team Assignment:</span> {projectForm.assignedTeam}
                        </p>
                        <p className="text-xs text-blue-600">
                          All team members will be assigned to this project
                        </p>
                      </div>
                    ) : projectForm.assignedType === 'individual' && projectForm.assignedTo.length > 0 ? (
                      <div>
                        <p className="text-sm text-blue-700 mb-1">
                          <span className="font-medium">Individual Members:</span> {projectForm.assignedTo.length} selected
                        </p>
                        <div className="space-y-1 max-h-20 overflow-y-auto">
                          {projectForm.assignedTo.map((memberId) => {
                            const member = activeMembers.find(m => m.uid === memberId);
                            return member ? (
                              <p key={memberId} className="text-sm text-blue-600 flex items-center space-x-2">
                                <span>•</span>
                                <span>{member.name}</span>
                                <span className="text-xs text-blue-500">({member.role})</span>
                                <span className="text-xs text-blue-400">• {member.team}</span>
                              </p>
                            ) : null;
                          })}
                        </div>
                      </div>
                    ) : projectForm.assignedType === 'hybrid' && projectForm.assignedTeam ? (
                      <div>
                        <p className="text-sm text-blue-700 mb-1">
                          <span className="font-medium">Hybrid Assignment:</span> {projectForm.assignedTeam} team
                        </p>
                        <p className="text-sm text-blue-600 mb-1">
                          Selected members: {projectForm.assignedTo.length} out of {getTeamMembers(projectForm.assignedTeam).length}
                        </p>
                        <div className="space-y-1 max-h-20 overflow-y-auto">
                          {projectForm.assignedTo.map((memberId) => {
                            const member = activeMembers.find(m => m.uid === memberId);
                            return member ? (
                              <p key={memberId} className="text-sm text-blue-600 flex items-center space-x-2">
                                <span>•</span>
                                <span>{member.name}</span>
                                <span className="text-xs text-blue-500">({member.role})</span>
                              </p>
                            ) : null;
                          })}
                        </div>
                      </div>
                    ) : null}
                    
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <p className="text-xs text-blue-600">
                        Total assignments: {projectForm.assignedTo.length} member{projectForm.assignedTo.length !== 1 ? 's' : ''}
                        {projectForm.assignedTeam && projectForm.assignedType === 'team' ? ' (entire team)' : ''}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={projectForm.deadline}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowCreateProject(false);
                      resetProjectForm();
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="flex-1"
                  >
                    Create Project
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Announcement Modal */}
        {showCreateAnnouncement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create Announcement</h2>
              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Choose who should receive this announcement. You can target all members, a specific team, or select individual members.
                  </p>
                  <select
                    value={announcementForm.targetType}
                    onChange={(e) => {
                      const targetType = e.target.value as '' | 'all' | 'team' | 'individual';
                      setAnnouncementForm(prev => ({ 
                        ...prev, 
                        targetType,
                        targetTeam: '',
                        targetMembers: []
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select target audience</option>
                    <option value="all">All Members</option>
                    <option value="team">Specific Team</option>
                    <option value="individual">Specific Members</option>
                  </select>
                </div>

                {/* Team Selection for Team Targeting */}
                {announcementForm.targetType === 'team' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Team
                    </label>
                    <select
                      value={announcementForm.targetTeam}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, targetTeam: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a team</option>
                      {teams?.map((team) => {
                        const teamMembers = getTeamMembers(team.name);
                        return (
                          <option key={team.id} value={team.name}>
                            {team.name} ({teamMembers.length} members)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* Individual Member Selection */}
                {announcementForm.targetType === 'individual' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Members
                    </label>
                    <div className="space-y-3">
                      {/* Team Filter */}
                      <div>
                        <select
                          value={announcementForm.targetTeam || ''}
                          onChange={(e) => setAnnouncementForm(prev => ({ ...prev, targetTeam: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">All Teams</option>
                          {teams?.map((team) => (
                            <option key={team.id} value={team.name}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Member List */}
                      <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-2">
                        {activeMembers
                          .filter(member => !announcementForm.targetTeam || member.team === announcementForm.targetTeam)
                          .map((member) => (
                            <label key={member.uid} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={announcementForm.targetMembers.includes(member.uid)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAnnouncementForm(prev => ({
                                      ...prev,
                                      targetMembers: [...prev.targetMembers, member.uid]
                                    }));
                                  } else {
                                    setAnnouncementForm(prev => ({
                                      ...prev,
                                      targetMembers: prev.targetMembers.filter(id => id !== member.uid)
                                    }));
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-700">{member.name}</span>
                                <span className="text-xs text-gray-500 ml-2">({member.role})</span>
                                <span className="text-xs text-gray-400 ml-2">• {member.team}</span>
                              </div>
                            </label>
                          ))}
                        {activeMembers.filter(member => !announcementForm.targetTeam || member.team === announcementForm.targetTeam).length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-2">
                            {announcementForm.targetTeam ? `No members found in ${announcementForm.targetTeam}` : 'No active members found'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Priority Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={announcementForm.priority}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                {/* Target Summary */}
                {announcementForm.targetType && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Target Summary:</h4>
                    
                    {announcementForm.targetType === 'all' ? (
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">All Members:</span> {activeMembers.length} active members
                      </p>
                    ) : announcementForm.targetType === 'team' && announcementForm.targetTeam ? (
                      <div>
                        <p className="text-sm text-blue-700 mb-1">
                          <span className="font-medium">Team:</span> {announcementForm.targetTeam}
                        </p>
                        <p className="text-xs text-blue-600">
                          {getTeamMembers(announcementForm.targetTeam).length} members will receive this announcement
                        </p>
                      </div>
                    ) : announcementForm.targetType === 'individual' && announcementForm.targetMembers.length > 0 ? (
                      <div>
                        <p className="text-sm text-blue-700 mb-1">
                          <span className="font-medium">Selected Members:</span> {announcementForm.targetMembers.length} selected
                        </p>
                        <div className="space-y-1 max-h-20 overflow-y-auto">
                          {announcementForm.targetMembers.map((memberId) => {
                            const member = activeMembers.find(m => m.uid === memberId);
                            return member ? (
                              <p key={memberId} className="text-sm text-blue-600 flex items-center space-x-2">
                                <span>•</span>
                                <span>{member.name}</span>
                                <span className="text-xs text-blue-500">({member.role})</span>
                                <span className="text-xs text-blue-400">• {member.team}</span>
                              </p>
                            ) : null;
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-yellow-600">
                        Please select target audience members
                      </p>
                    )}
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowCreateAnnouncement(false);
                      setAnnouncementForm({ 
                        title: '', 
                        content: '', 
                        priority: 'medium',
                        targetType: '',
                        targetTeam: '',
                        targetMembers: []
                      });
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    disabled={!announcementForm.targetType || 
                      (announcementForm.targetType === 'team' && !announcementForm.targetTeam) ||
                      (announcementForm.targetType === 'individual' && announcementForm.targetMembers.length === 0)}
                    className="flex-1"
                  >
                    Create Announcement
                    {announcementForm.targetType && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {getTargetAudienceCount()} target{getTargetAudienceCount() !== 1 ? 's' : ''}
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Contract Modal */}
        {showContractModal && selectedMemberContract && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Contract for {selectedMemberContract.memberName}
                </h2>
                <div className="flex space-x-2">
                                      <Button
                      onClick={() => {
                        // Generate and download PDF from screenshot
                        generateContractPDFFromScreenshot(selectedMemberContract);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
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
                {/* Contract Content */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  {/* Company Logo */}
                  <div className="flex items-center justify-center mb-6">
                    <img 
                      src="https://i.imgur.com/T7mH4Ly.png" 
                      alt="Astraronix Solutions Logo" 
                      className="h-20 w-auto"
                    />
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-4 text-center text-xl">Astraronix Solutions - Team Member Contract</h3>
                  <p className="text-sm text-gray-600 mb-6 text-center">
                    This contract is made effective as of {formatDate(selectedMemberContract.signedAt) || new Date().toLocaleDateString()} by and between:
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
                      <p className="mb-2"><strong>Name:</strong> {selectedMemberContract.memberName}</p>
                      <p className="mb-2"><strong>Role:</strong> {selectedMemberContract.memberRole}</p>
                      <p className="mb-2"><strong>Email:</strong> {selectedMemberContract.memberEmail}</p>
                      <p className="mb-2"><strong>ID Code:</strong> {selectedMemberContract.idCode}</p>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
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

                  {/* Signatures and Verification */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3 text-base">Contract Verification:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Member Signature:</h5>
                        {selectedMemberContract.memberSignatureUrl ? (
                          <img 
                            src={selectedMemberContract.memberSignatureUrl} 
                            alt="Member Signature" 
                            className="w-32 h-16 border border-gray-300 rounded"
                          />
                        ) : (
                          <p className="text-sm text-gray-500">Not available</p>
                        )}
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Selfie Verification:</h5>
                        {selectedMemberContract.selfieImageUrl ? (
                          <img 
                            src={selectedMemberContract.selfieImageUrl} 
                            alt="Member Selfie" 
                            className="w-4 h-16 border border-gray-300 rounded object-cover"
                          />
                        ) : (
                          <p className="text-sm text-gray-500">Not available</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="mb-2"><strong>Contract Date:</strong> {formatDate(selectedMemberContract.signedAt) || 'Not signed'}</p>
                        <p className="mb-2"><strong>Contract ID:</strong> {selectedMemberContract.id}</p>
                      </div>
                      <div>
                        <p className="mb-2"><strong>Status:</strong> 
                          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                            selectedMemberContract.status === 'signed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {selectedMemberContract.status?.toUpperCase() || 'PENDING'}
                          </span>
                        </p>
                        <p className="mb-2"><strong>Version:</strong> {selectedMemberContract.contractVersion}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};