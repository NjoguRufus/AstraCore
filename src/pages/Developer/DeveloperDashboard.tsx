import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { Layout } from '../../components/Layout/Layout';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { 
  Code, 
  Github, 
  ExternalLink, 
  Bug, 
  GitPullRequest, 
  Lightbulb,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Plus,
  Filter,
  Search,
  Calendar,
  BarChart3
} from 'lucide-react';
import { DevTask, BugReport, PullRequest, FeatureRequest } from '../../types';

export const DeveloperDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useModal();
  
  const [devTasks, setDevTasks] = useState<DevTask[]>([]);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateBug, setShowCreateBug] = useState(false);
  const [showCreatePR, setShowCreatePR] = useState(false);
  const [showCreateFeature, setShowCreateFeature] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockTasks: DevTask[] = [
      {
        id: '1',
        title: 'Implement user authentication',
        description: 'Add JWT-based authentication system with role-based access control',
        assignedTo: user?.uid || '',
        projectId: 'proj-1',
        status: 'in-progress',
        priority: 'high',
        deadline: new Date('2024-01-15'),
        githubRepo: 'https://github.com/astraronix/auth-system',
        deploymentLink: 'https://auth.astraronix.com',
        bugReports: [],
        pullRequests: [],
        featureRequests: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        companyId: user?.companyId || '',
        createdBy: 'admin-1'
      },
      {
        id: '2',
        title: 'Fix responsive design issues',
        description: 'Resolve mobile layout problems on dashboard pages',
        assignedTo: user?.uid || '',
        projectId: 'proj-2',
        status: 'pending',
        priority: 'medium',
        deadline: new Date('2024-01-20'),
        bugReports: [],
        pullRequests: [],
        featureRequests: [],
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date(),
        companyId: user?.companyId || '',
        createdBy: 'admin-1'
      }
    ];

    const mockBugs: BugReport[] = [
      {
        id: 'bug-1',
        title: 'Login button not responding on mobile',
        description: 'Users cannot tap the login button on mobile devices',
        severity: 'high',
        status: 'open',
        reportedBy: 'user-1',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date(),
        companyId: user?.companyId || ''
      }
    ];

    const mockPRs: PullRequest[] = [
      {
        id: 'pr-1',
        title: 'Add dark mode support',
        description: 'Implement dark mode toggle and theme switching',
        githubUrl: 'https://github.com/astraronix/frontend/pull/123',
        status: 'open',
        createdBy: user?.uid || '',
        createdAt: new Date('2024-01-08'),
        companyId: user?.companyId || ''
      }
    ];

    const mockFeatures: FeatureRequest[] = [
      {
        id: 'feat-1',
        title: 'Real-time notifications',
        description: 'Add WebSocket-based real-time notifications for task updates',
        priority: 'medium',
        status: 'requested',
        requestedBy: user?.uid || '',
        createdAt: new Date('2024-01-12'),
        companyId: user?.companyId || ''
      }
    ];

    setDevTasks(mockTasks);
    setBugReports(mockBugs);
    setPullRequests(mockPRs);
    setFeatureRequests(mockFeatures);
    setIsLoading(false);
  }, [user]);

  const filteredTasks = devTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'blocked': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const updateTaskStatus = (taskId: string, newStatus: string) => {
    setDevTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus as any, updatedAt: new Date() }
        : task
    ));
    showNotification({
      title: 'Task Updated',
      message: `Task status changed to ${newStatus}`,
      type: 'success'
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading developer dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-8">
            {/* Title Section */}
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                <Code className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Developer Dashboard
                </h1>
                <p className="text-blue-100 text-sm">
                  Build, track progress, and report on development tasks
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">{devTasks.length}</div>
                <div className="text-blue-100 text-xs">Total Tasks</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">{devTasks.filter(t => t.status === 'in-progress').length}</div>
                <div className="text-blue-100 text-xs">In Progress</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">{devTasks.filter(t => t.status === 'done').length}</div>
                <div className="text-blue-100 text-xs">Completed</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">{bugReports.length}</div>
                <div className="text-blue-100 text-xs">Bug Reports</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button
            onClick={() => setShowCreateTask(true)}
            className="flex items-center justify-center space-x-2 p-4 h-auto"
          >
            <Plus className="w-5 h-5" />
            <span>New Task</span>
          </Button>
          <Button
            onClick={() => setShowCreateBug(true)}
            variant="outline"
            className="flex items-center justify-center space-x-2 p-4 h-auto"
          >
            <Bug className="w-5 h-5" />
            <span>Report Bug</span>
          </Button>
          <Button
            onClick={() => setShowCreatePR(true)}
            variant="outline"
            className="flex items-center justify-center space-x-2 p-4 h-auto"
          >
            <GitPullRequest className="w-5 h-5" />
            <span>New PR</span>
          </Button>
          <Button
            onClick={() => setShowCreateFeature(true)}
            variant="outline"
            className="flex items-center justify-center space-x-2 p-4 h-auto"
          >
            <Lightbulb className="w-5 h-5" />
            <span>Feature Request</span>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Development Tasks */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Development Tasks</h3>
              <span className="text-sm text-gray-500">{filteredTasks.length} tasks</span>
            </div>
            <div className="space-y-4">
              {filteredTasks.map(task => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                  
                  {/* Links */}
                  <div className="flex gap-4 mb-3">
                    {task.githubRepo && (
                      <a href={task.githubRepo} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800">
                        <Github className="w-4 h-4" />
                        <span>GitHub</span>
                      </a>
                    )}
                    {task.deploymentLink && (
                      <a href={task.deploymentLink} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-sm text-green-600 hover:text-green-800">
                        <ExternalLink className="w-4 h-4" />
                        <span>Live Demo</span>
                      </a>
                    )}
                  </div>

                  {/* Status Actions */}
                  <div className="flex gap-2">
                    {task.status !== 'done' && (
                      <Button
                        size="sm"
                        onClick={() => updateTaskStatus(task.id, 'done')}
                        className="flex items-center space-x-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Mark Done</span>
                      </Button>
                    )}
                    {task.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTaskStatus(task.id, 'in-progress')}
                        className="flex items-center space-x-1"
                      >
                        <Play className="w-4 h-4" />
                        <span>Start</span>
                      </Button>
                    )}
                    {task.status === 'in-progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTaskStatus(task.id, 'blocked')}
                        className="flex items-center space-x-1"
                      >
                        <Pause className="w-4 h-4" />
                        <span>Block</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Bug Reports & PRs */}
          <div className="space-y-6">
            {/* Bug Reports */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Bug Reports</h3>
                <span className="text-sm text-gray-500">{bugReports.length} bugs</span>
              </div>
              <div className="space-y-3">
                {bugReports.map(bug => (
                  <div key={bug.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{bug.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(bug.severity)}`}>
                        {bug.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{bug.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">Status: {bug.status}</span>
                      <span className="text-xs text-gray-500">{new Date(bug.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Pull Requests */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Pull Requests</h3>
                <span className="text-sm text-gray-500">{pullRequests.length} PRs</span>
              </div>
              <div className="space-y-3">
                {pullRequests.map(pr => (
                  <div key={pr.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{pr.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        pr.status === 'open' ? 'text-green-600 bg-green-100' : 
                        pr.status === 'merged' ? 'text-blue-600 bg-blue-100' : 
                        'text-gray-600 bg-gray-100'
                      }`}>
                        {pr.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{pr.description}</p>
                    <a href={pr.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800">
                      <Github className="w-3 h-3" />
                      <span>View on GitHub</span>
                    </a>
                  </div>
                ))}
              </div>
            </Card>

            {/* Feature Requests */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Feature Requests</h3>
                <span className="text-sm text-gray-500">{featureRequests.length} requests</span>
              </div>
              <div className="space-y-3">
                {featureRequests.map(feature => (
                  <div key={feature.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{feature.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(feature.priority)}`}>
                        {feature.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{feature.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Status: {feature.status}</span>
                      <span className="text-xs text-gray-500">{new Date(feature.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};
