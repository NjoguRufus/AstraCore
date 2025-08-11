import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { useCollection } from '../../hooks/useFirestore';
import { updateUser } from '../../services/firebaseService';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Layout } from '../../components/Layout/Layout';
import { 
  Award, 
  Plus, 
  Search, 
  Filter, 
  Users,
  Code,
  Palette,
  Shield,
  BarChart3,
  Star
} from 'lucide-react';
import { User } from '../../types';

export const Skills: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useModal();
  const { data: users } = useCollection<User>('users');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [skillInput, setSkillInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);

  // Get all unique skills across all users
  const allSkills = Array.from(new Set(users.flatMap(u => u.skills || [])));
  
  // Filter users based on search and role
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (u.skills || []).some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Get skill statistics
  const skillStats = allSkills.map(skill => ({
    skill,
    count: users.filter(u => (u.skills || []).includes(skill)).length,
    users: users.filter(u => (u.skills || []).includes(skill))
  })).sort((a, b) => b.count - a.count);

  const handleAddSkill = async () => {
    if (!skillInput.trim() || !user) return;

    const newSkill = skillInput.trim();
    if ((user.skills || []).includes(newSkill)) {
      showNotification({
        title: 'Duplicate Skill',
        message: 'You already have this skill!',
        type: 'warning'
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateUser(user.uid, {
        skills: [...(user.skills || []), newSkill]
      });
      setSkillInput('');
      setShowAddSkill(false);
    } catch (error) {
      console.error('Error adding skill:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to add skill. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      await updateUser(user.uid, {
        skills: (user.skills || []).filter(skill => skill !== skillToRemove)
      });
    } catch (error) {
      console.error('Error removing skill:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to remove skill. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'dev': return <Code className="w-4 h-4" />;
      case 'design': return <Palette className="w-4 h-4" />;
      case 'cyber': return <Shield className="w-4 h-4" />;
      case 'analyst': return <BarChart3 className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
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

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Skills Matrix</h1>
            <p className="text-gray-600 mt-1">Explore team skills and expertise</p>
          </div>
          <Button
            onClick={() => setShowAddSkill(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Skill</span>
          </Button>
        </div>

        {/* My Skills */}
        {user && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My Skills</h2>
            <div className="flex flex-wrap gap-2">
              {(user.skills || []).length > 0 ? (
                user.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 group"
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      disabled={isLoading}
                      className="ml-2 text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No skills added yet. Click "Add Skill" to get started!</p>
              )}
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{allSkills.length}</p>
                <p className="text-sm text-gray-600">Total Skills</p>
              </div>
            </div>
          </Card>

          <Card className="text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{users.length}</p>
                <p className="text-sm text-gray-600">Team Members</p>
              </div>
            </div>
          </Card>

          <Card className="text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {skillStats.length > 0 ? skillStats[0].count : 0}
                </p>
                <p className="text-sm text-gray-600">Most Popular</p>
              </div>
            </div>
          </Card>

          <Card className="text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {users.reduce((sum, u) => sum + (u.skills || []).length, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Entries</p>
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
                  placeholder="Search team members or skills..."
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
          {/* Team Members */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredUsers.map((member) => (
                <div key={member.uid} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  {member.photoURL ? (
                    <img
                      src={member.photoURL}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      {getRoleIcon(member.role)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900">{member.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{member.team}</p>
                    <div className="flex flex-wrap gap-1">
                      {(member.skills || []).slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                      {(member.skills || []).length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          +{(member.skills || []).length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Popular Skills */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Skills</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {skillStats.slice(0, 10).map((stat) => (
                <div key={stat.skill} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{stat.skill}</h3>
                    <p className="text-sm text-gray-600">{stat.count} team member{stat.count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(stat.count / users.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{stat.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Add Skill Modal */}
        {showAddSkill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Skill</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skill Name
                  </label>
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., React, Python, UI Design"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                  />
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={() => {
                      setShowAddSkill(false);
                      setSkillInput('');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddSkill}
                    isLoading={isLoading}
                    className="flex-1"
                    disabled={!skillInput.trim()}
                  >
                    Add Skill
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};