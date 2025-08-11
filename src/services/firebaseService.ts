import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, Project, Announcement, WikiDoc } from '../types';

// Generate random ID code
export const generateIdCode = (): string => {
  const prefix = 'AST';
  const randomNum = Math.floor(Math.random() * 90000) + 10000; // 5-digit number
  return `${prefix}${randomNum}`;
};

// Users (Active and Deactivated Members)
// Create an invitation code only (do NOT create a user document here).
// The actual user document will be created when the invitee signs in and claims the code.
export const createUser = async (userData: Omit<User, 'uid' | 'createdAt'>) => {
  try {
    if (!userData.idCode) {
      throw new Error('idCode is required to create an invitation');
    }
    await setDoc(doc(db, 'id_codes', userData.idCode), {
      used: false,
      assignedName: userData.name,
      assignedTeam: userData.team,
      assignedRole: userData.role,
      createdAt: new Date()
    }, { merge: true });
    return userData.idCode;
  } catch (error) {
    console.error('Error creating invitation code:', error);
    throw error;
  }
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as User[];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const updateUser = async (uid: string, updateData: Partial<User>) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...updateData,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const toggleUserStatus = async (uid: string, newStatus: 'active' | 'deactivated') => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      status: newStatus,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    throw error;
  }
};

export const deleteUser = async (uid: string) => {
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Projects
export const createProject = async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
  try {
    // Validate required fields
    if (!projectData.title || !projectData.description || !projectData.deadline) {
      throw new Error('Missing required project fields');
    }

    // Validate that project has assignments (either assignedTo or assignedTeam)
    if ((!projectData.assignedTo || projectData.assignedTo.length === 0) && !projectData.assignedTeam) {
      throw new Error('Project must be assigned to at least one team member or team');
    }

    // Ensure assignedTo is always an array and filter out invalid values
    const cleanAssignedTo = (projectData.assignedTo || []).filter(id => 
      id && typeof id === 'string' && id.length > 0
    );

    const projectToCreate = {
      ...projectData,
      assignedTo: cleanAssignedTo,
      createdAt: new Date()
    };

    // Remove any undefined values
    Object.keys(projectToCreate).forEach(key => {
      if (projectToCreate[key] === undefined) {
        delete projectToCreate[key];
      }
    });



    const docRef = await addDoc(collection(db, 'projects'), projectToCreate);
    return docRef.id;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export const getProjects = async (): Promise<Project[]> => {
  try {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      deadline: doc.data().deadline?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Project[];
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

export const updateProject = async (projectId: string, updateData: Partial<Project>) => {
  try {
    await updateDoc(doc(db, 'projects', projectId), {
      ...updateData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

export const deleteProject = async (projectId: string) => {
  try {
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// Announcements
export const createAnnouncement = async (announcementData: Omit<Announcement, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'announcements'), {
      ...announcementData,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }
};

export const getAnnouncements = async (): Promise<Announcement[]> => {
  try {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Announcement[];
  } catch (error) {
    console.error('Error fetching announcements:', error);
    throw error;
  }
};

export const updateAnnouncement = async (announcementId: string, updateData: Partial<Announcement>) => {
  try {
    await updateDoc(doc(db, 'announcements', announcementId), {
      ...updateData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    throw error;
  }
};

export const deleteAnnouncement = async (announcementId: string) => {
  try {
    await deleteDoc(doc(db, 'announcements', announcementId));
  } catch (error) {
    console.error('Error deleting announcement:', error);
    throw error;
  }
};

// Wiki Documents
export const createWikiDoc = async (wikiData: Omit<WikiDoc, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'wiki_docs'), {
      ...wikiData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating wiki doc:', error);
    throw error;
  }
};

export const getWikiDocs = async (): Promise<WikiDoc[]> => {
  try {
    const q = query(collection(db, 'wiki_docs'), orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as WikiDoc[];
  } catch (error) {
    console.error('Error fetching wiki docs:', error);
    throw error;
  }
};

// Check if user has signed a contract
export const checkUserContractStatus = async (uid: string): Promise<{ hasContract: boolean; contractId?: string }> => {
  try {
    const contractsRef = collection(db, 'contracts');
    const q = query(contractsRef, where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { hasContract: false };
    }
    
    // Get the most recent contract
    const contracts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort by createdAt to get the most recent
    const sortedContracts = contracts.sort((a, b) => {
      const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
      const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
      return bDate.getTime() - aDate.getTime();
    });
    
    const latestContract = sortedContracts[0];
    
    return {
      hasContract: true,
      contractId: latestContract.id
    };
  } catch (error) {
    console.error('Error checking user contract status:', error);
    return { hasContract: false };
  }
};

// Force complete onboarding for users who already have contracts
export const forceCompleteOnboarding = async (uid: string): Promise<boolean> => {
  try {
    const contractStatus = await checkUserContractStatus(uid);
    
    if (contractStatus.hasContract) {
      await updateUser(uid, {
        onboardingCompleted: true,
        contractSigned: true,
        contractId: contractStatus.contractId,
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error forcing onboarding completion:', error);
    return false;
  }
};

// Get contract by user ID
export const getContractByUserId = async (uid: string) => {
  try {
    const contractsRef = collection(db, 'contracts');
    const q = query(contractsRef, where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Get the most recent contract
    const contracts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort by creation date (newest first)
    const sortedContracts = contracts.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
    
    return sortedContracts[0];
  } catch (error) {
    console.error('Error fetching contract by user ID:', error);
    throw error;
  }
};

// Get contract by contract ID
export const getContractById = async (contractId: string) => {
  try {
    const contractRef = doc(db, 'contracts', contractId);
    const contractSnap = await getDoc(contractRef);
    
    if (contractSnap.exists()) {
      return {
        id: contractSnap.id,
        ...contractSnap.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching contract by ID:', error);
    throw error;
  }
};

export const updateWikiDoc = async (docId: string, updateData: Partial<WikiDoc>) => {
  try {
    await updateDoc(doc(db, 'wiki_docs', docId), {
      ...updateData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating wiki doc:', error);
    throw error;
  }
};

export const deleteWikiDoc = async (docId: string) => {
  try {
    await deleteDoc(doc(db, 'wiki_docs', docId));
  } catch (error) {
    console.error('Error deleting wiki doc:', error);
    throw error;
  }
};

// Team Management Functions
export const createTeam = async (teamData: Omit<Team, 'id' | 'createdAt'>) => {
  try {
    const teamToCreate = {
      ...teamData,
      createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'teams'), teamToCreate);
    return docRef.id;
  } catch (error) {
    console.error('Error creating team:', error);
    throw error;
  }
};

export const getTeams = async (): Promise<Team[]> => {
  try {
    const q = query(collection(db, 'teams'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Team[];
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
};

export const updateTeam = async (teamId: string, updateData: Partial<Team>) => {
  try {
    await updateDoc(doc(db, 'teams', teamId), {
      ...updateData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating team:', error);
    throw error;
    }
};

export const deleteTeam = async (teamId: string) => {
  try {
    await deleteDoc(doc(db, 'teams', teamId));
  } catch (error) {
    console.error('Error deleting team:', error);
    throw error;
  }
};

