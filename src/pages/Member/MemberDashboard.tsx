import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCollection } from '../../hooks/useFirestore';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Layout } from '../../components/Layout/Layout';
import { generateIDCard } from '../../utils/pdf';
import { 
  Download, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Bell, 
  Award,
  Users,
  BookOpen,
  Target
} from 'lucide-react';
import { Project, Announcement } from '../../types';

export const MemberDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: projects } = useCollection<Project>('projects');
  const { data: announcements } = useCollection<Announcement>('announcements');

  const userProjects = projects.filter(project => 
    project.assignedTo.includes(user?.uid || '')
  );

  const completedProjects = userProjects.filter(p => p.status === 'completed');
  const inProgressProjects = userProjects.filter(p => p.status === 'in-progress');
  const upcomingProjects = userProjects.filter(p => p.status === 'upcoming');

  const handleDownloadID = () => {
    if (user) {
      generateIDCard(user);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'upcoming': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
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
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.name}
                  className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
                <p className="text-blue-100 text-lg">
                  {user?.role} • {user?.team} • ID: {user?.employeeID}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    {completedProjects.length} Projects Completed
                  </span>
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    {(user?.skills || []).length} Skills
                  </span>
                </div>
              </div>
            </div>
            <Button
              onClick={handleDownloadID}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download ID Card</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

          <Card className="text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{(user?.skills || []).length}</p>
                <p className="text-sm text-gray-600">Skills</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>My Projects</span>
              </h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="space-y-3">
              {userProjects.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{project.title}</h3>
                    <p className="text-sm text-gray-600 truncate">{project.description}</p>
                  </div>
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)}
                    <span className="capitalize">{project.status.replace('-', ' ')}</span>
                  </span>
                </div>
              ))}
              {userProjects.length === 0 && (
                <p className="text-center text-gray-500 py-4">No projects assigned yet.</p>
              )}
            </div>
          </Card>

          {/* Announcements */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Latest Announcements</span>
              </h2>
            </div>
            <div className="space-y-3">
              {announcements.slice(0, 3).map((announcement) => (
                <div key={announcement.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{announcement.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                    </div>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      announcement.priority === 'high' 
                        ? 'bg-red-100 text-red-800'
                        : announcement.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {announcement.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {announcement.createdAt?.toLocaleDateString()}
                  </p>
                </div>
              ))}
              {announcements.length === 0 && (
                <p className="text-center text-gray-500 py-4">No announcements yet.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Skills & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My Skills</h2>
            <div className="flex flex-wrap gap-2">
              {(user?.skills || []).map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {skill}
                </span>
              ))}
              {(!user?.skills || user.skills.length === 0) && (
                <p className="text-gray-500">No skills added yet.</p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Wiki
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                View Team
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Target className="w-4 h-4 mr-2" />
                My Projects
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};