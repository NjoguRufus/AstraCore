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
  orderBy,
  serverTimestamp,
  limit,
  startAfter,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, Project, Announcement, WikiDoc, Task, Company, CompanySettings, Notification, AuditLog, Subscription, Analytics } from '../types';

// Generate random ID code
export const generateIdCode = (): string => {
  const prefix = 'AST';
  const randomNum = Math.floor(Math.random() * 90000) + 10000; // 5-digit number
  return `${prefix}${randomNum}`;
};

// Company Management
export const createCompany = async (companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'companies'), {
      ...companyData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
};

export const getCompany = async (companyId: string): Promise<Company | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'companies', companyId));
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date()
      } as Company;
    }
    return null;
  } catch (error) {
    console.error('Error fetching company:', error);
    throw error;
  }
};

export const updateCompany = async (companyId: string, updateData: Partial<Company>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'companies', companyId), {
      ...updateData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
};

// Company Settings
export const getCompanySettings = async (companyId: string): Promise<CompanySettings | null> => {
  try {
    const q = query(collection(db, 'company_settings'), where('companyId', '==', companyId), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as CompanySettings;
    }
    return null;
  } catch (error) {
    console.error('Error fetching company settings:', error);
    throw error;
  }
};

export const updateCompanySettings = async (companyId: string, settings: Partial<CompanySettings>): Promise<void> => {
  try {
    const existingSettings = await getCompanySettings(companyId);
    if (existingSettings) {
      await updateDoc(doc(db, 'company_settings', existingSettings.id), {
        ...settings,
        updatedAt: new Date()
      });
    } else {
      await addDoc(collection(db, 'company_settings'), {
        companyId,
        ...settings,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error updating company settings:', error);
    throw error;
  }
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

export const getUsers = async (companyId: string): Promise<User[]> => {
  try {
    const q = query(collection(db, 'users'), where('companyId', '==', companyId));
    const querySnapshot = await getDocs(q);
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

export const getProjects = async (companyId: string): Promise<Project[]> => {
  try {
    const q = query(
      collection(db, 'projects'), 
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      deadline: doc.data().deadline?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      completedAt: doc.data().completedAt?.toDate() || undefined
    })) as Project[];
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

export const updateProject = async (projectId: string, updateData: Partial<Project>) => {
  try {
    // If marking as completed, add completion timestamp and user
    if (updateData.status === 'completed') {
      updateData.completedAt = new Date();
      // Note: completedBy will be set by the calling function
    }
    
    await updateDoc(doc(db, 'projects', projectId), {
      ...updateData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

// Special function for completing projects with user tracking
export const completeProject = async (projectId: string, completedBy: string) => {
  try {
    await updateDoc(doc(db, 'projects', projectId), {
      status: 'completed',
      completedAt: new Date(),
      completedBy: completedBy,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error completing project:', error);
    throw error;
  }
};

// Function for admins to reset completed projects
export const resetCompletedProject = async (projectId: string) => {
  try {
    await updateDoc(doc(db, 'projects', projectId), {
      status: 'upcoming',
      completedAt: null,
      completedBy: null,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error resetting project:', error);
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

export const getAnnouncements = async (companyId: string): Promise<Announcement[]> => {
  try {
    const q = query(
      collection(db, 'announcements'), 
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc')
    );
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

// Tasks - New functionality
export const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'tasks'), {
      ...taskData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const getTasks = async (companyId: string, userId?: string): Promise<Task[]> => {
  try {
    let q;
    if (userId) {
      q = query(
        collection(db, 'tasks'), 
        where('companyId', '==', companyId),
        where('assignedTo', '==', userId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'tasks'), 
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dueDate: doc.data().dueDate?.toDate() || undefined,
      completedAt: doc.data().completedAt?.toDate() || undefined,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Task[];
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const updateTask = async (taskId: string, updateData: Partial<Task>): Promise<void> => {
  try {
    if (updateData.status === 'completed') {
      updateData.completedAt = new Date();
    }
    
    await updateDoc(doc(db, 'tasks', taskId), {
      ...updateData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// Notifications
export const createNotification = async (notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...notificationData,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const getNotifications = async (companyId: string, userId: string): Promise<Notification[]> => {
  try {
    const q = query(
      collection(db, 'notifications'), 
      where('companyId', '==', companyId),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      readAt: doc.data().readAt?.toDate() || undefined
    })) as Notification[];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      isRead: true,
      readAt: new Date()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (companyId: string, userId: string): Promise<void> => {
  try {
    const notifications = await getNotifications(companyId, userId);
    const unreadNotifications = notifications.filter(n => !n.isRead);
    
    const batch = writeBatch(db);
    unreadNotifications.forEach(notification => {
      const ref = doc(db, 'notifications', notification.id);
      batch.update(ref, {
        isRead: true,
        readAt: new Date()
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Audit Logs
export const createAuditLog = async (auditData: Omit<AuditLog, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'audit_logs'), {
      ...auditData,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating audit log:', error);
    throw error;
  }
};

export const getAuditLogs = async (companyId: string, limit: number = 100): Promise<AuditLog[]> => {
  try {
    const q = query(
      collection(db, 'audit_logs'), 
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc'),
      limit(limit)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as AuditLog[];
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};

// Analytics
export const getAnalytics = async (companyId: string, days: number = 30): Promise<Analytics[]> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const q = query(
      collection(db, 'analytics'), 
      where('companyId', '==', companyId),
      where('date', '>=', startDate.toISOString().split('T')[0]),
      where('date', '<=', endDate.toISOString().split('T')[0]),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Analytics[];
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
};

export const generateDailyAnalytics = async (companyId: string): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if analytics already exist for today
    const existingQ = query(
      collection(db, 'analytics'), 
      where('companyId', '==', companyId),
      where('date', '==', today)
    );
    const existingSnapshot = await getDocs(existingQ);
    
    if (!existingSnapshot.empty) {
      return; // Analytics already generated for today
    }
    
    // Get company data
    const [users, projects, tasks] = await Promise.all([
      getUsers(companyId),
      getProjects(companyId),
      getTasks(companyId)
    ]);
    
    const activeUsers = users.filter(u => u.status === 'active');
    const completedProjects = projects.filter(p => p.status === 'completed');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    // Calculate average task completion time
    let totalCompletionTime = 0;
    let completedTasksWithTime = 0;
    
    completedTasks.forEach(task => {
      if (task.completedAt && task.createdAt) {
        const completionTime = task.completedAt.getTime() - task.createdAt.getTime();
        totalCompletionTime += completionTime;
        completedTasksWithTime++;
      }
    });
    
    const averageTaskCompletionTime = completedTasksWithTime > 0 
      ? totalCompletionTime / (completedTasksWithTime * 3600000) // Convert to hours
      : 0;
    
    // Calculate member activity scores
    const memberActivity: Record<string, number> = {};
    users.forEach(user => {
      const userTasks = tasks.filter(t => t.assignedTo === user.uid);
      const completedUserTasks = userTasks.filter(t => t.status === 'completed');
      const userProjects = projects.filter(p => p.assignedTo.includes(user.uid));
      const completedUserProjects = userProjects.filter(p => p.status === 'completed');
      
      memberActivity[user.uid] = (completedUserTasks.length * 2) + (completedUserProjects.length * 5);
    });
    
    const analytics: Omit<Analytics, 'id'> = {
      companyId,
      date: today,
      metrics: {
        totalMembers: users.length,
        activeMembers: activeUsers.length,
        totalProjects: projects.length,
        completedProjects: completedProjects.length,
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        averageTaskCompletionTime,
        memberActivity
      },
      createdAt: new Date()
    };
    
    await addDoc(collection(db, 'analytics'), analytics);
  } catch (error) {
    console.error('Error generating daily analytics:', error);
    throw error;
  }
};

// Subscription Management
export const getSubscription = async (companyId: string): Promise<Subscription | null> => {
  try {
    const q = query(collection(db, 'subscriptions'), where('companyId', '==', companyId), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        currentPeriodStart: doc.data().currentPeriodStart?.toDate() || new Date(),
        currentPeriodEnd: doc.data().currentPeriodEnd?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as Subscription;
    }
    return null;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }
};

export const createSubscription = async (subscriptionData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'subscriptions'), {
      ...subscriptionData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

export const updateSubscription = async (subscriptionId: string, updateData: Partial<Subscription>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'subscriptions', subscriptionId), {
      ...updateData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

