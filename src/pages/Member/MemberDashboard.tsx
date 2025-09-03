import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { useCollection } from '../../hooks/useFirestore';
import { useProjectNotifications } from '../../hooks/useProjectNotifications';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Layout } from '../../components/Layout/Layout';
import { generateIDCard } from '../../utils/pdf';
import { generateContractPDF, generateContractHTML, generateContractPDFFromScreenshot } from '../../utils/contractPdf';
import { formatDate, getDaysUntilDeadline, getDeadlineColor } from '../../utils/dateUtils';
import { 
  Download, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Bell, 
  Award,
  Users,
  BookOpen,
  Target,
  Calendar,
  X,
  Info,
  FileText
} from 'lucide-react';
import { Project, Announcement, User } from '../../types';

export const MemberDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useModal();
  const { data: projects, loading: projectsLoading, error: projectsError } = useCollection<Project>('projects');
  const { data: announcements, loading: announcementsLoading, error: announcementsError } = useCollection<Announcement>('announcements');
  const { data: users, loading: usersLoading, error: usersError } = useCollection<User>('users');
  const { newProjects, hasNewNotifications, clearNotifications } = useProjectNotifications();
  
  const [showNotifications, setShowNotifications] = useState(true);
  const [showContractModal, setShowContractModal] = useState(false);
  const [userContract, setUserContract] = useState<any>(null);
  const [loadingContract, setLoadingContract] = useState(false);
  const [viewMode, setViewMode] = useState<'simple' | 'html'>('simple');
  const [showProjectMembersModal, setShowProjectMembersModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Check if onboarding is completed
  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      window.location.href = '/onboarding';
    }
  }, [user]);

  // Filter projects for the current user
  const userProjects = projects.filter(project => 
    project.assignedTo.includes(user?.uid || '')
  );
  
  // Filter announcements for the current user based on targeting
  const userAnnouncements = announcements.filter(announcement => {
    if (announcement.targetType === 'all') return true;
    if (announcement.targetType === 'team' && announcement.targetTeam === user?.team) return true;
    if (announcement.targetType === 'individual' && announcement.targetMembers?.includes(user?.uid || '')) return true;
    if (!announcement.targetType) return true;
    return false;
  });
  
  const completedProjects = userProjects.filter(p => p.status === 'completed');
  const inProgressProjects = userProjects.filter(p => p.status === 'in-progress');
  const upcomingProjects = userProjects.filter(p => p.status === 'upcoming');

  const handleDownloadID = () => {
    if (user) {
      generateIDCard(user);
    }
  };

  const handleViewContract = async () => {
    if (!user) return;
    
    setLoadingContract(true);
    try {
      const { getContractByUserId } = await import('../../services/firebaseService');
      const contract = await getContractByUserId(user.uid);
      
      if (contract) {
        setUserContract(contract);
        setShowContractModal(true);
      } else if (user.contractId) {
        const { getContractById } = await import('../../services/firebaseService');
        const contractById = await getContractById(user.contractId);
        if (contractById) {
          setUserContract(contractById);
          setShowContractModal(true);
        } else {
          showNotification({
            title: 'Contract Not Found',
            message: 'Contract not found. Please contact an administrator.',
            type: 'warning'
          });
        }
      } else {
        showNotification({
          title: 'No Contract',
          message: 'No contract found. Please contact an administrator.',
          type: 'warning'
        });
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
      showNotification({
        title: 'Error',
        message: 'Error loading contract. Please try again.',
        type: 'error'
      });
    } finally {
      setLoadingContract(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'upcoming': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4" />;
      case 'upcoming': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  // Helper function to determine project assignment type
  const getProjectAssignmentType = (project: Project) => {
    if (project.assignedType) return project.assignedType;
    if (project.assignedTo.length > 2) return 'team';
    if (project.assignedTo.length === 2) return 'hybrid';
    return 'individual';
  };

  // Helper function to get project members
  const getProjectMembers = (project: Project) => {
    return users.filter(user => project.assignedTo.includes(user.uid));
  };

  // Helper function to open project members modal
  const handleViewProjectMembers = (project: Project) => {
    setSelectedProject(project);
    setShowProjectMembersModal(true);
  };

  return (
    <Layout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {/* Error Display (hidden by request) */}

        {/* Loading States */}
        {(projectsLoading || announcementsLoading || usersLoading) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-700">
              {projectsLoading && announcementsLoading && usersLoading ? 'Loading data...' : 
               projectsLoading && announcementsLoading ? 'Loading projects and announcements...' :
               projectsLoading && usersLoading ? 'Loading projects and team data...' :
               announcementsLoading && usersLoading ? 'Loading announcements and team data...' :
               projectsLoading ? 'Loading projects...' : 
               announcementsLoading ? 'Loading announcements...' :
               usersLoading ? 'Loading team data...' : 'Loading...'}
            </p>
          </div>
        )}

        {/* Welcome Header (polished mobile-first layout) */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-4 sm:p-6 md:p-8 text-white">
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {user?.name}!</h1>
            </div>
            <div className="flex items-center justify-center gap-4 md:gap-8">
              <img
                src="https://imgur.com/T7mH4Ly.png"
                alt="Astracore Logo"
                className="w-12 h-12 md:w-16 md:h-16 object-contain bg-white rounded-xl p-2"
              />
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.name}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-blue-100 text-sm md:text-base">
                {user?.role} • {user?.team} • ID: {user?.idCode}
              </p>
            </div>
          </div>
        </div>

        {/* New Project Notifications */}
        {showNotifications && hasNewNotifications && newProjects.length > 0 && (
          <Card className="border-l-4 border-l-blue-500 bg-blue-50">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bell className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">New Project Assignments!</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    You have been assigned {newProjects.length} new project{newProjects.length > 1 ? 's' : ''} today.
                  </p>
                  <div className="mt-2 space-y-1">
                    {newProjects.map(project => (
                      <div key={project.id} className="flex items-center space-x-2 text-sm">
                        <Target className="w-3 h-3 text-blue-600" />
                        <span className="text-blue-800 font-medium">{project.title}</span>
                        <span className="text-blue-600">•</span>
                        <span className="text-blue-700">{project.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNotifications(false);
                  clearNotifications();
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <Card className="text-center p-3 sm:p-4">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{completedProjects.length}</p>
                <p className="text-xs sm:text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </Card>

          <Card className="text-center p-3 sm:p-4">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{inProgressProjects.length}</p>
                <p className="text-xs sm:text-sm text-gray-600">In Progress</p>
              </div>
            </div>
          </Card>

          <Card className="text-center p-3 sm:p-4">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-orange-600">{upcomingProjects.length}</p>
                <p className="text-xs sm:text-sm text-gray-600">Upcoming</p>
              </div>
            </div>
          </Card>

          <Card className="text-center p-3 sm:p-4">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">{user?.skills.length || 0}</p>
                <p className="text-xs sm:text-sm text-gray-600">Skills</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Projects and Announcements Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Projects */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>My Projects</span>
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/member/projects'}
              >
                View All
              </Button>
            </div>

            <div className="space-y-3">
              {userProjects.slice(0, 5).map((project) => (
                <div key={project.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{project.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                      <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span className={getDeadlineColor(project.deadline)}>
                            {getDaysUntilDeadline(project.deadline)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {getProjectAssignmentType(project) === 'team' ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              <Users className="w-2.5 h-2.5 mr-1" />
                              Team Project
                            </span>
                          ) : getProjectAssignmentType(project) === 'hybrid' ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                              <Users className="w-2.5 h-2.5 mr-1" />
                              Team + Individual
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              <Users className="w-2.5 h-2.5 mr-1" />
                              Individual
                            </span>
                          )}
                        </div>
                        
                        {project.team && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{project.team}</span>
                          </div>
                        )}
                        
                        {/* Show "See Other Project Members" button for team projects */}
                        {getProjectAssignmentType(project) === 'team' && project.assignedTo.length > 2 && (
                          <div className="mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewProjectMembers(project)}
                              className="text-blue-600 hover:text-blue-700 text-xs"
                            >
                              <Users className="w-3 h-3 mr-1" />
                              See Other Project Members ({project.assignedTo.length})
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-3 flex flex-col items-end space-y-2">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                        {getStatusIcon(project.status)}
                        <span className="capitalize">{project.status.replace('-', ' ')}</span>
                      </span>
                      
                      {/* Show completion timestamp for completed projects */}
                      {project.status === 'completed' && project.completedAt && (
                        <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                          ✓ {formatDate(project.completedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {userProjects.length === 0 && (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">No projects assigned yet.</p>
                  <p className="text-sm text-gray-400">Projects will appear here once assigned by an admin.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Announcements Section */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Latest Announcements</span>
              </h2>
            </div>

            <div className="space-y-3">
              {userAnnouncements.slice(0, 3).map((announcement) => (
                <div key={announcement.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{announcement.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                      
                      <div className="mt-2">
                        {announcement.targetType === 'all' ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            <Users className="w-3 h-3 mr-1" />
                            Company-wide
                          </span>
                        ) : announcement.targetType === 'team' && announcement.targetTeam ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            <Users className="w-3 h-3 mr-1" />
                            Team: {announcement.targetTeam}
                          </span>
                        ) : announcement.targetType === 'individual' && announcement.targetMembers && announcement.targetMembers.length > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                            <Users className="w-3 h-3 mr-1" />
                            Personal Message
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                            <Info className="w-3 h-3 mr-1" />
                            General
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        announcement.priority === 'high' 
                          ? 'bg-red-100 text-red-800'
                          : announcement.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {announcement.priority}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDate(announcement.createdAt)}
                  </p>
                </div>
              ))}
              {userAnnouncements.length === 0 && (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">No announcements for you yet.</p>
                  <p className="text-sm text-gray-400">
                    You'll see company-wide, team-specific, and personal announcements here.
                  </p>
                </div>
              )}
              
              {userAnnouncements.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.location.href = '/announcements'}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    View All Announcements
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Team Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>My Team</span>
            </h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {user?.team || 'No team assigned'}
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/member/profile'}
              >
                View All
              </Button>
            </div>
          </div>
          
          {user?.team ? (
            <div className="space-y-3">
              {usersLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-sm text-gray-500">Loading team members...</p>
                </div>
              )}
              
              {!usersLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {users
                    ?.filter(member => member.team === user.team && member.uid !== user.uid)
                    .map((member) => (
                      <div key={member.uid} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        {member.photoURL ? (
                          <img
                            src={member.photoURL}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900 truncate">
                              {member.name}
                              {member.uid === user.uid && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                  You
                                </span>
                              )}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                              member.role === 'admin' 
                                ? 'bg-red-100 text-red-800'
                                : member.role === 'dev'
                                ? 'bg-blue-100 text-blue-800'
                                : member.role === 'design'
                                ? 'bg-purple-100 text-purple-800'
                                : member.role === 'cyber'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {member.role}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Target className="w-3 h-3" />
                              <span>
                                {userProjects.filter(p => p.assignedTo.includes(member.uid)).length} projects
                              </span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Award className="w-3 h-3" />
                              <span>
                                {member.skills?.length || 0} skills
                              </span>
                            </span>
                            <span className={`flex items-center space-x-1 ${
                              member.status === 'active' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${
                                member.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                              }`}></div>
                              <span className="capitalize">{member.status}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              
              {!usersLoading && users && users.filter(member => member.team === user.team && member.uid !== user.uid).length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">You're the only member in this team</p>
                  <p className="text-sm text-gray-400">More team members will appear here when they join.</p>
                </div>
              )}
              
              {!usersLoading && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-900 font-medium">
                      Team Summary
                    </span>
                    <span className="text-blue-700">
                      {users?.filter(member => member.team === user.team).length || 0} members
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-blue-700">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>
                        {users?.filter(member => member.team === user.team && member.status === 'active').length || 0} active
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {userProjects.filter(p => getProjectAssignmentType(p) === 'team').length} team projects
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No team assigned</p>
              <p className="text-sm text-gray-400">Contact your administrator to join a team.</p>
            </div>
          )}
        </Card>

        {/* Skills & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My Skills</h2>
            <div className="flex flex-wrap gap-2">
              {user?.skills?.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {skill}
                </span>
              ))}
              {(!user?.skills || user.skills.length === 0) && (
                <div className="text-center py-4">
                  <Award className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No skills added yet.</p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/wiki'}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Wiki
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/member/profile'}
              >
                <Users className="w-4 h-4 mr-2" />
                View Team
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/member/projects'}
              >
                <Target className="w-4 h-4 mr-2" />
                My Projects
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleViewContract}
                disabled={loadingContract}
              >
                <FileText className="w-4 h-4 mr-2" />
                {loadingContract ? 'Loading...' : 'View Contract'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

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
                      <p className="mb-2"><strong>Address:</strong> Online</p>
                      <p className="mb-2"><strong>Contact:</strong> +254714748299</p>
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
                      <Info className="w-4 h-4 text-blue-600 mr-2" />
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

      {/* Project Members Modal */}
      {showProjectMembersModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Project Members: {selectedProject.title}
              </h2>
              <Button
                variant="outline"
                onClick={() => setShowProjectMembersModal(false)}
              >
                Close
              </Button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                  <Users className="w-4 h-4" />
                  <span>{selectedProject.assignedTo.length} members assigned</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Target className="w-4 h-4" />
                  <span>Status: {selectedProject.status}</span>
                  <span>•</span>
                  <span>Deadline: {formatDate(selectedProject.deadline)}</span>
                </div>
              </div>

              <div className="space-y-4">
                {getProjectMembers(selectedProject).map((member) => (
                  <div key={member.uid} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    {member.photoURL ? (
                      <img
                        src={member.photoURL}
                        alt={member.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                        <Users className="w-8 h-8 text-blue-600" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {member.name}
                          {member.uid === user?.uid && (
                            <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              You
                            </span>
                          )}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          member.role === 'admin' 
                            ? 'bg-red-100 text-red-800'
                            : member.role === 'dev'
                            ? 'bg-blue-100 text-blue-800'
                            : member.role === 'design'
                            ? 'bg-purple-100 text-purple-800'
                            : member.role === 'cyber'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>Team: {member.team}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Award className="w-4 h-4" />
                          <span>{member.skills?.length || 0} skills</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4" />
                          <span>
                            {userProjects.filter(p => p.assignedTo.includes(member.uid)).length} projects
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            member.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span className="capitalize">{member.status}</span>
                        </div>
                      </div>
                      
                      {member.bio && (
                        <p className="text-sm text-gray-700 mt-2 italic">
                          "{member.bio}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};