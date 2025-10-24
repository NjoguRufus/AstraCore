import React, { useState } from 'react';
import { useCollection } from '../../hooks/useFirestore';
import { useModal } from '../../contexts/ModalContext';
import { createProject, updateProject, deleteProject, getUsers, resetCompletedProject } from '../../services/firebaseService';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Layout } from '../../components/Layout/Layout';
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Project, User, Team } from '../../types';
import { formatDate, getDaysUntilDeadline, getDeadlineColor, toDate } from '../../utils/dateUtils';

export const ProjectManagement: React.FC = () => {
  const { data: projects } = useCollection<Project>('projects');
  const { data: users } = useCollection<User>('users');
  const { data: teams } = useCollection<Team>('teams');
  const { showConfirmation, showNotification } = useModal();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  // Helper function to get team members
  const getTeamMembers = (teamName: string) => {
    return users?.filter(member => member.team === teamName) || [];
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title || !projectForm.description) return;

    setIsLoading(true);
    try {
      await createProject({
        ...projectForm,
        deadline: new Date(projectForm.deadline)
      });

      setProjectForm({
        title: '',
        description: '',
        assignedTo: [],
        assignedTeam: '',
        assignedType: '',
        status: 'upcoming',
        deadline: ''
      });
      setShowCreateModal(false);
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

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    setIsLoading(true);
    try {
      await updateProject(editingProject.id, {
        ...projectForm,
        deadline: new Date(projectForm.deadline)
      });

      setEditingProject(null);
      setProjectForm({
        title: '',
        description: '',
        assignedTo: [],
        assignedTeam: '',
        assignedType: '',
        status: 'upcoming',
        deadline: ''
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error updating project:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to update project. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const confirmed = await showConfirmation({
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project?',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    try {
      await deleteProject(projectId);
    } catch (error) {
      console.error('Error deleting project:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to delete project. Please try again.',
        type: 'error'
      });
    }
  };

  const handleResetProject = async (projectId: string) => {
    const confirmed = await showConfirmation({
      title: 'Reset Project',
      message: 'Are you sure you want to reset this completed project? The member will be able to restart it.',
      type: 'warning',
      confirmText: 'Reset',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

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

  const startEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title,
      description: project.description,
      assignedTo: project.assignedTo,
      assignedTeam: project.assignedTeam || '',
      assignedType: project.assignedTeam ? 'team' : 'individual',
      status: project.status,
      deadline: toDate(project.deadline)?.toISOString().split('T')[0] || ''
    });
    setShowCreateModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'upcoming': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-8">
            {/* Title Section */}
            <div>
              <h1 className="text-2xl font-bold text-white">
                Project Management
              </h1>
              <p className="text-orange-100 text-sm">
                Create and manage team projects
              </p>
            </div>
            
            {/* Action Button */}
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-200 flex items-center space-x-2 px-4 py-2 rounded-xl font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                <p className="text-sm text-gray-600">Total Projects</p>
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
                  {projects.filter(p => p.status === 'completed').length}
                </p>
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
                <p className="text-2xl font-bold text-blue-600">
                  {projects.filter(p => p.status === 'in-progress').length}
                </p>
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
                <p className="text-2xl font-bold text-orange-600">
                  {projects.filter(p => p.status === 'upcoming').length}
                </p>
                <p className="text-sm text-gray-600">Upcoming</p>
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
                  placeholder="Search projects..."
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
                <option value="upcoming">Upcoming</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900 text-lg">{project.title}</h3>
                  <div className="flex items-center space-x-1">
                    <Button
                      onClick={() => startEditProject(project)}
                      variant="ghost"
                      size="sm"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteProject(project.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm line-clamp-3">{project.description}</p>

                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)}
                    <span className="capitalize">{project.status.replace('-', ' ')}</span>
                  </span>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{project.assignedTo.length}</span>
                  </div>
                </div>

                {/* Completion Timestamp */}
                {project.status === 'completed' && project.completedAt && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                    <div className="text-sm text-green-700">
                      <strong>Completed:</strong> {formatDate(project.completedAt)}
                    </div>
                    {project.completedBy && (
                      <div className="text-xs text-green-600 mt-1">
                        By: {users?.find(u => u.uid === project.completedBy)?.name || 'Unknown'}
                      </div>
                    )}
                  </div>
                )}

                {project.team && (
                  <div className="text-sm text-gray-500">
                    <strong>Team:</strong> {project.team}
                  </div>
                )}

                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span className={getDeadlineColor(project.deadline)}>
                    Due: {formatDate(project.deadline)} ({getDaysUntilDeadline(project.deadline)})
                  </span>
                </div>

                {/* Reset Button for Completed Projects */}
                {project.status === 'completed' && (
                  <div className="pt-3 border-t border-gray-200">
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
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <Card className="text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first project.</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </Card>
        )}

        {/* Create/Edit Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h2>
              <form onSubmit={editingProject ? handleUpdateProject : handleCreateProject} className="space-y-4">
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
                  <p className="text-xs text-blue-600 mb-2">
                    💡 <strong>Tip:</strong> Use "Team" assignment to assign to all team members, or "Individual" to select specific people.
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
                        {users
                          ?.filter(member => !projectForm.assignedTeam || member.team === projectForm.assignedTeam)
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
                        {users?.filter(member => !projectForm.assignedTeam || member.team === projectForm.assignedTeam).length === 0 && (
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

                {/* Assignment Summary */}
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
                            const member = users?.find(m => m.uid === memberId);
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
                    Status
                  </label>
                  <select
                    value={projectForm.status}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
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
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingProject(null);
                      setProjectForm({
                        title: '',
                        description: '',
                        assignedTo: [],
                        assignedTeam: '',
                        assignedType: '',
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
                    disabled={!projectForm.assignedType || 
                      (projectForm.assignedType === 'team' && !projectForm.assignedTeam) ||
                      (projectForm.assignedType === 'individual' && projectForm.assignedTo.length === 0) ||
                      (projectForm.assignedType === 'hybrid' && (!projectForm.assignedTeam || projectForm.assignedTo.length === 0))}
                    className="flex-1"
                  >
                    {editingProject ? 'Update' : 'Create'} Project
                    {projectForm.assignedType && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {projectForm.assignedTo.length} assignment{projectForm.assignedTo.length !== 1 ? 's' : ''}
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