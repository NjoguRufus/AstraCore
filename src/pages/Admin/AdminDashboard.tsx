import React, { useState } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useCollection } from '../../hooks/useFirestore';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Layout } from '../../components/Layout/Layout';
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
  RefreshCw
} from 'lucide-react';
import { PendingMember, User, Project, Announcement } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: pendingMembers } = useCollection<PendingMember>('pending_members');
  const { data: activeMembers } = useCollection<User>('active_members');
  const { data: projects } = useCollection<Project>('projects');
  const { data: announcements } = useCollection<Announcement>('announcements');

  const [showCreateMember, setShowCreateMember] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [editingMember, setEditingMember] = useState<PendingMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [memberForm, setMemberForm] = useState({
    name: '',
    role: 'dev' as 'dev' | 'design' | 'cyber' | 'analyst',
    team: '',
    employeeID: ''
  });

  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    assignedTo: [] as string[],
    team: '',
    status: 'upcoming' as 'upcoming' | 'in-progress' | 'completed',
    deadline: ''
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  const generateRandomID = () => {
    const prefix = 'AST';
    const randomNum = Math.floor(Math.random() * 90000) + 10000; // 5-digit number
    return `${prefix}${randomNum}`;
  };

  const handleGenerateID = () => {
    setMemberForm(prev => ({
      ...prev,
      employeeID: generateRandomID()
    }));
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name || !memberForm.employeeID || !memberForm.team) return;

    setIsLoading(true);
    try {
      // Create user document in 'users' collection with status 'pending'
      await setDoc(doc(db, 'users', memberForm.employeeID), {
        name: memberForm.name,
        role: memberForm.role,
        team: memberForm.team,
        employeeID: memberForm.employeeID,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Add to 'pending_members' collection
      await addDoc(collection(db, 'pending_members'), {
        ...memberForm,
        status: 'pending',
        createdAt: new Date()
      });

      setMemberForm({ name: '', role: 'dev', team: '', employeeID: '' });
      setShowCreateMember(false);
      alert('Team member created successfully!');
    } catch (error) {
      console.error('Error creating member:', error);
      alert('Failed to create member. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !memberForm.name || !memberForm.team) return;

    setIsLoading(true);
    try {
      const memberDoc = pendingMembers.find(m => m.employeeID === editingMember.employeeID);
      if (memberDoc) {
        await updateDoc(doc(db, 'pending_members', (memberDoc as any).id), {
          name: memberForm.name,
          role: memberForm.role,
          team: memberForm.team
        });
      }

      setEditingMember(null);
      setMemberForm({ name: '', role: 'dev', team: '', employeeID: '' });
      alert('Member updated successfully!');
    } catch (error) {
      console.error('Error updating member:', error);
      alert('Failed to update member. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMember = async (employeeID: string) => {
    if (!confirm('Are you sure you want to delete this member?')) return;

    try {
      const memberDoc = pendingMembers.find(m => m.employeeID === employeeID);
      if (memberDoc) {
        await deleteDoc(doc(db, 'pending_members', (memberDoc as any).id));
        alert('Member deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Failed to delete member. Please try again.');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title || !projectForm.description) return;

    setIsLoading(true);
    try {
      await addDoc(collection(db, 'projects'), {
        ...projectForm,
        deadline: new Date(projectForm.deadline),
        createdAt: new Date()
      });

      setProjectForm({
        title: '',
        description: '',
        assignedTo: [],
        team: '',
        status: 'upcoming',
        deadline: ''
      });
      setShowCreateProject(false);
      alert('Project created successfully!');
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) return;

    setIsLoading(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        ...announcementForm,
        createdAt: new Date()
      });

      setAnnouncementForm({ title: '', content: '', priority: 'medium' });
      setShowCreateAnnouncement(false);
      alert('Announcement created successfully!');
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Failed to create announcement. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditMember = (member: PendingMember) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      role: member.role,
      team: member.team,
      employeeID: member.employeeID
    });
    setShowCreateMember(true);
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-blue-100 text-lg mt-2">
                Manage team members, projects, and system operations
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-2xl font-bold">{activeMembers.length}</p>
                <p className="text-blue-100 text-sm">Active Members</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{pendingMembers.length}</p>
                <p className="text-blue-100 text-sm">Pending</p>
              </div>
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Members */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Pending Members</span>
              </h2>
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm">
                {pendingMembers.length}
              </span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pendingMembers.map((member) => (
                <div key={member.employeeID} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-600">ID: {member.employeeID}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                      <span className="text-xs text-gray-500">{member.team}</span>
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
                      onClick={() => handleDeleteMember(member.employeeID)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {pendingMembers.length === 0 && (
                <p className="text-center text-gray-500 py-8">No pending members</p>
              )}
            </div>
          </Card>

          {/* Active Members */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Active Members</span>
              </h2>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                {activeMembers.length}
              </span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activeMembers.map((member) => (
                <div key={member.uid} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {member.photoURL ? (
                    <img
                      src={member.photoURL}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-600">ID: {member.employeeID}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                      <span className="text-xs text-gray-500">{member.team}</span>
                    </div>
                  </div>
                </div>
              ))}
              {activeMembers.length === 0 && (
                <p className="text-center text-gray-500 py-8">No active members</p>
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
            {projects.slice(0, 6).map((project) => (
              <div key={project.id} className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">{project.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
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
              </div>
            ))}
          </div>
        </Card>

        {/* Create Member Modal */}
        {showCreateMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingMember ? 'Edit Member' : 'Create New Member'}
              </h2>
              <form onSubmit={editingMember ? handleUpdateMember : handleCreateMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={memberForm.employeeID}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, employeeID: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="AST12345"
                      required
                      disabled={!!editingMember}
                    />
                    {!editingMember && (
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
                    )}
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
                  <input
                    type="text"
                    value={memberForm.team}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, team: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Frontend Team, Security Team"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowCreateMember(false);
                      setEditingMember(null);
                      setMemberForm({ name: '', role: 'dev', team: '', employeeID: '' });
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
                    {editingMember ? 'Update' : 'Create'} Member
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
                    Assign Members
                  </label>
                  <select
                    multiple
                    value={projectForm.assignedTo}
                    onChange={e => {
                      const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
                      setProjectForm(prev => ({ ...prev, assignedTo: options }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                  >
                    {activeMembers.map(member => (
                      <option key={member.uid} value={member.uid}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team
                  </label>
                  <input
                    type="text"
                    value={projectForm.team}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, team: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Frontend Team"
                  />
                </div>

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
                      setProjectForm({
                        title: '',
                        description: '',
                        assignedTo: [],
                        team: '',
                        status: 'upcoming',
                        deadline: ''
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

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowCreateAnnouncement(false);
                      setAnnouncementForm({ title: '', content: '', priority: 'medium' });
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
                    Create Announcement
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