import { doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface MemberData {
  uid: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt?: any;
}

export const approveMember = async (memberData: MemberData) => {
  try {
    // Update user document status to active
    const userRef = doc(db, 'users', memberData.uid);
    await updateDoc(userRef, {
      status: 'active',
      updatedAt: serverTimestamp()
    });

    // Create active member entry
    const activeRef = doc(db, 'active_members', memberData.uid);
    await setDoc(activeRef, {
      name: memberData.name,
      email: memberData.email,
      role: memberData.role,
      status: 'active',
      createdAt: memberData.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Remove from pending members
    const pendingRef = doc(db, 'pending_members', memberData.uid);
    await deleteDoc(pendingRef);

    return { success: true, message: 'Member approved successfully' };
  } catch (error) {
    console.error('Error approving member:', error);
    return { success: false, message: 'Failed to approve member' };
  }
};

export const rejectMember = async (memberId: string) => {
  try {
    // Update user document status to rejected
    const userRef = doc(db, 'users', memberId);
    await updateDoc(userRef, {
      status: 'rejected',
      updatedAt: serverTimestamp()
    });

    // Remove from pending members
    const pendingRef = doc(db, 'pending_members', memberId);
    await deleteDoc(pendingRef);

    return { success: true, message: 'Member rejected successfully' };
  } catch (error) {
    console.error('Error rejecting member:', error);
    return { success: false, message: 'Failed to reject member' };
  }
};

export const getPendingMembers = async () => {
  // This would be used in the admin dashboard to fetch pending members
  // Implementation depends on your data fetching pattern
};

export const getActiveMembers = async () => {
  // This would be used in the admin dashboard to fetch active members
  // Implementation depends on your data fetching pattern
};
