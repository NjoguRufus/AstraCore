import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { uploadToCloudinary } from '../../config/cloudinary';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { Layout } from '../../components/Layout/Layout';
import { Camera, Github, Linkedin, Phone } from 'lucide-react';
import { PendingMember } from '../../types';

export const OnboardingProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [pendingMember, setPendingMember] = useState<PendingMember | null>(null);
  const [profileData, setProfileData] = useState({
    name: '',
    photoURL: '',
    github: '',
    linkedin: '',
    phone: '',
    skills: [] as string[],
  });
  const [skillInput, setSkillInput] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    const employeeId = sessionStorage.getItem('onboarding_employee_id');
    if (!employeeId || !user) {
      navigate('/onboarding');
      return;
    }

    const fetchPendingMember = async () => {
      try {
        const q = query(collection(db, 'pending_members'), where('employeeID', '==', employeeId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const memberData = querySnapshot.docs[0].data() as PendingMember;
          setPendingMember(memberData);
          setProfileData(prev => ({
            ...prev,
            name: user.name || memberData.name
          }));
        } else {
          navigate('/onboarding');
        }
      } catch (error) {
        console.error('Error fetching pending member:', error);
        navigate('/onboarding');
      }
    };

    fetchPendingMember();
  }, [user, navigate]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const photoURL = await uploadToCloudinary(file);
      setProfileData(prev => ({ ...prev, photoURL }));
    } catch (error) {
      console.error('Photo upload error:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && profileData.skills.length < 10) {
      setProfileData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pendingMember) return;

    setIsLoading(true);
    try {
      // Create user document in active_members
      await setDoc(doc(db, 'active_members', user.uid), {
        name: profileData.name,
        email: user.email,
        photoURL: profileData.photoURL || user.photoURL,
        role: pendingMember.role,
        team: pendingMember.team,
        skills: profileData.skills,
        github: profileData.github,
        linkedin: profileData.linkedin,
        phone: profileData.phone,
        employeeID: pendingMember.employeeID,
        createdAt: new Date(),
      });

      // Remove from pending_members
      const q = query(collection(db, 'pending_members'), where('employeeID', '==', pendingMember.employeeID));
      const querySnapshot = await getDocs(q);
      querySnapshot.docs.forEach(async (docSnapshot) => {
        await deleteDoc(docSnapshot.ref);
      });

      // Clear session storage
      sessionStorage.removeItem('onboarding_employee_id');

      // Navigate to contract signing
      navigate('/onboarding/contract');
    } catch (error) {
      console.error('Profile setup error:', error);
      alert('Failed to set up profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !pendingMember) {
    return (
      <Layout showSidebar={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={false}>
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">3</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
            <p className="text-gray-600 mt-2">Add some details to personalize your account.</p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Photo */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  {profileData.photoURL || user.photoURL ? (
                    <img
                      src={profileData.photoURL || user.photoURL}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadingPhoto}
                  />
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">Click to upload profile picture</p>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={pendingMember.role}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    disabled
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Github className="w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    placeholder="GitHub profile URL"
                    value={profileData.github}
                    onChange={(e) => setProfileData(prev => ({ ...prev, github: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Linkedin className="w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    placeholder="LinkedIn profile URL"
                    value={profileData.linkedin}
                    onChange={(e) => setProfileData(prev => ({ ...prev, linkedin: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills & Technologies
                </label>
                <div className="flex space-x-2 mb-3">
                  <input
                    type="text"
                    placeholder="Add a skill"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button type="button" onClick={addSkill} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileData.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full"
              >
                Continue to Contract
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
};