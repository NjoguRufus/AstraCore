import React, { useState } from 'react';
import { useCollection } from '../../hooks/useFirestore';
import { useModal } from '../../contexts/ModalContext';
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../services/firebaseService';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Layout } from '../../components/Layout/Layout';
import { 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  AlertCircle,
  Info,
  CheckCircle,
  Users,
  Target
} from 'lucide-react';
import { Announcement, User, Team } from '../../types';
import { Timestamp } from 'firebase/firestore';

export const AnnouncementManagement: React.FC = () => {
  const { data: announcements } = useCollection<Announcement>('announcements');
  const { data: users } = useCollection<User>('users');
  const { data: teams } = useCollection<Team>('teams');
  const { showConfirmation, showNotification } = useModal();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [targetFilter, setTargetFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    targetType: '' as '' | 'all' | 'team' | 'individual',
    targetTeam: '',
    targetMembers: [] as string[]
  });

  // Helper function to get team members
  const getTeamMembers = (teamName: string) => {
    return users?.filter(member => member.team === teamName) || [];
  };

  // Helper function to get target audience count
  const getTargetAudienceCount = () => {
    switch (announcementForm.targetType) {
      case 'all':
        return users?.length || 0;
      case 'team':
        return announcementForm.targetTeam ? getTeamMembers(announcementForm.targetTeam).length : 0;
      case 'individual':
        return announcementForm.targetMembers.length;
      default:
        return 0;
    }
  };

  // Helper function to convert Firestore Timestamp to Date if needed
  const getDate = (date: Date | Timestamp | undefined): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof (date as Timestamp).toDate === 'function') return (date as Timestamp).toDate();
    return null;
  };

  // Helper function to format date
  const formatDate = (date: Date | Timestamp | undefined): string => {
    const jsDate = getDate(date);
    return jsDate ? jsDate.toLocaleDateString() : 'No date';
  };

  // Helper function to format time
  const formatTime = (date: Date | Timestamp | undefined): string => {
    const jsDate = getDate(date);
    return jsDate ? jsDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || announcement.priority === priorityFilter;
    const matchesTarget = targetFilter === 'all' || announcement.targetType === targetFilter;
    return matchesSearch && matchesPriority && matchesTarget;
  });

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
      setShowCreateModal(false);
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

  const handleUpdateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement) return;

    setIsLoading(true);
    try {
      await updateAnnouncement(editingAnnouncement.id, announcementForm);

      setEditingAnnouncement(null);
      setAnnouncementForm({ 
        title: '', 
        content: '', 
        priority: 'medium',
        targetType: '',
        targetTeam: '',
        targetMembers: []
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error updating announcement:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to update announcement. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    const confirmed = await showConfirmation({
      title: 'Delete Announcement',
      message: 'Are you sure you want to delete this announcement?',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    try {
      await deleteAnnouncement(announcementId);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to delete announcement. Please try again.',
        type: 'error'
      });
    }
  };

  const startEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      targetType: announcement.targetType || '',
      targetTeam: announcement.targetTeam || '',
      targetMembers: announcement.targetMembers || []
    });
    setShowCreateModal(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4" />;
      case 'medium': return <Info className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Announcement Management</h1>
            <p className="text-gray-600 mt-1">Create and manage company announcements</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Announcement</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </Card>

          <Card className="text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {announcements.filter(a => a.priority === 'high').length}
                </p>
                <p className="text-sm text-gray-600">High Priority</p>
              </div>
            </div>
          </Card>

          <Card className="text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Info className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {announcements.filter(a => a.priority === 'medium').length}
                </p>
                <p className="text-sm text-gray-600">Medium Priority</p>
              </div>
            </div>
          </Card>

          <Card className="text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {announcements.filter(a => a.priority === 'low').length}
                </p>
                <p className="text-sm text-gray-600">Low Priority</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-gray-400" />
              <select
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Targets</option>
                <option value="all">All Members</option>
                <option value="team">Team Specific</option>
                <option value="individual">Individual Members</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Announcements List */}
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => (
            <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">{announcement.title}</h3>
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(announcement.priority)}`}>
                      {getPriorityIcon(announcement.priority)}
                      <span className="capitalize">{announcement.priority}</span>
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{announcement.content}</p>
                  
                  {/* Target Audience Display */}
                  <div className="mb-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Target Audience:</span>
                    </div>
                    {announcement.targetType === 'all' ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        <Users className="w-3 h-3 mr-1" />
                        All Members
                      </span>
                    ) : announcement.targetType === 'team' && announcement.targetTeam ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        <Users className="w-3 h-3 mr-1" />
                        Team: {announcement.targetTeam}
                      </span>
                    ) : announcement.targetType === 'individual' && announcement.targetMembers && announcement.targetMembers.length > 0 ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                        <Users className="w-3 h-3 mr-1" />
                        {announcement.targetMembers.length} Individual Member{announcement.targetMembers.length !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        No target specified
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-400">
                    Created: {formatDate(announcement.createdAt)} at {formatTime(announcement.createdAt)}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    onClick={() => startEditAnnouncement(announcement)}
                    variant="ghost"
                    size="sm"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredAnnouncements.length === 0 && (
          <Card className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first announcement.</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Announcement
            </Button>
          </Card>
        )}

        {/* Create/Edit Announcement Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
              </h2>
              <form onSubmit={editingAnnouncement ? handleUpdateAnnouncement : handleCreateAnnouncement} className="space-y-4">
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
                  <p className="text-xs text-blue-600 mb-2">
                    💡 <strong>Tip:</strong> Use "All Members" for company-wide announcements, "Team" for team-specific updates, or "Individual" for personalized messages.
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
                        {users
                          ?.filter(member => !announcementForm.targetTeam || member.team === announcementForm.targetTeam)
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
                        {users?.filter(member => !announcementForm.targetTeam || member.team === announcementForm.targetTeam).length === 0 && (
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
                        <span className="font-medium">All Members:</span> {users?.length || 0} active members
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
                            const member = users?.find(m => m.uid === memberId);
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
                      setShowCreateModal(false);
                      setEditingAnnouncement(null);
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
                    {editingAnnouncement ? 'Update' : 'Create'} Announcement
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
      </div>
    </Layout>
  );
};