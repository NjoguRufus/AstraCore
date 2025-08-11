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
import { Project, Announcement } from '../../types';

export const MemberDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useModal();
  const { data: projects, loading: projectsLoading, error: projectsError } = useCollection<Project>('projects');
  const { data: announcements, loading: announcementsLoading, error: announcementsError } = useCollection<Announcement>('announcements');
  const { newProjects, hasNewNotifications, clearNotifications } = useProjectNotifications();
  
  const [showNotifications, setShowNotifications] = useState(true);
  const [showContractModal, setShowContractModal] = useState(false);
  const [userContract, setUserContract] = useState<any>(null);
  const [loadingContract, setLoadingContract] = useState(false);
  const [viewMode, setViewMode] = useState<'simple' | 'html'>('simple');

  // Check if onboarding is completed
  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      window.location.href = '/onboarding';
    }
  }, [user]);

  const userProjects = projects.filter(project => 
    project.assignedTo.includes(user?.uid || '')
  );
  
  // Debug: Log project filtering
  console.log('MemberDashboard - All projects:', projects.length);
  console.log('MemberDashboard - User UID:', user?.uid);
  console.log('MemberDashboard - User projects:', userProjects.length);
  console.log('MemberDashboard - User projects details:', userProjects.map(p => ({ id: p.id, title: p.title, assignedTo: p.assignedTo })));
  
  // Debug: Log authentication state
  console.log('MemberDashboard - User object:', user);
  console.log('MemberDashboard - User status:', user?.status);
  console.log('MemberDashboard - User isAdmin:', user?.isAdmin);
  
  // Log any errors
  if (projectsError) {
    console.error('Projects loading error:', projectsError);
  }
  if (announcementsError) {
    console.error('Announcements loading error:', announcementsError);
  }

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
      // Import Firebase service
      const { getContractByUserId } = await import('../../services/firebaseService');
      const contract = await getContractByUserId(user.uid);
      
      if (contract) {
        setUserContract(contract);
        setShowContractModal(true);
      } else {
        // If no contract found, check if user has contractId
        if (user.contractId) {
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

  const formatDeadline = (deadline: any) => {
    if (!deadline) return 'No deadline';
    return formatDate(deadline);
  };

  return (
    <>
      <Layout>
      <div className="p-6 space-y-6">
        {/* Error Display */}
        {(projectsError || announcementsError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">Data Loading Errors</h3>
            {projectsError && (
              <p className="text-red-700 mb-2">
                <strong>Projects Error:</strong> {projectsError.message}
              </p>
            )}
            {announcementsError && (
              <p className="text-red-700">
                <strong>Announcements Error:</strong> {announcementsError.message}
              </p>
            )}
          </div>
        )}

        {/* Loading States */}
        {(projectsLoading || announcementsLoading) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-700">
              {projectsLoading && announcementsLoading ? 'Loading data...' : 
               projectsLoading ? 'Loading projects...' : 'Loading announcements...'}
            </p>
          </div>
        )}

        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <img
                src="https://imgur.com/T7mH4Ly.png"
                alt="Astracore Logo"
                className="w-16 h-16 object-contain bg-white rounded-xl p-2"
              />
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.name}
                  className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
                <p className="text-blue-100 text-lg">
                  {user?.role} • {user?.team} • ID: {user?.idCode}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    {completedProjects.length} Projects Completed
                  </span>
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    {user?.skills.length || 0} Skills
                  </span>
                </div>
              </div>
            </div>
            <Button
              onClick={handleDownloadID}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download ID Card</span>
            </Button>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{completedProjects.length}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </Card>

          <Card className="text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{inProgressProjects.length}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>
          </Card>

          <Card className="text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{upcomingProjects.length}</p>
                <p className="text-sm text-gray-600">Upcoming</p>
              </div>
            </div>
          </Card>

          <Card className="text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{user?.skills.length || 0}</p>
                <p className="text-sm text-gray-600">Skills</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>My Projects</span>
              </h2>
              <Button variant="ghost" size="sm">View All</Button>
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
                        {project.team && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{project.team}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`ml-3 inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                      {getStatusIcon(project.status)}
                      <span className="capitalize">{project.status.replace('-', ' ')}</span>
                    </span>
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

          {/* Announcements */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Latest Announcements</span>
              </h2>
            </div>
            <div className="space-y-3">
              {announcements.slice(0, 3).map((announcement) => (
                <div key={announcement.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{announcement.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                    </div>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      announcement.priority === 'high' 
                        ? 'bg-red-100 text-red-800'
                        : announcement.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {announcement.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDate(announcement.createdAt)}
                  </p>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">No announcements yet.</p>
                  <p className="text-sm text-gray-400">Check back later for updates.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Skills & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My Skills</h2>
            <div className="flex flex-wrap gap-2">
              {user?.skills.map((skill) => (
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
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Wiki
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                View Team
              </Button>
              <Button variant="outline" className="w-full justify-start">
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
                      // Generate and download PDF from screenshot
                      if (viewMode === 'html') {
                        // If in HTML view, take screenshot of the current view
                        // Add a small delay to ensure all styles are applied
                        setTimeout(() => {
                          generateContractPDFFromScreenshot(userContract);
                        }, 200);
                      } else {
                        // If in simple view, switch to HTML view first, then generate PDF
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
              {/* View Toggle Buttons */}
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

              {/* Simple View */}
              {viewMode === 'simple' && (
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

              {/* HTML Contract View */}
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

      {/* CSS Styles for HTML Contract View */}
      <style>{`
        .contract-html-view {
          background: white;
          padding: 0;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e5e7eb;
          max-width: 210mm;
          margin: 0 auto;
          overflow: hidden;
        }
        
        .contract-html-view .page {
          width: 210mm;
          min-height: 297mm;
          margin: 0;
          background: white url('/images/contract.jpg') no-repeat top center;
          background-size: cover;
          position: relative;
          padding: 40mm 25mm 20mm 25mm;
          box-sizing: border-box;
          font-family: Arial, sans-serif;
        }
        
        .contract-html-view .page h1 {
          color: white;
          font-size: 22px;
          text-align: center;
          text-transform: uppercase;
          margin-bottom: 20px;
          margin-top: 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
          font-weight: bold;
        }
        
        .contract-html-view .page h2 {
          color: #003366;
          font-size: 16px;
          border-bottom: 2px solid #003366;
          padding-bottom: 3px;
          margin-top: 20px;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        .contract-html-view .page p {
          font-size: 14px;
          line-height: 1.5;
          margin: 4px 0;
          color: #000;
        }
        
        .contract-html-view .page ol {
          padding-left: 18px;
          margin: 10px 0;
          counter-reset: item;
          list-style: none;
        }
        
        .contract-html-view .page ol li {
          font-size: 14px;
          line-height: 1.5;
          margin: 4px 0;
          color: #000;
          counter-increment: item;
          position: relative;
        }
        
        .contract-html-view .page ol li::before {
          content: counter(item) ". ";
          font-weight: bold;
          color: #003366;
          position: absolute;
          left: -18px;
          top: 0;
        }
        
        .contract-html-view .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 25px;
          gap: 20px;
        }
        
        .contract-html-view .signature-block {
          width: 45%;
          text-align: center;
        }
        
        .contract-html-view .signature-block p {
          margin-bottom: 10px;
          font-weight: bold;
          color: #003366;
        }
        
        .contract-html-view .signature-block img {
          max-width: 100%;
          height: auto;
          margin-top: 5px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .contract-html-view .signature-block .selfie-image {
          width: 150px !important;
          height: 150px !important;
          border-radius: 50% !important;
          object-fit: cover !important;
          border: 3px solid #3b82f6 !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          margin-left: 12.7mm !important; /* Push half an inch to the right (12.7mm ≈ 0.5 inch) */
        }
        
        .contract-html-view .meta {
          margin-top: 15px;
          font-size: 14px;
          color: #000;
        }
        
        .contract-html-view .meta p {
          margin: 4px 0;
          color: #000;
        }
        
        .contract-html-view .footer {
          position: absolute;
          bottom: 15mm;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        
        .contract-html-view .letterhead-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 40mm;
          background: rgba(255, 255, 255, 0.1);
          pointer-events: none;
        }
        
        /* Responsive adjustments for smaller screens */
        @media (max-width: 768px) {
        .contract-html-view {
            max-width: 100%;
            margin: 0 10px;
          }
          
        .contract-html-view .page {
            width: 100%;
            padding: 20mm 15mm 15mm 15mm;
            background-size: contain;
          }
          
        .contract-html-view .signatures {
            flex-direction: column;
            gap: 15px;
        }
          
        .contract-html-view .signature-block {
            width: 100%;
          }
        }
      `}</style>
    </Layout>
    </>
  );
};



