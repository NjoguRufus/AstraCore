import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateUser } from '../../services/firebaseService';
import { useModal } from '../../contexts/ModalContext';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { 
  Rocket, 
  DollarSign, 
  Users, 
  Target, 
  Zap,
  CheckCircle,
  Star,
  X
} from 'lucide-react';

interface RoleOnboardingModalProps {
  onClose: () => void;
}

export const RoleOnboardingModal: React.FC<RoleOnboardingModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { showNotification } = useModal();
  const [isLoading, setIsLoading] = useState(false);

  if (!user) return null;

  const roleData: Record<string, { 
    title: string; 
    description: string; 
    commission: string; 
    icon: React.ReactNode;
    color: string;
  }> = {
    sales: {
      title: "Sales Agent",
      description: "You connect businesses with our digital solutions — websites, systems, and apps. Your communication skills and relationship building drive our growth.",
      commission: "From KSh 5,000 per client. Higher project value = higher cut.",
      icon: <Users className="w-6 h-6" />,
      color: "text-blue-600"
    },
    design: {
      title: "Content Creator", 
      description: "You craft visuals that define our brand — banners, graphics, and product showcases. Your creativity is the first impression Astraronix makes.",
      commission: "Earn per client your design work attracts.",
      icon: <Star className="w-6 h-6" />,
      color: "text-purple-600"
    },
    marketing: {
      title: "Digital Marketing Agent",
      description: "You drive campaigns, ads, and brand awareness. You promote Astraronix online using ads and social media to attract new clients.",
      commission: "You earn when your marketing brings clients in.",
      icon: <Target className="w-6 h-6" />,
      color: "text-green-600"
    },
    campaign: {
      title: "Campaign Manager",
      description: "You coordinate and manage internal campaigns, ensuring performance and delivery. You plan and coordinate all marketing activities.",
      commission: "You earn when the campaigns lead to actual clients.",
      icon: <Rocket className="w-6 h-6" />,
      color: "text-orange-600"
    },
    dev: {
      title: "Developer",
      description: "You build the digital experiences that empower Kenyan businesses. Your code brings our solutions to life.",
      commission: "Project-based compensation with performance bonuses.",
      icon: <Zap className="w-6 h-6" />,
      color: "text-blue-600"
    },
    admin: {
      title: "Administrator",
      description: "You oversee operations and ensure everything runs smoothly. You're the backbone of Astraronix operations.",
      commission: "Management-level compensation with team performance bonuses.",
      icon: <CheckCircle className="w-6 h-6" />,
      color: "text-red-600"
    },
    cyber: {
      title: "Cybersecurity Specialist",
      description: "You protect our digital assets and ensure security compliance across all systems. Your expertise keeps our data safe.",
      commission: "Security-focused compensation with compliance bonuses.",
      icon: <CheckCircle className="w-6 h-6" />,
      color: "text-orange-600"
    },
    analyst: {
      title: "Data Analyst",
      description: "You turn data into insights that drive business decisions and growth strategies. Your analysis powers our success.",
      commission: "Data-driven compensation with insight bonuses.",
      icon: <Target className="w-6 h-6" />,
      color: "text-indigo-600"
    }
  };

  const aboutAstraronix = `About Astraronix

We build digital experiences that empower Kenyan businesses — from car dealerships to tech startups. Our mission is simple: deliver smart, scalable, and beautiful software that drives growth.

Company Information:
• Name: Astraronix Solutions
• Address: Nairobi, Kenya, Remote
• Contact: +254 714 748 299
• Email: astraronixsolutions@gmail.com

Your role is crucial in making this vision a reality.`;

  const handleStartWorking = async () => {
    setIsLoading(true);
    try {
      await updateUser(user.uid, {
        roleOnboardingCompleted: true
      });
      onClose();
      showNotification({
        title: 'Welcome to Astraronix!',
        message: 'You\'re all set to start making an impact. Continue to your dashboard to begin!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating onboarding status:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to complete onboarding. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentRole = roleData[user.role] || roleData.dev;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🌐</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome to Astraronix
              </h2>
              <p className="text-gray-600 text-sm">
                Let's get you oriented with your role and our mission
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* About Astraronix */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold text-sm">🔷</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">About Astraronix</h3>
              <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-line">
                {aboutAstraronix}
              </p>
            </div>
          </div>
        </Card>

        {/* Role Information */}
        <Card className="mb-6">
          <div className="flex items-start space-x-4">
            <div className={`${currentRole.color} flex-shrink-0`}>
              {currentRole.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {currentRole.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                {currentRole.description}
              </p>
              
              {/* Team Information */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Your Team:</span>
                </div>
                <p className="text-sm text-gray-600">
                  {user?.team || 'Team assignment pending'}
                </p>
              </div>
              
              {/* Commission Info */}
              <Card className="bg-green-50 border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-800">Commission Model</h4>
                </div>
                <p className="text-green-700 text-sm">
                  💰 {currentRole.commission}
                </p>
              </Card>
            </div>
          </div>
        </Card>

        {/* Key Guidelines */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Guidelines</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">Keep communication professional and client-focused</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">Track your leads and performance metrics</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">Represent Astraronix with confidence and expertise</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">Focus on delivering value to Kenyan businesses</p>
            </div>
          </div>
        </Card>

        {/* Action Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleStartWorking}
            disabled={isLoading}
            size="lg"
            className="px-8"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Starting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Rocket className="w-5 h-5" />
                <span>Okay Understood</span>
              </div>
            )}
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-6 pt-4 border-t border-gray-200">
          <p>Ready to make an impact? Click "Okay Understood" to continue to your dashboard! 🚀</p>
        </div>
      </Card>
    </div>
  );
};