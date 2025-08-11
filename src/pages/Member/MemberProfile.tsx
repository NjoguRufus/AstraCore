import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { updateUser, getTeams, createTeam } from '../../services/firebaseService';
import { Team } from '../../types';
import { uploadToCloudinary } from '../../config/cloudinary';
import { generateIDCard } from '../../utils/pdf';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Layout } from '../../components/Layout/Layout';
import { 
  User as UserIcon, 
  Camera, 
  Github, 
  Linkedin, 
  Phone, 
  Mail,
  Download,
  Edit,
  Save,
  X,
  Search,
  Users,
  Plus,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export const MemberProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showNotification } = useModal();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: '',
    team: '',
    role: 'dev' as 'dev' | 'admin' | 'design' | 'cyber' | 'analyst',
    bio: '',
    github: '',
    linkedin: '',
    phone: '',
    skills: [] as string[]
  });

  const [skillInput, setSkillInput] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [showTeamCreation, setShowTeamCreation] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  
  // New team selection states
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [teamValidationError, setTeamValidationError] = useState('');

  // Click outside handler for team selector
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showTeamSelector && !target.closest('.team-selector')) {
        setShowTeamSelector(false);
        setTeamSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTeamSelector]);

  const resetProfileData = () => {
    if (user) {
      setProfileData({
        name: user.name || '',
        team: user.team || '',
        role: user.role || ('dev' as const),
        bio: user.bio || '',
        github: user.github || '',
        linkedin: user.linkedin || '',
        phone: user.phone || '',
        skills: user.skills || []
      });
    }
    setIsEditing(false);
    setTeamValidationError('');
  };

  React.useEffect(() => {
    if (user) {
      // Only update profileData if we're not currently editing
      // This prevents overwriting user's current edits
      if (!isEditing) {
        setProfileData({
          name: user.name || '',
          team: user.team || '',
          role: user.role || ('dev' as const),
          bio: user.bio || '',
          github: user.github || '',
          linkedin: user.linkedin || '',
          phone: user.phone || '',
          skills: user.skills || []
        });
      }
    }
  }, [user, isEditing]);

  // Load teams when component mounts
  React.useEffect(() => {
    const loadTeams = async () => {
      setLoadingTeams(true);
      try {
        const teamsData = await getTeams();
        
        // If no teams exist, create some default teams
        if (teamsData.length === 0) {
          const defaultTeams = [
            { name: 'Development', description: 'Software development team', color: '#3B82F6' },
            { name: 'Design', description: 'UI/UX design team', color: '#8B5CF6' },
            { name: 'Cybersecurity', description: 'Security and compliance team', color: '#10B981' },
            { name: 'Analytics', description: 'Data analysis and insights team', color: '#F59E0B' }
          ];

          for (const team of defaultTeams) {
            try {
              await createTeam({
                name: team.name,
                description: team.description,
                color: team.color,
                createdBy: user?.uid || 'system',
                isActive: true
              });
            } catch (error) {
              console.error(`Error creating default team ${team.name}:`, error);
            }
          }

          // Reload teams after creating defaults
          const updatedTeams = await getTeams();
          setTeams(updatedTeams);
        } else {
          setTeams(teamsData);
        }
      } catch (error) {
        console.error('Error loading teams:', error);
        showNotification({
          title: 'Error',
          message: 'Failed to load teams. Please try again.',
          type: 'error'
        });
      } finally {
        setLoadingTeams(false);
      }
    };

    if (user) {
      loadTeams();
    }
  }, [user, showNotification]);

  // Filtered teams based on search query
  const filteredTeams = useMemo(() => {
    if (!teamSearchQuery.trim()) return teams;
    return teams.filter(team => 
      team.name.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
      team.description?.toLowerCase().includes(teamSearchQuery.toLowerCase())
    );
  }, [teams, teamSearchQuery]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !user) return;

    // Validate team name
    if (newTeamName.trim().length < 2) {
      setTeamValidationError('Team name must be at least 2 characters long');
      return;
    }

    if (newTeamName.trim().length > 50) {
      setTeamValidationError('Team name must be less than 50 characters');
      return;
    }

    // Check if team name already exists
    if (teams.some(team => team.name.toLowerCase() === newTeamName.trim().toLowerCase())) {
      setTeamValidationError('A team with this name already exists');
      return;
    }

    setTeamValidationError('');
    setCreatingTeam(true);
    
    try {
      await createTeam({
        name: newTeamName.trim(),
        description: newTeamDescription.trim(),
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`, // Random color
        createdBy: user.uid,
        isActive: true
      });

      // Reload teams
      const teamsData = await getTeams();
      setTeams(teamsData);

      // Set the new team as selected
      const newTeam = teamsData.find(team => team.name === newTeamName.trim());
      if (newTeam) {
        setProfileData(prev => ({ ...prev, team: newTeam.name }));
        setShowTeamSelector(false);
      }

      // Reset form
      setNewTeamName('');
      setNewTeamDescription('');
      setShowTeamCreation(false);

      showNotification({
        title: 'Team Created',
        message: `Team "${newTeamName.trim()}" has been created successfully!`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error creating team:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to create team. Please try again.',
        type: 'error'
      });
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleTeamSelection = (teamName: string) => {
    setProfileData(prev => ({ ...prev, team: teamName }));
    setShowTeamSelector(false);
    setTeamSearchQuery('');
    setTeamValidationError('');
    
    // Show success notification
    const selectedTeam = teams.find(team => team.name === teamName);
    showNotification({
      title: 'Team Selected',
      message: `You've joined the ${teamName} team${selectedTeam?.description ? `: ${selectedTeam.description}` : ''}`,
      type: 'success'
    });
  };

  const validateTeamSelection = () => {
    if (!profileData.team || profileData.team.trim() === '') {
      setTeamValidationError('Please select a team');
      return false;
    }
    
    // Check if selected team still exists
    if (!teams.some(team => team.name === profileData.team)) {
      setTeamValidationError('Selected team no longer exists. Please choose another team.');
      return false;
    }
    
    setTeamValidationError('');
    return true;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingPhoto(true);
    try {
      const photoURL = await uploadToCloudinary(file);
      await updateUser(user.uid, { photoURL });
      
      showNotification({
        title: 'Photo Updated',
        message: 'Your profile photo has been updated successfully!',
        type: 'success'
      });
      
      await refreshUser();
    } catch (error) {
      console.error('Photo upload error:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to upload photo. Please try again.',
        type: 'error'
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    // Validate team selection
    if (!validateTeamSelection()) {
      return;
    }

    if (!profileData.name.trim()) {
      showNotification({
        title: 'Validation Error',
        message: 'Name is required. Please enter your full name.',
        type: 'warning'
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateUser(user.uid, profileData);
      setIsEditing(false);
      setTeamValidationError('');
      
      showNotification({
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully!',
        type: 'success'
      });
      
      await refreshUser();
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to update profile. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadID = () => {
    if (user) {
      generateIDCard(user);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !profileData.skills.includes(skillInput.trim())) {
      setProfileData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
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

  if (!user) return null;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">Manage your personal information and settings</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleDownloadID}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download ID Card</span>
            </Button>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={resetProfileData}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  isLoading={isLoading}
                  className="flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg mx-auto"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center border-4 border-white shadow-lg mx-auto">
                    <UserIcon className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploadingPhoto}
                />
                <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 shadow-lg">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isEditing ? profileData.name : user.name}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                <div className="flex justify-center mt-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Employee ID:</strong> {user.idCode || 'Not assigned'}</p>
                <p><strong>Team:</strong> {isEditing ? (profileData.team || user.team || 'Not assigned') : (user.team || 'Not assigned')}</p>
                <p><strong>Joined:</strong> {user.createdAt ? user.createdAt.toLocaleDateString() : 'No date'}</p>
              </div>
            </div>
          </Card>

          {/* Profile Details */}
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-gray-900">{user.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Choose a team to collaborate with other members on projects and share resources
                  </p>
                  {isEditing ? (
                    <div className="space-y-3">
                      {/* Team Selection Button */}
                      <div className="relative team-selector">
                        <button
                          type="button"
                          onClick={() => setShowTeamSelector(!showTeamSelector)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left bg-white hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className={profileData.team ? 'text-gray-900' : 'text-gray-500'}>
                              {profileData.team || 'Select a team'}
                            </span>
                            <div className="flex items-center space-x-2">
                              {profileData.team && (
                                <span 
                                  className="w-3 h-3 rounded-full"
                                  style={{ 
                                    backgroundColor: teams.find(t => t.name === profileData.team)?.color || '#6B7280' 
                                  }}
                                />
                              )}
                              <span className="text-gray-400">▼</span>
                            </div>
                          </div>
                        </button>

                        {/* Team Selector Dropdown */}
                        {showTeamSelector && (
                          <div className="team-selector absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
                            {/* Search Bar */}
                            <div className="p-3 border-b border-gray-200">
                              <div className="flex items-center space-x-2">
                                <div className="relative flex-1">
                                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <input
                                    type="text"
                                    placeholder="Search teams..."
                                    value={teamSearchQuery}
                                    onChange={(e) => setTeamSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && filteredTeams.length === 1) {
                                        handleTeamSelection(filteredTeams[0].name);
                                      }
                                    }}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                  />
                                  {teamSearchQuery && (
                                    <p className="mt-1 text-xs text-gray-500">
                                      Press Enter to select if only one team matches
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTeamSearchQuery('');
                                    // Reload teams
                                    const loadTeams = async () => {
                                      setLoadingTeams(true);
                                      try {
                                        const teamsData = await getTeams();
                                        setTeams(teamsData);
                                      } catch (error) {
                                        console.error('Error reloading teams:', error);
                                      } finally {
                                        setLoadingTeams(false);
                                      }
                                    };
                                    loadTeams();
                                  }}
                                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Refresh teams"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Team List */}
                            <div className="max-h-60 overflow-y-auto">
                              {loadingTeams ? (
                                <div className="p-6 text-center">
                                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
                                  <p className="text-sm text-gray-500">Loading teams...</p>
                                </div>
                              ) : filteredTeams.length > 0 ? (
                                filteredTeams.map((team) => (
                                  <button
                                    key={team.id}
                                    type="button"
                                    onClick={() => handleTeamSelection(team.name)}
                                    className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                                      profileData.team === team.name ? 'bg-blue-50 border-blue-200' : ''
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div 
                                        className="w-4 h-4 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: team.color || '#6B7280' }}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 truncate">
                                          {team.name}
                                        </div>
                                        {team.description && (
                                          <div className="text-sm text-gray-500 truncate">
                                            {team.description}
                                          </div>
                                        )}
                                      </div>
                                      {profileData.team === team.name && (
                                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                      )}
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="p-3 text-center text-gray-500">
                                  {teamSearchQuery ? (
                                    <div className="space-y-2">
                                      <p>No teams found matching "{teamSearchQuery}"</p>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowTeamCreation(true);
                                          setShowTeamSelector(false);
                                          setNewTeamName(teamSearchQuery);
                                        }}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                      >
                                        Create "{teamSearchQuery}" team
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="p-4 text-center">
                                      <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                      <p className="text-sm text-gray-500 mb-3">No teams available</p>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowTeamCreation(true);
                                          setShowTeamSelector(false);
                                        }}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                      >
                                        Create your first team
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Create New Team Button */}
                            <div className="p-3 border-t border-gray-200 bg-gray-50">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowTeamCreation(true);
                                  setShowTeamSelector(false);
                                }}
                                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Create New Team</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Team Validation Error */}
                      {teamValidationError && (
                        <div className="flex items-center space-x-2 text-sm text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span>{teamValidationError}</span>
                        </div>
                      )}

                      {/* Selected Team Info */}
                      {profileData.team && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ 
                                backgroundColor: teams.find(t => t.name === profileData.team)?.color || '#6B7280' 
                              }}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{profileData.team}</div>
                              {teams.find(t => t.name === profileData.team)?.description && (
                                <div className="text-sm text-gray-600">
                                  {teams.find(t => t.name === profileData.team)?.description}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setProfileData(prev => ({ ...prev, team: '' }))}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Create New Team Form */}
                      {showTeamCreation && (
                        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-900">Create New Team</h4>
                            <button
                              type="button"
                              onClick={() => setShowTeamCreation(false)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <input
                                type="text"
                                placeholder="Team name"
                                value={newTeamName}
                                onChange={(e) => {
                                  setNewTeamName(e.target.value);
                                  if (teamValidationError) setTeamValidationError('');
                                }}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                                  teamValidationError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                                }`}
                              />
                              {teamValidationError && (
                                <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>{teamValidationError}</span>
                                </p>
                              )}
                                                            <p className="mt-1 text-xs text-gray-500">
                                {newTeamName.length}/50 characters • Press Ctrl+Enter to create team
                              </p>
                            </div>
                            <textarea
                                placeholder="Team description (optional)"
                                value={newTeamDescription}
                                onChange={(e) => setNewTeamDescription(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.ctrlKey && newTeamName.trim()) {
                                    e.preventDefault();
                                    handleCreateTeam();
                                  }
                                }}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            <button
                              type="button"
                              onClick={handleCreateTeam}
                              disabled={!newTeamName.trim() || creatingTeam}
                              className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center space-x-2"
                            >
                              {creatingTeam ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                  <span>Creating Team...</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4" />
                                  <span>Create Team</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ 
                          backgroundColor: teams.find(t => t.name === user.team)?.color || '#6B7280' 
                        }}
                      />
                      <span className="text-gray-900">{user.team || 'Not assigned'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Role (Admin only) */}
              {user.isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  {isEditing ? (
                    <select
                      value={profileData.role || user.role}
                      onChange={(e) => setProfileData(prev => ({ ...prev, role: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="dev">Developer</option>
                      <option value="design">Designer</option>
                      <option value="cyber">Cybersecurity</option>
                      <option value="analyst">Analyst</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{user.role}</p>
                  )}
                </div>
              )}

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-gray-900">{user.bio || 'No bio added yet'}</p>
                )}
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <p className="text-gray-900">{user.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                  )}
                </div>
              </div>

              {/* Social Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Github className="w-4 h-4 inline mr-1" />
                    GitHub
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={profileData.github}
                      onChange={(e) => setProfileData(prev => ({ ...prev, github: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://github.com/username"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {user.github ? (
                        <a href={user.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {user.github}
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Linkedin className="w-4 h-4 inline mr-1" />
                    LinkedIn
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={profileData.linkedin}
                      onChange={(e) => setProfileData(prev => ({ ...prev, linkedin: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://linkedin.com/in/username"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {user.linkedin ? (
                        <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {user.linkedin}
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills & Technologies
                </label>
                {isEditing ? (
                  <div>
                    <div className="flex space-x-2 mb-3">
                      <input
                        type="text"
                        placeholder="Add a skill"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Button type="button" onClick={addSkill} variant="outline">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profileData.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {user.skills.length > 0 ? (
                      user.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500">No skills added yet</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
