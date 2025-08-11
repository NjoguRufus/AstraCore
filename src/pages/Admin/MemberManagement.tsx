import React, { useState } from 'react';
import { useCollection } from '../../hooks/useFirestore';
import { useModal } from '../../contexts/ModalContext';
import { updateUser, deleteUser, toggleUserStatus, getTeams } from '../../services/firebaseService';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Layout } from '../../components/Layout/Layout';
import { 
  Users, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  UserCheck,
  UserX,
  Crown,
  Power,
  PowerOff
} from 'lucide-react';
import { User, Team } from '../../types';

export const MemberManagement: React.FC = () => {
  const { data: users = [], loading } = useCollection<User>('users');
  const { showConfirmation, showNotification } = useModal();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [memberForm, setMemberForm] = useState({
    name: '',
    role: 'dev' as 'dev' | 'design' | 'cyber' | 'analyst' | 'admin',
    team: '',
    isAdmin: false
  });
  const [teams, setTeams] = useState<Team[]>([]);

  // Filter users with proper null checks
  const filteredUsers = users?.filter(user => {
    const matchesSearch = user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user?.idCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user?.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user?.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  const activeMembers = users?.filter(u => u?.status === 'active') || [];
  const deactivatedMembers = users?.filter(u => u?.status === 'deactivated') || [];

  // Load teams when component mounts
  React.useEffect(() => {
    const loadTeams = async () => {
      try {
        const teamsData = await getTeams();
        setTeams(teamsData);
      } catch (error) {
        console.error('Error loading teams:', error);
        showNotification({
          title: 'Error',
          message: 'Failed to load teams. Please try again.',
          type: 'error'
        });
      }
    };

    loadTeams();
  }, [showNotification]);

  const startEditMember = (member: User) => {
    if (!member) return;
    
    setEditingMember(member);
    setMemberForm({
      name: member.name || '',
      role: member.role || 'dev',
      team: member.team || '',
      isAdmin: member.isAdmin || false
    });
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember?.uid) return;

    setIsLoading(true);
    try {
      await updateUser(editingMember.uid, {
        name: memberForm.name,
        role: memberForm.role,
        team: memberForm.team,
        isAdmin: memberForm.isAdmin
      });

      setEditingMember(null);
      setMemberForm({ name: '', role: 'dev', team: '', isAdmin: false });
      showNotification({
        title: 'Success',
        message: 'Member updated successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating member:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to update member. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    if (!userId) return;
    
    const newStatus = currentStatus === 'active' ? 'deactivated' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    const confirmed = await showConfirmation({
      title: 'Update Member Status',
      message: `Are you sure you want to ${action} this member?`,
      type: 'warning',
      confirmText: action === 'activate' ? 'Activate' : 'Deactivate',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

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

  const handleDeleteMember = async (uid: string) => {
    if (!uid) return;

    const confirmed = await showConfirmation({
      title: 'Delete Member',
      message: 'Are you sure you want to permanently delete this member? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete Permanently',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    try {
      await deleteUser(uid);
      showNotification({
        title: 'Success',
        message: 'Member deleted successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting member:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to delete member. Please try again.',
        type: 'error'
      });
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

  if (loading) {
    return (
      <Layout>
        <div className="p-6 flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Member Management</h1>
            <p className="text-gray-600 mt-1">Manage active and deactivated team members</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              {activeMembers.length} Active
            </span>
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
              {deactivatedMembers.length} Deactivated
            </span>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, or ID code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
              </select>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="dev">Developer</option>
                <option value="design">Designer</option>
                <option value="cyber">Cybersecurity</option>
                <option value="analyst">Analyst</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Members List */}
        <Card>
          <div className="space-y-4">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((member) => (
                <div 
                  key={member.uid || member.idCode || member.email} 
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    member.status === 'active' ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300 opacity-75'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {member.photoURL ? (
                      <img
                        src={member.photoURL}
                        alt={member.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{member.name}</h3>
                        {member.isAdmin && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          member.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {member.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <p className="text-xs text-gray-500">ID: {member.idCode}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(member.role)}`}>
                          {member.role}
                        </span>
                        <span className="text-xs text-gray-500">{member.team}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => startEditMember(member)}
                      variant="ghost"
                      size="sm"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleToggleStatus(member.uid, member.status)}
                      variant="ghost"
                      size="sm"
                      className={member.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                    >
                      {member.status === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={() => handleDeleteMember(member.uid)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
                <p className="text-gray-500">No members match your current search and filters.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Edit Member Modal */}
        {editingMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Member</h2>
              <form onSubmit={handleUpdateMember} className="space-y-4">
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
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team
                  </label>
                  <select
                    value={memberForm.team}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, team: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.name}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    checked={memberForm.isAdmin}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, isAdmin: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isAdmin" className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <span>Admin privileges</span>
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setEditingMember(null);
                      setMemberForm({ name: '', role: 'dev', team: '', isAdmin: false });
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
                    Update Member
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