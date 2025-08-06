import React, { useState } from 'react';
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/firebase';
import { useCollection } from '../../hooks/useFirestore';
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
  Crown
} from 'lucide-react';
import { User, PendingMember } from '../../types';

export const MemberManagement: React.FC = () => {
  const { data: activeMembers } = useCollection<User>('active_members');
  const { data: pendingMembers } = useCollection<PendingMember>('pending_members');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    role: 'admin' as 'admin' | 'manager' | 'editor' | 'viewer',
  });

  const filteredActiveMembers = activeMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.employeeID.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredPendingMembers = pendingMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.employeeID.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const startEditMember = (member: User) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      role: member.role,
      team: member.team,
      isAdmin: member.isAdmin || false
    });
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'active_members', editingMember.uid), {
        name: memberForm.name,
        role: memberForm.role,
        team: memberForm.team,
        isAdmin: memberForm.isAdmin
      });

      setEditingMember(null);
      setMemberForm({ name: '', role: 'dev', team: '', isAdmin: false });
      alert('Member updated successfully!');
    } catch (error) {
      console.error('Error updating member:', error);
      alert('Failed to update member. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteActiveMember = async (uid: string) => {
    if (!confirm('Are you sure you want to delete this active member? This action cannot be undone.')) return;

    try {
      await deleteDoc(doc(db, 'active_members', uid));
      alert('Member deleted successfully!');
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Failed to delete member. Please try again.');
    }
  };

  const handleDeletePendingMember = async (employeeID: string) => {
    if (!confirm('Are you sure you want to delete this pending member?')) return;

    try {
      const memberDoc = pendingMembers.find(m => m.employeeID === employeeID);
      if (memberDoc) {
        await deleteDoc(doc(db, 'pending_members', (memberDoc as any).id));
        alert('Pending member deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting pending member:', error);
      alert('Failed to delete pending member. Please try again.');
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

  // Create Member Handler
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const uid = uuidv4();
      await setDoc(doc(db, 'active_members', uid), {
        name: memberForm.name,
        email: memberForm.email,
        role: memberForm.role,
        createdAt: serverTimestamp(),
      });
      setShowCreateModal(false);
      setMemberForm({ name: '', email: '', role: 'admin' });
      alert('Member created successfully!');
    } catch (error) {
      console.error('Error creating member:', error);
      alert('Failed to create member. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Member Management</h1>
            <p className="text-gray-600 mt-1">Manage active and pending team members</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              {activeMembers.length} Active
            </span>
            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
              {pendingMembers.length} Pending
            </span>
            <Button onClick={() => setShowCreateModal(true)} className="ml-4">+ Create Member</Button>
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
                  placeholder="Search by name, email, or employee ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Members */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                <span>Active Members</span>
              </h2>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                {filteredActiveMembers.length}
              </span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredActiveMembers.map((member) => (
                <div key={member.uid} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
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
                      </div>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <p className="text-xs text-gray-500">ID: {member.employeeID}</p>
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
                      onClick={() => handleDeleteActiveMember(member.uid)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filteredActiveMembers.length === 0 && (
                <p className="text-center text-gray-500 py-8">No active members found</p>
              )}
            </div>
          </Card>

          {/* Pending Members */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <UserX className="w-5 h-5 text-orange-600" />
                <span>Pending Members</span>
              </h2>
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm">
                {filteredPendingMembers.length}
              </span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredPendingMembers.map((member) => (
                <div key={member.employeeID} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-600">ID: {member.employeeID}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                      <span className="text-xs text-gray-500">{member.team}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Created: {member.createdAt?.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleDeletePendingMember(member.employeeID)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filteredPendingMembers.length === 0 && (
                <p className="text-center text-gray-500 py-8">No pending members found</p>
              )}
            </div>
          </Card>
        </div>

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
                  <input
                    type="text"
                    value={memberForm.team}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, team: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
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
      {/* Create Member Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Member</h2>
            <form onSubmit={handleCreateMember} className="space-y-4">
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
                  Email
                </label>
                <input
                  type="email"
                  value={memberForm.email}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, email: e.target.value }))}
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
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setMemberForm({ name: '', email: '', role: 'admin' });
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
                  Create Member
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