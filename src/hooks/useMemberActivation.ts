import { useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './useAuth';

export const useMemberActivation = () => {
  const { user } = useAuth();

  useEffect(() => {
    const activatePendingMember = async () => {
      if (!user?.uid || !user?.employeeID) return;

      try {
        // Check if this employeeID exists in pending_members
        const pendingQuery = query(
          collection(db, 'pending_members'),
          where('employeeID', '==', user.employeeID)
        );
        
        const pendingSnapshot = await getDocs(pendingQuery);
        
        if (!pendingSnapshot.empty) {
          // Found pending member, proceed with activation
          const pendingDoc = pendingSnapshot.docs[0];
          const pendingData = pendingDoc.data();
          
          // Update user document status to active
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            status: 'active',
            role: pendingData.role,
            team: pendingData.team,
            updatedAt: new Date()
          });
          
          // Create active member entry
          const activeRef = doc(db, 'active_members', user.uid);
          await setDoc(activeRef, {
            uid: user.uid,
            name: user.name,
            email: user.email,
            photoURL: user.photoURL || '',
            role: pendingData.role,
            team: pendingData.team,
            employeeID: user.employeeID,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          // Remove from pending_members
          await deleteDoc(pendingDoc.ref);
          
          console.log(`Member ${user.email} activated successfully`);
        }
      } catch (error) {
        console.error('Error activating pending member:', error);
      }
    };

    // Only run activation if user is logged in and has employeeID
    if (user?.uid && user?.employeeID) {
      activatePendingMember();
    }
  }, [user?.uid, user?.email, user?.employeeID]);

  return null; // This hook runs automatically
};
