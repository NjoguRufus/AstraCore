import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { 
  getProjects, 
  createProject, 
  updateProject, 
  deleteProject, 
  getUsers,
  createAuditLog,
  createNotification
} from '../../services/firebaseService';
import { Project, User, Task } from '../../types';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  CalendarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ProjectsProps {}

export const Projects: React.FC<ProjectsProps> = () => {
  const { user } = useAuth();
  const { showNotification, showConfirmation } = useModal();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: [] as string[],
    assignedTeam: '',
    assignedType: 'individual' as 'individual' | 'team' | 'hybrid',
    deadline: '',
    status: 'upcoming' as 'upcoming' | 'in-progress' | 'completed'
  });

  useEffect(() => {
    if (user?.companyId) {
      loadData();
    }
  }, [user?.companyId]);

  const loadData = async () => {
    if (!user?.companyId) return;
    
    try {
      setLoading(true);
      const [projectsData, usersData] = await Promise.all([
        getProjects(user.companyId),
        getUsers(user.companyId)
      ]);
      
      setProjects(projectsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
             showNotification({
         title: 'Error',
         message: 'Error loading projects',
         type: 'error'
       });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assignedTo: [],
      assignedTeam: '',
      assignedType: 'individual',
      deadline: '',
      status: 'upcoming'
    });
    setEditingProject(null);
  };

  const handleCreateProject = async () => {
    if (!user?.companyId) return;
    
    try {
      if (!formData.title || !formData.description || !formData.deadline) {
        showNotification({
          title: 'Validation Error',
          message: 'Please fill in all required fields',
          type: 'error'
        });
        return;
      }

      const projectData = {
        ...formData,
        companyId: user.companyId,
        createdBy: user.uid,
        deadline: new Date(formData.deadline),
        assignedTo: formData.assignedType === 'team' ? [] : formData.assignedTo,
        assignedTeam: formData.assignedType === 'individual' ? undefined : formData.assignedTeam
      };

      const projectId = await createProject(projectData);
      
      // Create audit log
      await createAuditLog({
        userId: user.uid,
        userName: user.name,
        action: 'Project created',
        resourceType: 'project',
        resourceId: projectId,
        details: { projectTitle: formData.title, assignedType: formData.assignedType },
        companyId: user.companyId
      });

      // Send notifications to assigned users
      if (formData.assignedType === 'individual' && formData.assignedTo.length > 0) {
        for (const userId of formData.assignedTo) {
          await createNotification({
            userId,
            title: 'New Project Assigned',
            message: `You have been assigned to project: ${formData.title}`,
            type: 'info',
            category: 'project',
            companyId: user.companyId,
            actionUrl: `/admin/projects/${projectId}`
          });
        }
      }

      showNotification({
        title: 'Success',
        message: 'Project created successfully!',
        type: 'success'
      });
      setShowCreateModal(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error creating project:', error);
      showNotification({
        title: 'Error',
        message: 'Error creating project',
        type: 'error'
      });
    }
  };

  const handleUpdateProject = async () => {
    if (!user?.companyId || !editingProject) return;
    
    try {
      if (!formData.title || !formData.description || !formData.deadline) {
        showNotification({
          title: 'Validation Error',
          message: 'Please fill in all required fields',
          type: 'error'
        });
        return;
      }

      const updateData = {
        ...formData,
        deadline: new Date(formData.deadline),
        assignedTo: formData.assignedType === 'team' ? [] : formData.assignedTo,
        assignedTeam: formData.assignedType === 'individual' ? undefined : formData.assignedTeam
      };

      await updateProject(editingProject.id, updateData);
      
      // Create audit log
      await createAuditLog({
        userId: user.uid,
        userName: user.name,
        action: 'Project updated',
        resourceType: 'project',
        resourceId: editingProject.id,
        details: { projectTitle: formData.title, updatedFields: Object.keys(updateData) },
        companyId: user.companyId
      });

      showNotification({
        title: 'Success',
        message: 'Project updated successfully!',
        type: 'success'
      });
      setEditingProject(null);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error updating project:', error);
      showNotification({
        title: 'Error',
        message: 'Error updating project',
        type: 'error'
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!user?.companyId) return;
    
    showConfirmation({
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteProject(projectId);
          
          // Create audit log
          await createAuditLog({
            userId: user.uid,
            userName: user.name,
            action: 'Project deleted',
            resourceType: 'project',
            resourceId: projectId,
            details: { projectId },
            companyId: user.companyId
          });

          showNotification({
            title: 'Success',
            message: 'Project deleted successfully!',
            type: 'success'
          });
          await loadData();
        } catch (error) {
          console.error('Error deleting project:', error);
          showNotification({
            title: 'Error',
            message: 'Error deleting project',
            type: 'error'
          });
        }
      }
    });
  };

  const handleStatusChange = async (projectId: string, newStatus: 'upcoming' | 'in-progress' | 'completed') => {
    if (!user?.companyId) return;
    
    try {
      await updateProject(projectId, { 
        status: newStatus,
        ...(newStatus === 'completed' && { completedBy: user.uid })
      });
      
      // Create audit log
      await createAuditLog({
        userId: user.uid,
        userName: user.name,
        action: `Project status changed to ${newStatus}`,
        resourceType: 'project',
        resourceId: projectId,
        details: { newStatus },
        companyId: user.companyId
      });

      showNotification({
        title: 'Success',
        message: `Project status updated to ${newStatus}`,
        type: 'success'
      });
      await loadData();
    } catch (error) {
      console.error('Error updating project status:', error);
      showNotification({
        title: 'Error',
        message: 'Error updating project status',
        type: 'error'
      });
    }
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      assignedTo: project.assignedTo || [],
      assignedTeam: project.assignedTeam || '',
      assignedType: project.assignedType || 'individual',
      deadline: project.deadline.toISOString().split('T')[0],
      status: project.status
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'upcoming': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'in-progress': return <ClockIcon className="h-4 w-4" />;
      case 'upcoming': return <ExclamationTriangleIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getAssignedUsers = (project: Project) => {
    if (project.assignedType === 'team') {
      return project.assignedTeam ? [project.assignedTeam] : ['No team assigned'];
    }
    
    if (project.assignedType === 'individual') {
      return project.assignedTo?.map(uid => {
        const user = users.find(u => u.uid === uid);
        return user ? user.name : 'Unknown User';
      }) || ['No users assigned'];
    }
    
    return ['No assignment type'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-2">
              Manage and track all company projects
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Project
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Project Header */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {project.title}
                  </h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProject(project)}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(project)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Project Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {project.description}
                </p>

                {/* Project Status */}
                <div className="flex items-center mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)}
                    <span className="ml-1 capitalize">{project.status}</span>
                  </span>
                </div>

                {/* Project Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Due: {project.deadline.toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <UserGroupIcon className="h-4 w-4 mr-2" />
                    {getAssignedUsers(project).join(', ')}
                  </div>
                </div>

                {/* Status Actions */}
                <div className="flex space-x-2">
                  {project.status !== 'upcoming' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(project.id, 'upcoming')}
                    >
                      Mark Upcoming
                    </Button>
                  )}
                  {project.status !== 'in-progress' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(project.id, 'in-progress')}
                    >
                      Start Progress
                    </Button>
                  )}
                  {project.status !== 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(project.id, 'completed')}
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first project.</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Project
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Project Modal */}
      {(showCreateModal || editingProject) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter project title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter project description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignment Type
                  </label>
                  <select
                    value={formData.assignedType}
                    onChange={(e) => handleInputChange('assignedType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="individual">Individual Members</option>
                    <option value="team">Entire Team</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                
                {formData.assignedType === 'individual' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign To Members
                    </label>
                    <select
                      multiple
                      value={formData.assignedTo}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                        handleInputChange('assignedTo', selectedOptions);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {users.map((user) => (
                        <option key={user.uid} value={user.uid}>
                          {user.name} ({user.role})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Hold Ctrl/Cmd to select multiple members
                    </p>
                  </div>
                )}
                
                {formData.assignedType === 'team' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign To Team
                    </label>
                    <select
                      value={formData.assignedTeam}
                      onChange={(e) => handleInputChange('assignedTeam', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a team</option>
                      <option value="development">Development</option>
                      <option value="design">Design</option>
                      <option value="marketing">Marketing</option>
                      <option value="sales">Sales</option>
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deadline *
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingProject ? handleUpdateProject : handleCreateProject}
                >
                  {editingProject ? 'Update Project' : 'Create Project'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Project Details
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProject(null)}
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedProject.title}</h4>
                  <p className="text-gray-600 text-sm mt-1">{selectedProject.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProject.status)}`}>
                      {getStatusIcon(selectedProject.status)}
                      <span className="ml-1 capitalize">{selectedProject.status}</span>
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Deadline:</span>
                    <span className="ml-2 text-gray-600">
                      {selectedProject.deadline.toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <span className="ml-2 text-gray-600">
                      {selectedProject.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Type:</span>
                    <span className="ml-2 text-gray-600 capitalize">
                      {selectedProject.assignedType}
                    </span>
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Assigned To:</span>
                  <div className="mt-1 text-sm text-gray-600">
                    {getAssignedUsers(selectedProject).map((user, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        {user}
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedProject.completedAt && (
                  <div>
                    <span className="font-medium text-gray-700">Completed:</span>
                    <span className="ml-2 text-gray-600">
                      {selectedProject.completedAt.toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={() => setSelectedProject(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
