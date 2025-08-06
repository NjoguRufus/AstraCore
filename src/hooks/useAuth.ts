import { useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Get user document from Firestore (users collection)
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Check if this is a pending member that needs activation
            if (userData.status === 'pending' && userData.employeeID) {
              await activatePendingMember(firebaseUser.uid, userData.employeeID, {
                name: userData.name || firebaseUser.displayName || '',
                email: firebaseUser.email || userData.email || '',
                photoURL: userData.photoURL || firebaseUser.photoURL || ''
              });
            }
            
            const mergedUser = {
              uid: firebaseUser.uid,
              name: userData.name || firebaseUser.displayName || '',
              email: firebaseUser.email || userData.email || '',
              photoURL: userData.photoURL || firebaseUser.photoURL || '',
              role: userData.role || '',
              employeeID: userData.employeeID || '',
              team: userData.team || '',
              status: userData.status || 'active',
              createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : userData.createdAt || new Date(),
            };
            setUser(mergedUser);
            console.log('useAuth user:', mergedUser);
          } else {
            // User exists in Firebase Auth but not in Firestore
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};

// Helper function to activate pending member
async function activatePendingMember(uid: string, employeeID: string, userInfo: { name: string; email: string; photoURL?: string }) {
  try {
    // Find the pending member by employeeID
    const pendingQuery = query(
      collection(db, 'pending_members'),
      where('employeeID', '==', employeeID)
    );
    
    const pendingSnapshot = await getDocs(pendingQuery);
    
    if (!pendingSnapshot.empty) {
      const pendingDoc = pendingSnapshot.docs[0];
      const pendingData = pendingDoc.data();
      
      // Update user document status to active
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        status: 'active',
        role: pendingData.role,
        team: pendingData.team,
        updatedAt: new Date()
      });
      
      // Create active member entry
      const activeRef = doc(db, 'active_members', uid);
      await setDoc(activeRef, {
        uid: uid,
        name: userInfo.name,
        email: userInfo.email,
        photoURL: userInfo.photoURL || '',
        role: pendingData.role,
        team: pendingData.team,
        employeeID: employeeID,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Remove from pending_members
      await deleteDoc(pendingDoc.ref);
      
      console.log(`Member ${userInfo.email} activated successfully`);
    }
  } catch (error) {
    console.error('Error activating pending member:', error);
  }
}
