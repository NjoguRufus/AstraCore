import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { updateUser } from '../../services/firebaseService';
import { uploadToCloudinary } from '../../config/cloudinary';
import { UnifiedIDCard } from '../../components/IDCard/UnifiedIDCard';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Layout } from '../../components/Layout/Layout';
import { 
  User as UserIcon, 
  Camera, 
  Github, 
  Linkedin, 
  Phone, 
  Mail,
  Edit,
  Save,
  X
} from 'lucide-react';

export const MemberProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showNotification } = useModal();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: '',
    role: 'dev' as 'dev' | 'admin' | 'design' | 'cyber' | 'analyst' | 'sales' | 'marketing' | 'campaign',
    github: '',
    linkedin: '',
    phone: ''
  });

  const resetProfileData = () => {
    if (user) {
      setProfileData({
        name: user.name || '',
        role: user.role || ('dev' as const),
        github: user.github || '',
        linkedin: user.linkedin || '',
        phone: user.phone || ''
      });
    }
    setIsEditing(false);
  };

  React.useEffect(() => {
    if (user) {
      // Only update profileData if we're not currently editing
      // This prevents overwriting user's current edits
      if (!isEditing) {
        setProfileData({
          name: user.name || '',
          role: user.role || ('dev' as const),
          github: user.github || '',
          linkedin: user.linkedin || '',
          phone: user.phone || ''
        });
      }
    }
  }, [user, isEditing]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification({
        title: 'Invalid File Type',
        message: 'Please select an image file.',
          type: 'error'
        });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showNotification({
        title: 'File Too Large',
        message: 'Please select an image smaller than 5MB.',
        type: 'error'
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      const photoURL = await uploadToCloudinary(file);
      await updateUser(user.uid, { photoURL });
      
      showNotification({
        title: 'Success',
        message: 'Profile photo updated successfully!',
        type: 'success'
      });
      
      await refreshUser();
    } catch (error) {
      console.error('Error uploading photo:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to upload photo. Please try again.',
        type: 'error'
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    if (!profileData.name.trim()) {
      showNotification({
        title: 'Validation Error',
        message: 'Name is required. Please enter your full name.',
        type: 'warning'
      });
      return;
    }

    try {
      await updateUser(user.uid, profileData);
      setIsEditing(false);
      
      showNotification({
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully!',
        type: 'success'
      });
      
      await refreshUser();
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to update profile. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {/* Profile Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Profile Summary */}
          <Card>
            <div className="text-center p-4 sm:p-6">
              {/* Profile Photo */}
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                      className="w-full h-full object-cover"
                  />
                ) : (
                    <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                      <UserIcon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                  </div>
                )}
                </div>
                
                {/* Upload Button */}
                <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors">
                  <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                    className="hidden"
                  disabled={uploadingPhoto}
                />
                </label>
                
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{user.name}</h2>
              <p className="text-sm text-gray-600 mb-4 capitalize">{user.role}</p>
              
              {/* Quick Stats */}
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Employee ID:</strong> {user.idCode || 'Not assigned'}</p>
                <p><strong>Team:</strong> {user.team || 'Not assigned'}</p>
                <p><strong>Joined:</strong> {user.createdAt ? user.createdAt.toLocaleDateString() : 'No date'}</p>
              </div>
            </div>
          </Card>

          {/* Profile Details */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
              <div className="flex items-center space-x-3">
                {isEditing ? (
                  <>
                    <Button
                      onClick={resetProfileData}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </Button>
                )}
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-gray-900">{user.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Your team assignment is managed by administrators
                  </p>
                  <div className="flex items-center space-x-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                    <span className="text-gray-900 font-medium">
                      {user.team || 'No team assigned'}
                            </span>
                            </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Contact an administrator to change your team assignment
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <p className="text-gray-900">{user.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                  )}
                </div>
              </div>

              {/* Social Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Github className="w-4 h-4 inline mr-1" />
                    GitHub
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={profileData.github}
                      onChange={(e) => setProfileData(prev => ({ ...prev, github: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://github.com/username"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {user.github ? (
                        <a href={user.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {user.github}
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Linkedin className="w-4 h-4 inline mr-1" />
                    LinkedIn
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={profileData.linkedin}
                      onChange={(e) => setProfileData(prev => ({ ...prev, linkedin: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://linkedin.com/in/username"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {user.linkedin ? (
                        <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {user.linkedin}
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* ID Card Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ID Card</h3>
                <UnifiedIDCard 
                  user={user} 
                  compact={true} 
                  showDownloadButton={true}
                  className="mx-auto"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};