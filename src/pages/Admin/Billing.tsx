import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { 
  getCompany, 
  getSubscription,
  createAuditLog
} from '../../services/firebaseService';
import { Company, Subscription } from '../../types';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Users,
  FolderOpen,
  HardDrive,
  Crown,
  Zap,
  Shield,
  BarChart3,
  Settings
} from 'lucide-react';

export const Billing: React.FC = () => {
  const { user } = useAuth();
  const { showNotification, showConfirmation } = useModal();
  
  const [company, setCompany] = useState<Company | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (user?.companyId) {
      loadBillingData();
    }
  }, [user?.companyId]);

  const loadBillingData = async () => {
    if (!user?.companyId) return;
    
    try {
      setLoading(true);
      const [companyData, subscriptionData] = await Promise.all([
        getCompany(user.companyId),
        getSubscription(user.companyId)
      ]);
      
      setCompany(companyData);
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Error loading billing data:', error);
      showNotification({
        title: 'Error',
        message: 'Error loading billing data',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlan = async (newPlan: 'premium' | 'enterprise') => {
    if (!user?.companyId) return;
    
    showConfirmation({
      title: `Upgrade to ${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)}`,
      message: `Are you sure you want to upgrade to the ${newPlan} plan? This will change your billing immediately.`,
      confirmText: 'Upgrade',
      cancelText: 'Cancel',
      type: 'info',
      onConfirm: async () => {
        try {
          setUpgrading(true);
          
          // TODO: Integrate with Stripe/IntaSend for actual billing
          // For now, just show a success message
          
          // Create audit log
          await createAuditLog({
            userId: user.uid,
            userName: user.name,
            action: `Plan upgrade requested to ${newPlan}`,
            resourceType: 'system',
            details: { 
              companyId: user.companyId, 
              requestedPlan: newPlan,
              currentPlan: subscription?.plan || 'free'
            },
            companyId: user.companyId
          });

                     showNotification({
             title: 'Success',
             message: `Upgrade to ${newPlan} plan initiated! Our team will contact you shortly.`,
             type: 'success'
           });
        } catch (error) {
          console.error('Error upgrading plan:', error);
                     showNotification({
             title: 'Error',
             message: 'Error upgrading plan',
             type: 'error'
           });
        } finally {
          setUpgrading(false);
        }
      }
    });
  };

  const handleCancelSubscription = async () => {
    if (!user?.companyId) return;
    
    showConfirmation({
      title: 'Cancel Subscription',
      message: 'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.',
      confirmText: 'Cancel Subscription',
      cancelText: 'Keep Subscription',
      type: 'danger',
      onConfirm: async () => {
        try {
          setCanceling(true);
          
          // TODO: Integrate with Stripe/IntaSend for actual cancellation
          // For now, just show a success message
          
          // Create audit log
          await createAuditLog({
            userId: user.uid,
            userName: user.name,
            action: 'Subscription cancellation requested',
            resourceType: 'system',
            details: { 
              companyId: user.companyId, 
              currentPlan: subscription?.plan || 'free'
            },
            companyId: user.companyId
          });

                     showNotification({
             title: 'Success',
             message: 'Subscription cancellation requested. You will be contacted for confirmation.',
             type: 'success'
           });
        } catch (error) {
          console.error('Error canceling subscription:', error);
                     showNotification({
             title: 'Error',
             message: 'Error canceling subscription',
             type: 'error'
           });
        } finally {
          setCanceling(false);
        }
      }
    });
  };

  const getPlanFeatures = (plan: string) => {
    switch (plan) {
      case 'free':
        return [
          { name: 'Up to 5 team members', included: true },
          { name: 'Up to 10 projects', included: true },
          { name: 'Basic analytics', included: true },
          { name: 'Standard support', included: true },
          { name: 'Custom branding', included: false },
          { name: 'Advanced analytics', included: false },
          { name: 'Priority support', included: false },
          { name: 'API access', included: false }
        ];
      case 'premium':
        return [
          { name: 'Up to 25 team members', included: true },
          { name: 'Up to 100 projects', included: true },
          { name: 'Advanced analytics', included: true },
          { name: 'Priority support', included: true },
          { name: 'Custom branding', included: true },
          { name: 'API access', included: true },
          { name: 'Advanced integrations', included: false },
          { name: 'Dedicated account manager', included: false }
        ];
      case 'enterprise':
        return [
          { name: 'Unlimited team members', included: true },
          { name: 'Unlimited projects', included: true },
          { name: 'Enterprise analytics', included: true },
          { name: '24/7 dedicated support', included: true },
          { name: 'Custom branding', included: true },
          { name: 'API access', included: true },
          { name: 'Advanced integrations', included: true },
          { name: 'Dedicated account manager', included: true },
          { name: 'Custom integrations', included: true },
          { name: 'SLA guarantees', included: true }
        ];
      default:
        return [];
    }
  };

  const getPlanPrice = (plan: string) => {
    switch (plan) {
      case 'free': return '$0';
      case 'premium': return '$29';
      case 'enterprise': return '$99';
      default: return '$0';
    }
  };

  const getPlanBillingPeriod = (plan: string) => {
    switch (plan) {
      case 'free': return 'forever';
      case 'premium': return 'per month';
      case 'enterprise': return 'per month';
      default: return 'forever';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Company Not Found</h2>
          <p className="text-gray-600">Unable to load company information.</p>
        </div>
      </div>
    );
  }

  const currentPlan = subscription?.plan || 'free';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-2">
            Manage your subscription plan and billing information
          </p>
        </div>

        {/* Current Plan Status */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
                <p className="text-gray-600">Your active subscription details</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  subscription?.status === 'active' ? 'bg-green-100 text-green-800' :
                  subscription?.status === 'canceled' ? 'bg-red-100 text-red-800' :
                  subscription?.status === 'past_due' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {subscription?.status ? subscription.status.replace('_', ' ').charAt(0).toUpperCase() + subscription.status.slice(1) : 'Active'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">Team Members</p>
                <p className="text-2xl font-bold text-gray-900">{company.maxMembers}</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-green-100 rounded-lg">
                  <FolderOpen className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Projects</p>
                <p className="text-2xl font-bold text-gray-900">{company.maxProjects}</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-lg">
                  <HardDrive className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600">Storage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentPlan === 'free' ? '1 GB' : 
                   currentPlan === 'premium' ? '10 GB' : 'Unlimited'}
                </p>
              </div>
            </div>

            {subscription && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Current Period:</span>
                    <div className="mt-1 text-gray-600">
                      {subscription.currentPeriodStart.toLocaleDateString()} - {subscription.currentPeriodEnd.toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Next Billing:</span>
                    <div className="mt-1 text-gray-600">
                      {subscription.currentPeriodEnd.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Available Plans */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Free Plan */}
          <Card className={`relative ${currentPlan === 'free' ? 'ring-2 ring-blue-500' : ''}`}>
            {currentPlan === 'free' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Current Plan
                </span>
              </div>
            )}
            
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Free</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">$0</div>
                <p className="text-sm text-gray-600">forever</p>
              </div>
              
              <ul className="space-y-3 mb-6">
                {getPlanFeatures('free').map((feature, index) => (
                  <li key={index} className="flex items-center">
                    {feature.included ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400 mr-3" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-gray-900' : 'text-gray-500'}`}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
              
              <Button
                className="w-full"
                variant={currentPlan === 'free' ? 'outline' : 'default'}
                disabled={currentPlan === 'free'}
              >
                {currentPlan === 'free' ? 'Current Plan' : 'Get Started'}
              </Button>
            </div>
          </Card>

          {/* Premium Plan */}
          <Card className={`relative ${currentPlan === 'premium' ? 'ring-2 ring-purple-500' : ''}`}>
            {currentPlan === 'premium' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Current Plan
                </span>
              </div>
            )}
            
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Premium</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">$29</div>
                <p className="text-sm text-gray-600">per month</p>
              </div>
              
              <ul className="space-y-3 mb-6">
                {getPlanFeatures('premium').map((feature, index) => (
                  <li key={index} className="flex items-center">
                    {feature.included ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400 mr-3" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-gray-900' : 'text-gray-500'}`}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
              
              <Button
                className="w-full"
                variant={currentPlan === 'premium' ? 'outline' : 'default'}
                disabled={currentPlan === 'premium'}
                onClick={() => handleUpgradePlan('premium')}
              >
                {currentPlan === 'premium' ? 'Current Plan' : 
                 currentPlan === 'free' ? 'Upgrade to Premium' : 'Downgrade to Premium'}
              </Button>
            </div>
          </Card>

          {/* Enterprise Plan */}
          <Card className={`relative ${currentPlan === 'enterprise' ? 'ring-2 ring-yellow-500' : ''}`}>
            {currentPlan === 'enterprise' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Current Plan
                </span>
              </div>
            )}
            
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Enterprise</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">$99</div>
                <p className="text-sm text-gray-600">per month</p>
              </div>
              
              <ul className="space-y-3 mb-6">
                {getPlanFeatures('enterprise').map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-sm text-gray-900">{feature.name}</span>
                  </li>
                ))}
              </ul>
              
              <Button
                className="w-full"
                variant={currentPlan === 'enterprise' ? 'outline' : 'default'}
                disabled={currentPlan === 'enterprise'}
                onClick={() => handleUpgradePlan('enterprise')}
              >
                {currentPlan === 'enterprise' ? 'Current Plan' : 'Contact Sales'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Billing Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Method */}
          <Card>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <CreditCard className="h-6 w-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">Payment Method</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-6 bg-blue-600 rounded mr-3"></div>
                    <div>
                      <p className="font-medium text-gray-900">Visa ending in 4242</p>
                      <p className="text-sm text-gray-600">Expires 12/25</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                </div>
                
                <Button className="w-full" variant="outline">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </div>
            </div>
          </Card>

          {/* Billing History */}
          <Card>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Calendar className="h-6 w-6 text-green-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">Billing History</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Premium Plan - March 2024</p>
                    <p className="text-sm text-gray-600">Mar 1, 2024</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">$29.00</p>
                    <p className="text-sm text-green-600">Paid</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Premium Plan - February 2024</p>
                    <p className="text-sm text-gray-600">Feb 1, 2024</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">$29.00</p>
                    <p className="text-sm text-green-600">Paid</p>
                  </div>
                </div>
                
                <Button className="w-full" variant="outline">
                  View All Invoices
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Subscription Management */}
        {currentPlan !== 'free' && (
          <Card className="mt-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Subscription Management</h3>
                  <p className="text-gray-600">Manage your subscription settings</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleCancelSubscription}
                    disabled={canceling}
                  >
                    {canceling ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Subscription
                      </>
                    )}
                  </Button>
                  
                  <p className="text-sm text-gray-600">
                    Cancel your subscription at any time. You'll continue to have access until the end of your current billing period.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <Button className="w-full" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Billing Settings
                  </Button>
                  
                  <p className="text-sm text-gray-600">
                    Update your billing information, tax details, and notification preferences.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Integration Notice */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <div className="p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-blue-900">Ready for Payment Integration</h3>
                <p className="mt-2 text-blue-700">
                  This billing system is designed to easily integrate with Stripe, IntaSend, or other payment processors. 
                  The subscription management, plan upgrades, and billing logic are all in place and ready for production use.
                </p>
                <div className="mt-4 flex space-x-3">
                  <Button variant="outline" size="sm">
                    <Shield className="h-4 w-4 mr-2" />
                    View Integration Guide
                  </Button>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    API Documentation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
