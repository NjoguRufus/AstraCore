import React from 'react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { CheckCircle, ArrowRight, Users, Target, Zap } from 'lucide-react';
import { generateWelcomeMessage, getRoleTeamName, getRoleEmoji } from '../../utils/welcomeMessage';

interface WelcomeMessageProps {
  userName: string;
  teamName: string;
  userRole: string;
  onContinue: () => void;
}

export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
  userName,
  teamName,
  userRole,
  onContinue
}) => {
  // Debug: Log the props received
  console.log('🔍 WelcomeMessage - Props received:', {
    userName,
    teamName,
    userRole
  });

  // Dynamic welcome message template
  const welcomeText = generateWelcomeMessage({
    userName,
    teamName: teamName, // Use the actual team name passed as prop
    userRole
  });

  // Debug: Log the generated welcome text
  console.log('🔍 WelcomeMessage - Generated welcome text:', welcomeText);

  // Role-specific welcome content
  const getRoleWelcomeContent = () => {
    console.log('🔍 WelcomeMessage - Getting role content for role:', userRole);
    
    const roleContent = {
      sales: {
        icon: <Target className="w-8 h-8 text-green-600" />,
        title: "Sales Agent",
        description: "You're our growth engine! Help Kenyan businesses discover the power of digital solutions.",
        tasks: [
          "Connect with potential clients",
          "Present our digital solutions",
          "Close deals and drive revenue",
          "Build lasting business relationships"
        ],
        color: "bg-green-50 border-green-200"
      },
      design: {
        icon: <Zap className="w-8 h-8 text-purple-600" />,
        title: "Content Creator",
        description: "You craft the stories that connect us with our audience and showcase our expertise.",
        tasks: [
          "Create engaging content",
          "Develop marketing materials",
          "Manage social media presence",
          "Tell Astraronix's story"
        ],
        color: "bg-purple-50 border-purple-200"
      },
      dev: {
        icon: <Zap className="w-8 h-8 text-blue-600" />,
        title: "Developer",
        description: "You build the digital experiences that empower Kenyan businesses to thrive.",
        tasks: [
          "Develop innovative solutions",
          "Create user-friendly applications",
          "Solve complex technical challenges",
          "Bring ideas to life through code"
        ],
        color: "bg-blue-50 border-blue-200"
      },
      admin: {
        icon: <Users className="w-8 h-8 text-red-600" />,
        title: "Administrator",
        description: "You keep everything running smoothly and ensure our team operates at peak efficiency.",
        tasks: [
          "Manage team operations",
          "Oversee project coordination",
          "Ensure quality standards",
          "Support team success"
        ],
        color: "bg-red-50 border-red-200"
      },
      cyber: {
        icon: <Users className="w-8 h-8 text-orange-600" />,
        title: "Cybersecurity Specialist",
        description: "You protect our digital assets and ensure security compliance across all systems.",
        tasks: [
          "Monitor security systems",
          "Implement security protocols",
          "Conduct security audits",
          "Respond to security incidents"
        ],
        color: "bg-orange-50 border-orange-200"
      },
      analyst: {
        icon: <Users className="w-8 h-8 text-indigo-600" />,
        title: "Data Analyst",
        description: "You turn data into insights that drive business decisions and growth strategies.",
        tasks: [
          "Analyze business data",
          "Create data visualizations",
          "Generate insights and reports",
          "Support data-driven decisions"
        ],
        color: "bg-indigo-50 border-indigo-200"
      },
      marketing: {
        icon: <Users className="w-8 h-8 text-pink-600" />,
        title: "Digital Marketing Agent",
        description: "You drive our digital presence and create campaigns that engage our audience.",
        tasks: [
          "Develop marketing strategies",
          "Create digital campaigns",
          "Manage social media",
          "Track campaign performance"
        ],
        color: "bg-pink-50 border-pink-200"
      },
      campaign: {
        icon: <Users className="w-8 h-8 text-teal-600" />,
        title: "Campaign Manager",
        description: "You coordinate campaigns and ensure all marketing efforts work together seamlessly.",
        tasks: [
          "Plan campaign strategies",
          "Coordinate team efforts",
          "Monitor campaign progress",
          "Optimize campaign performance"
        ],
        color: "bg-teal-50 border-teal-200"
      }
    };

    return roleContent[userRole as keyof typeof roleContent] || roleContent.dev;
  };

  const roleContent = getRoleWelcomeContent();
  
  // Debug: Log the selected role content
  console.log('🔍 WelcomeMessage - Selected role content:', {
    role: userRole,
    title: roleContent.title,
    description: roleContent.description
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <img 
                src="https://i.imgur.com/T7mH4Ly.png" 
                alt="Astraronix Solutions" 
                className="h-16 w-auto"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🎉 Welcome to Astraronix Solutions!
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 mx-auto rounded-full"></div>
          </div>

          {/* Welcome Message */}
          <div className="bg-white rounded-lg p-6 mb-8 border-l-4 border-blue-500">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👋</span>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Your Journey Starts Here
                </h2>
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {welcomeText}
                </div>
              </div>
            </div>
          </div>

          {/* Role Information */}
          <div className={`rounded-lg p-6 mb-8 ${roleContent.color}`}>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {roleContent.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {roleContent.title}
                </h3>
                <p className="text-gray-700 mb-4">
                  {roleContent.description}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {roleContent.tasks.map((task, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              About Astraronix Solutions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Our Mission</h4>
                <p className="text-gray-700">
                  We build digital experiences that empower Kenyan businesses — from car dealerships to tech startups. 
                  Our mission is simple: deliver smart, scalable, and beautiful software that drives growth.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Company Details</h4>
                <div className="space-y-1 text-gray-700">
                  <p><strong>Name:</strong> Astraronix Solutions</p>
                  <p><strong>Location:</strong> Nairobi, Kenya (Remote)</p>
                  <p><strong>Contact:</strong> +254 714 748 299</p>
                  <p><strong>Email:</strong> astraronixsolutions@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="text-center">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready to Get Started?
              </h3>
              <p className="text-gray-600">
                Your dashboard is ready and waiting. Let's explore what you can accomplish with Astraronix!
              </p>
            </div>
            
            <Button
              onClick={onContinue}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 mx-auto"
            >
              <span>Continue to Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
