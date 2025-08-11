import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection } from '../../hooks/useFirestore';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Layout } from '../../components/Layout/Layout';
import { 
  Target, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Users,
  BookOpen,
  Bell,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { Project, Announcement } from '../../types';
import { Link } from 'react-router-dom';

export const MemberDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: allProjects } = useCollection<Project>('projects');
  const { data: announcements } = useCollection<Announcement>('announcements');

  // Filter projects assigned to current user
  const userProjects = allProjects?.filter(project => 
    project.assignedTo.includes(user?.uid || '') ||
    (project.team && project.team === user?.team)
  ) || [];

  const completedProjects = userProjects.filter(p => p.status === 'completed');
  const inProgressProjects = userProjects.filter(p => p.status === 'in-progress');
  const upcomingProjects = userProjects.filter(p => p.status === 'upcoming');

  // Get recent announcements
  const recentAnnouncements = announcements?.slice(0, 3) || [];

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
          <p className="text-blue-100 mt-2">
            {user?.role ? `Role: ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}` : 'Member'}
            {user?.team && ` • Team: ${user.team}`}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{userProjects.length}</p>
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
                <p className="text-2xl font-bold text-green-600">{completedProjects.length}</p>
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
                <p className="text-2xl font-bold text-blue-600">{inProgressProjects.length}</p>
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
                <p className="text-2xl font-bold text-orange-600">{upcomingProjects.length}</p>
                <p className="text-sm text-gray-600">Upcoming</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
              <Link to="/member/projects">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {userProjects.slice(0, 3).map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{project.title}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(project.status)}`}>
                        {getStatusIcon(project.status)}
                        <span className="capitalize">{project.status.replace('-', ' ')}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {project.deadline && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{project.deadline.toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {userProjects.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Target className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No projects assigned yet</p>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Announcements */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Announcements</h3>
              <Link to="/shared/announcements">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentAnnouncements.map((announcement) => (
                <div key={announcement.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{announcement.content}</p>
                    </div>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                    <Bell className="w-3 h-3" />
                    <span>{announcement.createdAt?.toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {recentAnnouncements.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No announcements yet</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {userProjects.length > 0 ? Math.round((completedProjects.length / userProjects.length) * 100) : 0}%
              </p>
              <p className="text-sm text-gray-600">Completion Rate</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{completedProjects.length}</p>
              <p className="text-sm text-gray-600">Projects Completed</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{user?.team || 'N/A'}</p>
              <p className="text-sm text-gray-600">Current Team</p>
            </div>
          </div>
        </Card>

        {/* Quick Navigation */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/member/projects">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Target className="w-6 h-6" />
                <span className="text-sm">Projects</span>
              </Button>
            </Link>
            <Link to="/member/profile">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Users className="w-6 h-6" />
                <span className="text-sm">Profile</span>
              </Button>
            </Link>
            <Link to="/shared/wiki">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <BookOpen className="w-6 h-6" />
                <span className="text-sm">Wiki</span>
              </Button>
            </Link>
            <Link to="/shared/skills">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <TrendingUp className="w-6 h-6" />
                <span className="text-sm">Skills</span>
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </Layout>
  );
};
