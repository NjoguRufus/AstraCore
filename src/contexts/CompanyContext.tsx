import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Company, CompanySettings, Subscription } from '../types';
import { getCompany, getCompanySettings, getSubscription } from '../services/firebaseService';

interface CompanyContextType {
  company: Company | null;
  companySettings: CompanySettings | null;
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  refreshCompany: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCompanyData = async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [companyData, settingsData, subscriptionData] = await Promise.all([
        getCompany(user.companyId),
        getCompanySettings(user.companyId),
        getSubscription(user.companyId)
      ]);

      setCompany(companyData);
      setCompanySettings(settingsData);
      setSubscription(subscriptionData);
    } catch (err) {
      console.error('Error loading company data:', err);
      setError('Failed to load company information');
    } finally {
      setLoading(false);
    }
  };

  const refreshCompany = async () => {
    if (user?.companyId) {
      try {
        const companyData = await getCompany(user.companyId);
        setCompany(companyData);
      } catch (err) {
        console.error('Error refreshing company:', err);
      }
    }
  };

  const refreshSettings = async () => {
    if (user?.companyId) {
      try {
        const settingsData = await getCompanySettings(user.companyId);
        setCompanySettings(settingsData);
      } catch (err) {
        console.error('Error refreshing company settings:', err);
      }
    }
  };

  const refreshSubscription = async () => {
    if (user?.companyId) {
      try {
        const subscriptionData = await getSubscription(user.companyId);
        setSubscription(subscriptionData);
      } catch (err) {
        console.error('Error refreshing subscription:', err);
      }
    }
  };

  useEffect(() => {
    loadCompanyData();
  }, [user?.companyId]);

  const value: CompanyContextType = {
    company,
    companySettings,
    subscription,
    loading,
    error,
    refreshCompany,
    refreshSettings,
    refreshSubscription
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

