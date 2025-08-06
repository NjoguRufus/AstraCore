// Script to check and fix admin user role
// Run this script to verify and update admin user role

import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../src/config/firebase';

// Replace with actual admin user ID
const ADMIN_USER_ID = 'your-admin-user-id-here'; // Update this with actual admin user ID

async function checkAndFixAdminRole() {
  try {
    console.log('🔍 Checking admin user role...');
    
    // Get the admin user document
    const adminUserRef = doc(db, 'users', ADMIN_USER_ID);
    const adminUserDoc = await getDoc(adminUserRef);
    
    if (!adminUserDoc.exists()) {
      console.error('❌ Admin user document not found');
      return;
    }
    
    const userData = adminUserDoc.data();
    console.log('📋 Current user data:', userData);
    
    if (userData.role === 'admin') {
      console.log('✅ Admin user already has admin role');
      return;
    }
    
    console.log('🔄 Updating admin user role...');
    
    // Update the admin user's role
    await updateDoc(adminUserRef, {
      role: 'admin',
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Admin user role updated successfully');
    
  } catch (error) {
    console.error('❌ Error updating admin role:', error);
  }
}

// Run the script
checkAndFixAdminRole();
