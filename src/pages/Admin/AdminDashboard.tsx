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
  X
} from 'lucide-react';
import { User, Project, Announcement, Team } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useModal();
  const { data: users } = useCollection<User>('users');
  const { data: projects } = useCollection<Project>('projects');
  const { data: announcements } = useCollection<Announcement>('announcements');
  const { data: teams } = useCollection<Team>('teams');
  


  const [showCreateMember, setShowCreateMember] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedMemberContract, setSelectedMemberContract] = useState<any>(null);
  const [loadingContract, setLoadingContract] = useState(false);

  const [memberForm, setMemberForm] = useState({
    name: '',
    role: 'dev' as 'dev' | 'design' | 'cyber' | 'analyst',
    team: '',
    idCode: '',
    status: 'active' as 'active' | 'deactivated'
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
    setMemberForm({ name: '', role: 'dev', team: '', idCode: '', status: 'active' });
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
    if (!memberForm.name || !memberForm.idCode || !memberForm.team) return;

    setIsLoading(true);
    try {
      await createUser({
        name: memberForm.name,
        email: '', // Will be filled during registration
        role: memberForm.role,
        team: memberForm.team,
        skills: [],
        bio: '', // Default empty bio
        github: '',
        linkedin: '',
        phone: '',
        idCode: memberForm.idCode,
        isAdmin: false,
        status: memberForm.status
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

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-center space-x-4">
            <img
              src="https://imgur.com/T7mH4Ly.png"
              alt="Astracore Logo"
              className="w-16 h-16 object-contain bg-white rounded-xl p-2"
            />
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-blue-100 text-xl">
                Manage team members, projects, and system operations
              </p>
            </div>
          </div>
        </div>

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
          >
            <BookOpen className="w-5 h-5" />
            <span>Manage Wiki</span>
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

        {/* Team Management */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Team Management</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {teams?.map((team) => {
               const teamMembers = getTeamMembers(team.name);
               return (
                 <div key={team.id} className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                   <div className="flex items-center justify-between mb-3">
                     <h3 className="font-semibold text-gray-900">{team.name}</h3>
                     <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                       {teamMembers.length} members
                     </span>
                   </div>
                   
                   <div className="space-y-2">
                     <div className="text-sm text-gray-600">
                       <span className="font-medium">Members:</span>
                     </div>
                     <div className="space-y-1">
                       {teamMembers.map((member) => (
                         <div key={member.uid} className="flex items-center justify-between text-xs">
                           <span className="text-gray-700">{member.name}</span>
                           <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                             {member.role}
                           </span>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               );
             })}
            
            {teams?.length === 0 && (
              <p className="text-center text-gray-500 py-8 col-span-full">No teams found</p>
            )}
          </div>
        </Card>

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
                  >
                    <option value="dev">Developer</option>
                    <option value="design">Designer</option>
                    <option value="cyber">Cybersecurity</option>
                    <option value="analyst">Analyst</option>
                  </select>
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
                      <p className="mb-2"><strong>Address:</strong> [Company Address]</p>
                      <p className="mb-2"><strong>Contact:</strong> [Company Contact]</p>
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
                        <p>The team member agrees to perform assigned duties with diligence and integrity.</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                        <p>Astraronix Solutions will provide necessary tools, resources, and agreed-upon compensation.</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                        <p>Both parties must maintain confidentiality of all proprietary information.</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                        <p>Either party may terminate this agreement with written notice, subject to any additional terms agreed upon.</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">5</span>
                        <p>The team member will adhere to company policies and procedures.</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">6</span>
                        <p>Intellectual property created during employment belongs to Astraronix Solutions.</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">7</span>
                        <p>This contract is governed by applicable employment laws.</p>
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