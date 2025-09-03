import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { 
  getTasks, 
  createTask, 
  updateTask, 
  deleteTask, 
  getUsers,
  getProjects,
  createAuditLog,
  createNotification
} from '../../services/firebaseService';
import { Task, User, Project } from '../../types';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  CalendarIcon,
  UserIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  TagIcon,
  ChartBarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export const Tasks: React.FC = () => {
  const { user } = useAuth();
  const { showNotification, showConfirmation } = useModal();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assignedTo: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'blocked',
    dueDate: '',
    estimatedHours: '',
    tags: [] as string[]
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
      const [tasksData, usersData, projectsData] = await Promise.all([
        getTasks(user.companyId),
        getUsers(user.companyId),
        getProjects(user.companyId)
      ]);
      
      setTasks(tasksData);
      setUsers(usersData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading data:', error);
             showNotification({
         title: 'Error',
         message: 'Error loading tasks',
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
      projectId: '',
      assignedTo: '',
      priority: 'medium',
      status: 'pending',
      dueDate: '',
      estimatedHours: '',
      tags: []
    });
    setEditingTask(null);
  };

  const handleCreateTask = async () => {
    if (!user?.companyId) return;
    
    try {
      if (!formData.title || !formData.description || !formData.projectId || !formData.assignedTo) {
        showNotification({
          title: 'Validation Error',
          message: 'Please fill in all required fields',
          type: 'error'
        });
        return;
      }

      const taskData = {
        ...formData,
        companyId: user.companyId,
        createdBy: user.uid,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        tags: formData.tags.filter(tag => tag.trim() !== '')
      };

      const taskId = await createTask(taskData);
      
      // Create audit log
      await createAuditLog({
        userId: user.uid,
        userName: user.name,
        action: 'Task created',
        resourceType: 'task',
        resourceId: taskId,
        details: { taskTitle: formData.title, assignedTo: formData.assignedTo, priority: formData.priority },
        companyId: user.companyId
      });

      // Send notification to assigned user
      await createNotification({
        userId: formData.assignedTo,
        title: 'New Task Assigned',
        message: `You have been assigned a new task: ${formData.title}`,
        type: 'info',
        category: 'task',
        companyId: user.companyId,
        actionUrl: `/admin/tasks/${taskId}`
      });

      showNotification({
        title: 'Success',
        message: 'Task created successfully!',
        type: 'success'
      });
      setShowCreateModal(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error creating task:', error);
      showNotification({
        title: 'Error',
        message: 'Error creating task',
        type: 'error'
      });
    }
  };

  const handleUpdateTask = async () => {
    if (!user?.companyId || !editingTask) return;
    
    try {
      if (!formData.title || !formData.description || !formData.projectId || !formData.assignedTo) {
        showNotification({
          title: 'Validation Error',
          message: 'Please fill in all required fields',
          type: 'error'
        });
        return;
      }

      const updateData = {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        tags: formData.tags.filter(tag => tag.trim() !== '')
      };

      await updateTask(editingTask.id, updateData);
      
      // Create audit log
      await createAuditLog({
        userId: user.uid,
        userName: user.name,
        action: 'Task updated',
        resourceType: 'task',
        resourceId: editingTask.id,
        details: { taskTitle: formData.title, updatedFields: Object.keys(updateData) },
        companyId: user.companyId
      });

      showNotification({
        title: 'Success',
        message: 'Task updated successfully!',
        type: 'success'
      });
      setEditingTask(null);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error updating task:', error);
      showNotification({
        title: 'Error',
        message: 'Error updating task',
        type: 'error'
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user?.companyId) return;
    
    showConfirmation({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteTask(taskId);
          
          // Create audit log
          await createAuditLog({
            userId: user.uid,
            userName: user.name,
            action: 'Task deleted',
            resourceType: 'task',
            resourceId: taskId,
            details: { taskId },
            companyId: user.companyId
          });

          showNotification({
            title: 'Success',
            message: 'Task deleted successfully!',
            type: 'success'
          });
          await loadData();
        } catch (error) {
          console.error('Error deleting task:', error);
          showNotification({
            title: 'Error',
            message: 'Error deleting task',
            type: 'error'
          });
        }
      }
    });
  };

  const handleStatusChange = async (taskId: string, newStatus: 'pending' | 'in-progress' | 'completed' | 'blocked') => {
    if (!user?.companyId) return;
    
    try {
      await updateTask(taskId, { 
        status: newStatus,
        ...(newStatus === 'completed' && { completedBy: user.uid })
      });
      
      // Create audit log
      await createAuditLog({
        userId: user.uid,
        userName: user.name,
        action: `Task status changed to ${newStatus}`,
        resourceType: 'task',
        resourceId: taskId,
        details: { newStatus },
        companyId: user.companyId
      });

      showNotification({
        title: 'Success',
        message: `Task status updated to ${newStatus}`,
        type: 'success'
      });
      await loadData();
    } catch (error) {
      console.error('Error updating task status:', error);
      showNotification({
        title: 'Error',
        message: 'Error updating task status',
        type: 'error'
      });
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      projectId: task.projectId,
      assignedTo: task.assignedTo,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
      estimatedHours: task.estimatedHours?.toString() || '',
      tags: task.tags || []
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'in-progress': return <ClockIcon className="h-4 w-4" />;
      case 'pending': return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'blocked': return <XMarkIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssignedUserName = (userId: string) => {
    const user = users.find(u => u.uid === userId);
    return user ? user.name : 'Unknown User';
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.title : 'Unknown Project';
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
            <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-600 mt-2">
              Manage and track all company tasks
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Task
          </Button>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Task Header */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {task.title}
                  </h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(task)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Task Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {task.description}
                </p>

                {/* Task Status and Priority */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {getStatusIcon(task.status)}
                    <span className="ml-1 capitalize">{task.status}</span>
                  </span>
                  
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    <span className="capitalize">{task.priority}</span>
                  </span>
                </div>

                {/* Task Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <ChartBarIcon className="h-4 w-4 mr-2" />
                    Project: {getProjectName(task.projectId)}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <UserIcon className="h-4 w-4 mr-2" />
                    Assigned: {getAssignedUserName(task.assignedTo)}
                  </div>
                  {task.dueDate && (
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Due: {task.dueDate.toLocaleDateString()}
                    </div>
                  )}
                  {task.estimatedHours && (
                    <div className="flex items-center text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      Est: {task.estimatedHours}h
                    </div>
                  )}
                </div>

                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {task.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        <TagIcon className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Status Actions */}
                <div className="flex space-x-2">
                  {task.status !== 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(task.id, 'pending')}
                    >
                      Mark Pending
                    </Button>
                  )}
                  {task.status !== 'in-progress' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(task.id, 'in-progress')}
                    >
                      Start Progress
                    </Button>
                  )}
                  {task.status !== 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(task.id, 'completed')}
                    >
                      Mark Complete
                    </Button>
                  )}
                  {task.status !== 'blocked' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(task.id, 'blocked')}
                    >
                      Mark Blocked
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first task.</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Task
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Task Modal */}
      {(showCreateModal || editingTask) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter task title"
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
                    placeholder="Enter task description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project *
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => handleInputChange('projectId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign To *
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a member</option>
                    {users.map((user) => (
                      <option key={user.uid} value={user.uid}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
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
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.estimatedHours}
                    onChange={(e) => handleInputChange('estimatedHours', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 4.5"
                  />
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
                  onClick={editingTask ? handleUpdateTask : handleCreateTask}
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
