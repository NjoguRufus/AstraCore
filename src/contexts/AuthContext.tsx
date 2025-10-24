import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';
import { checkUserContractStatus } from '../services/firebaseService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  showRoleOnboarding: boolean;
  setShowRoleOnboarding: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRoleOnboarding, setShowRoleOnboarding] = useState(false);

  // Function to sync user document with contract status
  const syncUserWithContract = async (uid: string, userData: any) => {
    try {
      const contractStatus = await checkUserContractStatus(uid);
      
      // If user has a contract but user document doesn't reflect it, update the user document
      if (contractStatus.hasContract && (!userData.onboardingCompleted || !userData.contractSigned)) {
        console.log('🔄 Syncing user document with contract status...');
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
          onboardingCompleted: true,
          contractSigned: true,
          contractId: contractStatus.contractId,
          updatedAt: new Date()
        });
        
        console.log('✅ User document synced with contract status');
        
        // Return updated user data
        return {
          ...userData,
          onboardingCompleted: true,
          contractSigned: true,
          contractId: contractStatus.contractId
        };
      }
      
      return userData;
    } catch (error) {
      console.error('Error syncing user with contract:', error);
      return userData;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Check if user exists in users collection
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Check if user is deactivated or pending
            if (userData.status === 'deactivated') {
              await firebaseSignOut(auth);
              setUser(null);
              alert('Your account is deactivated. Contact admin.');
              setLoading(false);
              return;
            }

            if (userData.status === 'pending') {
              await firebaseSignOut(auth);
              setUser(null);
              alert('Your account is pending approval. Please wait for admin approval.');
              setLoading(false);
              return;
            }

            // Sync user document with contract status
            const syncedUserData = await syncUserWithContract(firebaseUser.uid, userData);
            
            console.log('🔍 AuthContext - User data loaded:', {
              name: syncedUserData.name,
              email: firebaseUser.email,
              role: syncedUserData.role,
              team: syncedUserData.team,
              idCode: syncedUserData.idCode,
              onboardingCompleted: syncedUserData.onboardingCompleted,
              contractSigned: syncedUserData.contractSigned
            });
            
            setUser({
              uid: firebaseUser.uid,
              name: syncedUserData.name,
              email: firebaseUser.email!,
              photoURL: syncedUserData.photoURL || firebaseUser.photoURL,
              role: syncedUserData.role,
              team: syncedUserData.team,
              skills: syncedUserData.skills || [],
              github: syncedUserData.github,
              linkedin: syncedUserData.linkedin,
              phone: syncedUserData.phone,
              idCode: syncedUserData.idCode,
              isAdmin: syncedUserData.isAdmin || false,
              status: syncedUserData.status,
              createdAt: syncedUserData.createdAt?.toDate() || new Date(),
              onboardingCompleted: syncedUserData.onboardingCompleted || false,
              contractSigned: syncedUserData.contractSigned || false,
              contractId: syncedUserData.contractId,
              companyId: syncedUserData.companyId || undefined,
              roleOnboardingCompleted: syncedUserData.roleOnboardingCompleted || false
            });

            // Check if user needs role onboarding
            if (!syncedUserData.roleOnboardingCompleted && syncedUserData.status === 'active') {
              setShowRoleOnboarding(true);
            }
          } else {
            // If user doc doesn't exist but we're in the middle of code-claim onboarding,
            // do not sign out. Create a lightweight session user so the UI can proceed.
            const pendingCode = sessionStorage.getItem('pending_id_code');
            if (pendingCode) {
              setUser({
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || '',
                email: firebaseUser.email || '',
                photoURL: firebaseUser.photoURL || undefined,
                role: 'dev',
                team: '',
                skills: [],
                github: undefined,
                linkedin: undefined,
                phone: undefined,
                idCode: pendingCode,
                isAdmin: false,
                status: 'active',
                createdAt: new Date(),
                onboardingCompleted: false,
                contractSigned: false,
                companyId: undefined
              });
            } else {
              // Not onboarding: clear session
              await firebaseSignOut(auth);
              setUser(null);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
        // Clear session storage on sign out
        sessionStorage.clear();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    if (auth.currentUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Sync user document with contract status
          const syncedUserData = await syncUserWithContract(auth.currentUser.uid, userData);
          
          setUser({
            uid: auth.currentUser.uid,
            name: syncedUserData.name,
            email: auth.currentUser.email!,
            photoURL: syncedUserData.photoURL || auth.currentUser.photoURL,
            role: syncedUserData.role,
            team: syncedUserData.team,
            skills: syncedUserData.skills || [],
            github: syncedUserData.github,
            linkedin: syncedUserData.linkedin,
            phone: syncedUserData.phone,
            idCode: syncedUserData.idCode,
            isAdmin: syncedUserData.isAdmin || false,
            status: syncedUserData.status,
            createdAt: syncedUserData.createdAt?.toDate() || new Date(),
            onboardingCompleted: syncedUserData.onboardingCompleted || false,
            contractSigned: syncedUserData.contractSigned || false,
            contractId: syncedUserData.contractId,
            companyId: syncedUserData.companyId || undefined,
            roleOnboardingCompleted: syncedUserData.roleOnboardingCompleted || false
          });
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      sessionStorage.clear();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    loading,
    isAdmin: user?.isAdmin || false,
    signOut,
    refreshUser,
    showRoleOnboarding,
    setShowRoleOnboarding
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};