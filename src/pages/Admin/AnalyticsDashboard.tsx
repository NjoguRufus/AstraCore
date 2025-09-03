import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { 
  getAnalytics, 
  generateDailyAnalytics,
  getUsers,
  getProjects,
  getTasks
} from '../../services/firebaseService';
import { Analytics, User, Project, Task } from '../../types';
import { 
  BarChart3,
  Users,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useModal();
  
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<number>(30);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.companyId) {
      loadData();
    }
  }, [user?.companyId, dateRange]);

  const loadData = async () => {
    if (!user?.companyId) return;
    
    try {
      setLoading(true);
      const [analyticsData, usersData, projectsData, tasksData] = await Promise.all([
        getAnalytics(user.companyId, dateRange),
        getUsers(user.companyId),
        getProjects(user.companyId),
        getTasks(user.companyId)
      ]);
      
      setAnalytics(analyticsData);
      setUsers(usersData);
      setProjects(projectsData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
             showNotification({
         title: 'Error',
         message: 'Error loading analytics data',
         type: 'error'
       });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAnalytics = async () => {
    if (!user?.companyId) return;
    
    try {
      setRefreshing(true);
      await generateDailyAnalytics(user.companyId);
      await loadData();
                   showNotification({
               title: 'Success',
               message: 'Analytics refreshed successfully!',
               type: 'success'
             });
    } catch (error) {
      console.error('Error refreshing analytics:', error);
                   showNotification({
               title: 'Error',
               message: 'Error refreshing analytics',
               type: 'error'
             });
    } finally {
      setRefreshing(false);
    }
  };

  const getCurrentMetrics = () => {
    if (analytics.length === 0) return null;
    return analytics[0]; // Most recent analytics
  };

  const getPreviousMetrics = () => {
    if (analytics.length < 2) return null;
    return analytics[1]; // Previous period analytics
  };

  const calculateGrowth = (current: number, previous: number): { value: number; isPositive: boolean } => {
    if (previous === 0) return { value: current > 0 ? 100 : 0, isPositive: current > 0 };
    const growth = ((current - previous) / previous) * 100;
    return { value: Math.abs(growth), isPositive: growth >= 0 };
  };

  const getTopPerformers = () => {
    const currentMetrics = getCurrentMetrics();
    if (!currentMetrics) return [];
    
    return Object.entries(currentMetrics.metrics.memberActivity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([userId, score]) => {
        const user = users.find(u => u.uid === userId);
        return {
          name: user?.name || 'Unknown User',
          score,
          role: user?.role || 'Unknown'
        };
      });
  };

  const getProjectStatusDistribution = () => {
    const statusCounts = {
      upcoming: projects.filter(p => p.status === 'upcoming').length,
      'in-progress': projects.filter(p => p.status === 'in-progress').length,
      completed: projects.filter(p => p.status === 'completed').length
    };
    
    return statusCounts;
  };

  const getTaskStatusDistribution = () => {
    const statusCounts = {
      pending: tasks.filter(t => t.status === 'pending').length,
      'in-progress': tasks.filter(t => t.status === 'in-progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      blocked: tasks.filter(t => t.status === 'blocked').length
    };
    
    return statusCounts;
  };

  const currentMetrics = getCurrentMetrics();
  const previousMetrics = getPreviousMetrics();

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
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Monitor company performance and team productivity
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
            <Button
              onClick={handleRefreshAnalytics}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Refreshing...
                </>
              ) : (
                                     <>
                       <BarChart3 className="h-5 w-5 mr-2" />
                       Refresh Analytics
                     </>
              )}
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                                           <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                           <Users className="h-5 w-5 text-blue-600" />
                         </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">Total Members</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {currentMetrics?.metrics.totalMembers || users.length}
                  </p>
                  {previousMetrics && (
                    <div className="flex items-center text-sm">
                                                   {(() => {
                               const growth = calculateGrowth(
                                 currentMetrics?.metrics.totalMembers || 0,
                                 previousMetrics.metrics.totalMembers
                               );
                               return (
                                 <>
                                   {growth.isPositive ? (
                                     <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                                   ) : (
                                     <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                                   )}
                                   <span className={growth.isPositive ? 'text-green-600' : 'text-red-600'}>
                                     {growth.value.toFixed(1)}%
                                   </span>
                                 </>
                               );
                             })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                                           <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                           <FileText className="h-5 w-5 text-green-600" />
                         </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">Total Projects</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {currentMetrics?.metrics.totalProjects || projects.length}
                  </p>
                  {previousMetrics && (
                    <div className="flex items-center text-sm">
                                                   {(() => {
                               const growth = calculateGrowth(
                                 currentMetrics?.metrics.totalProjects || 0,
                                 previousMetrics.metrics.totalProjects
                               );
                               return (
                                 <>
                                   {growth.isPositive ? (
                                     <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                                   ) : (
                                     <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                                   )}
                                   <span className={growth.isPositive ? 'text-green-600' : 'text-red-600'}>
                                     {growth.value.toFixed(1)}%
                                   </span>
                                 </>
                               );
                             })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                                           <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                           <CheckCircle className="h-5 w-5 text-purple-600" />
                         </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">Completed Tasks</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {currentMetrics?.metrics.completedTasks || tasks.filter(t => t.status === 'completed').length}
                  </p>
                  {previousMetrics && (
                    <div className="flex items-center text-sm">
                                                   {(() => {
                               const growth = calculateGrowth(
                                 currentMetrics?.metrics.completedTasks || 0,
                                 previousMetrics.metrics.completedTasks
                               );
                               return (
                                 <>
                                   {growth.isPositive ? (
                                     <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                                   ) : (
                                     <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                                   )}
                                   <span className={growth.isPositive ? 'text-green-600' : 'text-red-600'}>
                                     {growth.value.toFixed(1)}%
                                   </span>
                                 </>
                               );
                             })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                                           <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                           <Clock className="h-5 w-5 text-orange-600" />
                         </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">Avg. Task Time</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {currentMetrics?.metrics.averageTaskCompletionTime 
                      ? `${currentMetrics.metrics.averageTaskCompletionTime.toFixed(1)}h`
                      : 'N/A'
                    }
                  </p>
                  {previousMetrics && currentMetrics?.metrics.averageTaskCompletionTime && previousMetrics.metrics.averageTaskCompletionTime && (
                    <div className="flex items-center text-sm">
                                                   {(() => {
                               const growth = calculateGrowth(
                                 currentMetrics.metrics.averageTaskCompletionTime,
                                 previousMetrics.metrics.averageTaskCompletionTime
                               );
                               return (
                                 <>
                                   {growth.isPositive ? (
                                     <ArrowUp className="h-4 w-4 text-red-500 mr-1" />
                                   ) : (
                                     <ArrowDown className="h-4 w-4 text-green-500 mr-1" />
                                   )}
                                   <span className={growth.isPositive ? 'text-red-600' : 'text-green-600'}>
                                     {growth.value.toFixed(1)}%
                                   </span>
                                 </>
                               );
                             })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts and Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Project Status Distribution */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Project Status Distribution</h3>
              <div className="space-y-4">
                {(() => {
                  const distribution = getProjectStatusDistribution();
                  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
                  
                  return Object.entries(distribution).map(([status, count]) => {
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    const color = status === 'completed' ? 'bg-green-500' : 
                                 status === 'in-progress' ? 'bg-blue-500' : 'bg-yellow-500';
                    
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${color} mr-3`}></div>
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {status.replace('-', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-900">{count}</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${color}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500 w-12 text-right">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </Card>

          {/* Task Status Distribution */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Task Status Distribution</h3>
              <div className="space-y-4">
                {(() => {
                  const distribution = getTaskStatusDistribution();
                  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
                  
                  return Object.entries(distribution).map(([status, count]) => {
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    const color = status === 'completed' ? 'bg-green-500' : 
                                 status === 'in-progress' ? 'bg-blue-500' : 
                                 status === 'pending' ? 'bg-yellow-500' : 'bg-red-500';
                    
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${color} mr-3`}></div>
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {status.replace('-', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-900">{count}</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${color}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500 w-12 text-right">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </Card>
        </div>

        {/* Top Performers */}
        <Card className="mb-8">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performers</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getTopPerformers().map((performer, index) => (
                    <tr key={performer.name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            #{index + 1}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {performer.name}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                          {performer.role}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {performer.score}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                                                       <div className="flex items-center">
                                 <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                 <span className="text-sm text-green-600">
                                   {performer.score > 10 ? 'Excellent' : 
                                    performer.score > 5 ? 'Good' : 
                                    performer.score > 2 ? 'Average' : 'Needs Improvement'}
                                 </span>
                               </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Recent Activity Timeline */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity Timeline</h3>
            <div className="space-y-4">
              {analytics.slice(0, 7).map((dayAnalytics, index) => (
                <div key={dayAnalytics.date} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                                             <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                           <Calendar className="h-4 w-4 text-blue-600" />
                         </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(dayAnalytics.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {dayAnalytics.metrics.completedTasks} tasks completed, 
                      {dayAnalytics.metrics.completedProjects} projects completed
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {dayAnalytics.metrics.activeMembers} active
                    </p>
                    <p className="text-sm text-gray-500">members</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
