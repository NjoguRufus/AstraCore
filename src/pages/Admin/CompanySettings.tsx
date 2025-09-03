import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { 
  getCompany, 
  updateCompany, 
  getCompanySettings, 
  updateCompanySettings,
  createAuditLog 
} from '../../services/firebaseService';
import { Company, CompanySettings as CompanySettingsType } from '../../types';
import { 
  Building2, 
  Palette, 
  Bell, 
  BarChart3,
  Settings,
  Check,
  X
} from 'lucide-react';

export const CompanySettings: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useModal();
  
  const [company, setCompany] = useState<Company | null>(null);
  const [settings, setSettings] = useState<CompanySettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    accentColor: '#F59E0B',
    logo: '',
    tagline: '',
    enableNotifications: true,
    enableAuditLogs: true,
    enableAnalytics: true,
    enableCustomDomains: false,
    emailNotifications: true,
    inAppNotifications: true,
    slackWebhook: ''
  });

  useEffect(() => {
    if (user?.companyId) {
      loadCompanyData();
    }
  }, [user?.companyId]);

  const loadCompanyData = async () => {
    if (!user?.companyId) return;
    
    try {
      setLoading(true);
      const [companyData, settingsData] = await Promise.all([
        getCompany(user.companyId),
        getCompanySettings(user.companyId)
      ]);
      
      if (companyData) {
        setCompany(companyData);
        setFormData(prev => ({
          ...prev,
          name: companyData.name,
          slug: companyData.slug,
          primaryColor: companyData.primaryColor,
          secondaryColor: companyData.secondaryColor,
          accentColor: companyData.accentColor,
          logo: companyData.logo || '',
          tagline: companyData.tagline || ''
        }));
      }
      
      if (settingsData) {
        setSettings(settingsData);
        setFormData(prev => ({
          ...prev,
          enableNotifications: settingsData.features.enableNotifications,
          enableAuditLogs: settingsData.features.enableAuditLogs,
          enableAnalytics: settingsData.features.enableAnalytics,
          enableCustomDomains: settingsData.features.enableCustomDomains,
          emailNotifications: settingsData.notifications.emailNotifications,
          inAppNotifications: settingsData.notifications.inAppNotifications,
          slackWebhook: settingsData.notifications.slackWebhook || ''
        }));
      }
    } catch (error) {
      console.error('Error loading company data:', error);
      showNotification({
        title: 'Error',
        message: 'Error loading company data',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user?.companyId || !company) return;
    
    try {
      setSaving(true);
      
      // Update company basic info
      const companyUpdates = {
        name: formData.name,
        slug: formData.slug,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        accentColor: formData.accentColor,
        logo: formData.logo || undefined,
        tagline: formData.tagline || undefined
      };
      
      await updateCompany(user.companyId, companyUpdates);
      
      // Update or create company settings
      const settingsUpdates = {
        companyId: user.companyId,
        theme: {
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          accentColor: formData.accentColor,
          backgroundColor: '#FFFFFF',
          textColor: '#1F2937'
        },
        branding: {
          logo: formData.logo || undefined,
          companyName: formData.name,
          tagline: formData.tagline || undefined
        },
        features: {
          enableNotifications: formData.enableNotifications,
          enableAuditLogs: formData.enableAuditLogs,
          enableAnalytics: formData.enableAnalytics,
          enableCustomDomains: formData.enableCustomDomains
        },
        notifications: {
          emailNotifications: formData.emailNotifications,
          inAppNotifications: formData.inAppNotifications,
          slackWebhook: formData.slackWebhook || undefined
        },
        updatedBy: user.uid
      };
      
      await updateCompanySettings(user.companyId, settingsUpdates);
      
      // Create audit log
      await createAuditLog({
        userId: user.uid,
        userName: user.name,
        action: 'Company settings updated',
        resourceType: 'system',
        details: { companyId: user.companyId, updatedFields: Object.keys(companyUpdates) },
        companyId: user.companyId
      });
      
      // Reload data
      await loadCompanyData();
      
      showNotification({
        title: 'Success',
        message: 'Company settings updated successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error saving company settings:', error);
      showNotification({
        title: 'Error',
        message: 'Error saving company settings',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (company && settings) {
      setFormData({
        name: company.name,
        slug: company.slug,
        primaryColor: company.primaryColor,
        secondaryColor: company.secondaryColor,
        accentColor: company.accentColor,
        logo: company.logo || '',
        tagline: company.tagline || '',
        enableNotifications: settings.features.enableNotifications,
        enableAuditLogs: settings.features.enableAuditLogs,
        enableAnalytics: settings.features.enableAnalytics,
        enableCustomDomains: settings.features.enableCustomDomains,
        emailNotifications: settings.notifications.emailNotifications,
        inAppNotifications: settings.notifications.inAppNotifications,
        slackWebhook: settings.notifications.slackWebhook || ''
      });
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your company's branding, theme, and feature settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Information */}
            <Card>
                             <div className="flex items-center mb-6">
                 <Building2 className="h-6 w-6 text-blue-600 mr-3" />
                 <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>
               </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter company name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="company-slug"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Used for URLs and subdomains
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={formData.logo}
                    onChange={(e) => handleInputChange('logo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => handleInputChange('tagline', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your company tagline"
                  />
                </div>
              </div>
            </Card>

            {/* Theme Colors */}
            <Card>
                             <div className="flex items-center mb-6">
                 <Palette className="h-6 w-6 text-purple-600 mr-3" />
                 <h2 className="text-xl font-semibold text-gray-900">Theme Colors</h2>
               </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accent Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => handleInputChange('accentColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.accentColor}
                      onChange={(e) => handleInputChange('accentColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Feature Toggles */}
            <Card>
                             <div className="flex items-center mb-6">
                 <Settings className="h-6 w-6 text-gray-600 mr-3" />
                 <h2 className="text-xl font-semibold text-gray-900">Feature Settings</h2>
               </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Enable Notifications</h3>
                    <p className="text-sm text-gray-500">Allow users to receive in-app and email notifications</p>
                  </div>
                  <button
                    onClick={() => handleInputChange('enableNotifications', !formData.enableNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.enableNotifications ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.enableNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Enable Audit Logs</h3>
                    <p className="text-sm text-gray-500">Track user actions and system changes</p>
                  </div>
                  <button
                    onClick={() => handleInputChange('enableAuditLogs', !formData.enableAuditLogs)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.enableAuditLogs ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.enableAuditLogs ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Enable Analytics</h3>
                    <p className="text-sm text-gray-500">Generate and display company performance metrics</p>
                  </div>
                  <button
                    onClick={() => handleInputChange('enableAnalytics', !formData.enableAnalytics)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.enableAnalytics ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.enableAnalytics ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Custom Domains</h3>
                    <p className="text-sm text-gray-500">Allow custom subdomains for your company</p>
                  </div>
                  <button
                    onClick={() => handleInputChange('enableCustomDomains', !formData.enableCustomDomains)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.enableCustomDomains ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.enableCustomDomains ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </Card>

            {/* Notification Settings */}
            <Card>
                             <div className="flex items-center mb-6">
                 <Bell className="h-6 w-6 text-green-600 mr-3" />
                 <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
               </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                    <p className="text-sm text-gray-500">Send notifications via email</p>
                  </div>
                  <button
                    onClick={() => handleInputChange('emailNotifications', !formData.emailNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">In-App Notifications</h3>
                    <p className="text-sm text-gray-500">Show notifications within the application</p>
                  </div>
                  <button
                    onClick={() => handleInputChange('inAppNotifications', !formData.inAppNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.inAppNotifications ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.inAppNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slack Webhook URL
                  </label>
                  <input
                    type="url"
                    value={formData.slackWebhook}
                    onChange={(e) => handleInputChange('slackWebhook', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://hooks.slack.com/services/..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Send notifications to Slack channel
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Preview and Actions */}
          <div className="space-y-6">
            {/* Company Preview */}
            <Card>
                             <div className="flex items-center mb-6">
                 <BarChart3 className="h-6 w-6 text-indigo-600 mr-3" />
                 <h2 className="text-xl font-semibold text-gray-900">Preview</h2>
               </div>
              
              <div className="text-center p-6 rounded-lg border-2 border-dashed border-gray-300">
                {formData.logo ? (
                  <img 
                    src={formData.logo} 
                    alt="Company Logo" 
                    className="w-20 h-20 mx-auto mb-4 rounded-lg object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                                 {!formData.logo && (
                   <div className="w-20 h-20 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                     <Building2 className="h-10 w-10 text-gray-400" />
                   </div>
                 )}
                
                <h3 
                  className="text-lg font-semibold mb-2"
                  style={{ color: formData.primaryColor }}
                >
                  {formData.name || 'Company Name'}
                </h3>
                
                {formData.tagline && (
                  <p className="text-sm text-gray-600 mb-4">{formData.tagline}</p>
                )}
                
                <div className="flex justify-center space-x-2">
                  <div 
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: formData.primaryColor }}
                  />
                  <div 
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: formData.secondaryColor }}
                  />
                  <div 
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: formData.accentColor }}
                  />
                </div>
              </div>
            </Card>

            {/* Current Plan */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Current Plan</p>
                    <p className="text-xl font-bold">{company.plan}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90">Members</p>
                    <p className="text-xl font-bold">{company.maxMembers}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white border-opacity-20">
                  <p className="text-sm opacity-90">Projects</p>
                  <p className="text-lg font-semibold">{company.maxProjects}</p>
                </div>
              </div>
              <Button 
                className="w-full mt-4"
                variant="outline"
                onClick={() => window.location.href = '/admin/billing'}
              >
                Manage Subscription
              </Button>
            </Card>

            {/* Actions */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <Button 
                  className="w-full"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                                         <>
                       <Check className="h-4 w-4 mr-2" />
                       Save Changes
                     </>
                  )}
                </Button>
                
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={handleReset}
                  disabled={saving}
                >
                                     <X className="h-4 w-4 mr-2" />
                   Reset Changes
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
