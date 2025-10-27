import { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocs,
  where,
  limit 
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Activity, 
  TrendingUp, 
  Clock, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Eye,
  BarChart3,
  Calendar,
  Zap,
  Target,
  FileText,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff,
  FileUp,
  Play,
  Pause,
  Circle,
  ArrowRight,
  ExternalLink,
  Image,
  Video,
  File,
  Code,
  DollarSign,
  Megaphone,
  Palette,
  Shield,
  Database,
  ChartBar,
  BookOpen,
  Phone,
  Mail
} from "lucide-react";
import { Button } from "../UI/Button";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  team?: string;
  lastLogin?: any;
  photoURL?: string;
}

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  details?: string;
  timestamp: any;
  category?: string;
}

interface UploadedFile {
  id: string;
  fileName: string;
  fileURL: string;
  fileType: string;
  fileSize?: number;
  description?: string;
  category?: string;
  tags?: string[];
  uploadedBy: string;
  uploadedAt: any;
  status?: string;
}

interface TaskProgress {
  userId: string;
  userName: string;
  role: string;
  currentTask: string;
  progress: number;
  status: 'in-progress' | 'on-hold' | 'complete' | 'pending';
  lastUpload?: string;
  onlineStatus: 'online' | 'idle' | 'offline';
}

interface MemberSnapshot {
  user: User;
  activities: ActivityLog[];
  uploads: UploadedFile[];
  progress: TaskProgress;
}

export default function MemberMonitoring() {
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [contentTasks, setContentTasks] = useState<any[]>([]);
  const [salesLeads, setSalesLeads] = useState<any[]>([]);
  const [contentLeads, setContentLeads] = useState<any[]>([]);
  const [contentIdeas, setContentIdeas] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [signedContracts, setSignedContracts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [filterRole, setFilterRole] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("24");
  
  // Modals
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberSnapshot | null>(null);
  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [commissionAmount, setCommissionAmount] = useState<number>(0);
  const [isEditingCommission, setIsEditingCommission] = useState(false);
  const [showContactOptions, setShowContactOptions] = useState(false);

  // Role mapping
  const roleDisplayNames: Record<string, string> = {
    'admin': 'Administrator',
    'dev': 'Developer',
    'design': 'Content Creator',
    'content-creator': 'Content Creator',
    'cyber': 'Cybersecurity',
    'analyst': 'Analyst',
    'sales': 'Sales Agent',
    'marketing': 'Marketing',
    'campaign': 'Campaign Manager'
  };

  const roleIcons: Record<string, any> = {
    'admin': Shield,
    'dev': Code,
    'design': Palette,
    'content-creator': Palette,
    'cyber': Shield,
    'analyst': Database,
    'sales': DollarSign,
    'marketing': ChartBar,
    'campaign': Megaphone
  };

  const roleColors: Record<string, string> = {
    'admin': 'bg-red-100 text-red-800',
    'dev': 'bg-blue-100 text-blue-800',
    'design': 'bg-purple-100 text-purple-800',
    'content-creator': 'bg-purple-100 text-purple-800',
    'cyber': 'bg-green-100 text-green-800',
    'analyst': 'bg-indigo-100 text-indigo-800',
    'sales': 'bg-orange-100 text-orange-800',
    'marketing': 'bg-pink-100 text-pink-800',
    'campaign': 'bg-yellow-100 text-yellow-800'
  };

  // Load all data with real-time updates
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Set up real-time listeners
        const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
          const usersData = snapshot.docs.map((doc) => ({ 
            id: doc.id, 
            ...doc.data() 
          })) as User[];
          setUsers(usersData);
        });

        const unsubActivities = onSnapshot(
          query(collection(db, "activity_logs"), orderBy("timestamp", "desc"), limit(100)),
          (snapshot) => {
            const activitiesData = snapshot.docs.map((doc) => ({ 
              id: doc.id, 
              ...doc.data() 
            })) as ActivityLog[];
            setActivities(activitiesData);
          }
        );

        const unsubUploads = onSnapshot(
          query(collection(db, "uploaded_files"), orderBy("uploadedAt", "desc"), limit(50)),
          (snapshot) => {
            const uploadsData = snapshot.docs.map((doc) => ({ 
              id: doc.id, 
              ...doc.data() 
            })) as UploadedFile[];
            setUploads(uploadsData);
          }
        );

        const unsubContentTasks = onSnapshot(collection(db, "content_tasks"), (snapshot) => {
          const tasksData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setContentTasks(tasksData);
        });

        const unsubSalesLeads = onSnapshot(collection(db, "sales_leads"), (snapshot) => {
          const leadsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setSalesLeads(leadsData);
        });

        const unsubContentLeads = onSnapshot(collection(db, "content_leads"), (snapshot) => {
          const leadsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          // Store content leads in the state
          setContentLeads(leadsData);
        });

        const unsubContentIdeas = onSnapshot(collection(db, "content_ideas"), (snapshot) => {
          const ideasData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          // Store content ideas in the state
          setContentIdeas(ideasData);
        });

        const unsubCampaigns = onSnapshot(collection(db, "campaigns"), (snapshot) => {
          const campaignsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setCampaigns(campaignsData);
        });

        const unsubProjects = onSnapshot(collection(db, "projects"), (snapshot) => {
          const projectsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setProjects(projectsData);
        });

        // Fetch signed contracts and completed projects
        const unsubContracts = onSnapshot(
          query(collection(db, "contracts"), where("status", "==", "signed")),
          (snapshot) => {
            const contractsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setSignedContracts(contractsData);
          }
        );
        
        // Fetch completed projects to determine successful clients
        const unsubCompletedProjects = onSnapshot(
          query(collection(db, "projects"), where("status", "==", "completed")),
          (snapshot) => {
            const completedProjects = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            // Get client IDs from completed projects
            const clientIds = completedProjects.map(project => project.clientId).filter(Boolean);
            // Fetch clients with completed projects
            if (clientIds.length > 0) {
              const clientsSnapshot = getDocs(collection(db, 'clients'));
              clientsSnapshot.then(docs => {
                const successfulClients = docs.docs
                  .map(doc => ({ id: doc.id, ...doc.data() }))
                  .filter(client => clientIds.includes(client.id));
                setSignedContracts(successfulClients);
              });
            }
          }
        );

        // Fetch clients
        const unsubClients = onSnapshot(collection(db, "clients"), (snapshot) => {
          const clientsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setClients(clientsData);
        });

        setLoading(false);

        return () => {
          unsubUsers();
          unsubActivities();
          unsubUploads();
          unsubContentTasks();
          unsubSalesLeads();
          unsubContentLeads();
          unsubContentIdeas();
          unsubCampaigns();
          unsubProjects();
          unsubContracts();
          unsubCompletedProjects();
          unsubClients();
        };
      } catch (error) {
        console.error("Error loading monitoring data:", error);
        setLoading(false);
      }
    };

    const cleanup = loadData();
    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(unsub => unsub && unsub());
      }
    };
  }, []);

  // Calculate online status
  const getOnlineStatus = (user: User): 'online' | 'idle' | 'offline' => {
    const now = new Date();
    const lastActivity = activities.find(a => a.userId === user.id);
    
    if (!lastActivity) return 'offline';
    
    const activityTime = lastActivity.timestamp?.toDate?.() || new Date(lastActivity.timestamp);
    const minutesDiff = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
    
    if (minutesDiff <= 10) return 'online';
    if (minutesDiff <= 30) return 'idle';
    return 'offline';
  };

  // Calculate progress for each user
  const calculateProgress = (user: User): TaskProgress => {
    const userActivities = activities.filter(a => a.userId === user.id);
    const userUploads = uploads.filter(u => u.uploadedBy === user.id);
    const onlineStatus = getOnlineStatus(user);
    
    let currentTask = "No active task";
    let progress = 0;
    let status: 'in-progress' | 'on-hold' | 'complete' | 'pending' = 'pending';
    let lastUpload = "";

    // Role-specific progress calculation
    switch (user.role) {
      case 'dev':
        const userProjects = projects.filter(p => p.assignedTo?.includes(user.id));
        const completedProjects = userProjects.filter(p => p.status === 'completed');
        progress = userProjects.length > 0 ? (completedProjects.length / userProjects.length) * 100 : 0;
        currentTask = userProjects.find(p => p.status === 'in-progress')?.title || "No active project";
        status = userProjects.some(p => p.status === 'in-progress') ? 'in-progress' : 'complete';
        break;
        
      case 'design':
      case 'content-creator':
        const userTasks = contentTasks.filter(t => t.assignedTo === user.id);
        const completedTasks = userTasks.filter(t => t.status === 'approved');
        progress = userTasks.length > 0 ? (completedTasks.length / userTasks.length) * 100 : 0;
        currentTask = userTasks.find(t => t.status === 'in-progress')?.title || "No active task";
        status = userTasks.some(t => t.status === 'in-progress') ? 'in-progress' : 'complete';
        break;
        
      case 'sales':
      case 'marketing':
        const userLeads = salesLeads.filter(l => l.assignedTo === user.id);
        const convertedLeads = userLeads.filter(l => l.status === 'client');
        progress = userLeads.length > 0 ? (convertedLeads.length / userLeads.length) * 100 : 0;
        currentTask = userLeads.find(l => l.status === 'active')?.companyName || "No active lead";
        status = userLeads.some(l => l.status === 'active') ? 'in-progress' : 'complete';
        break;
        
      case 'campaign':
        const userCampaigns = campaigns.filter(c => c.assignedTo === user.id);
        const completedCampaigns = userCampaigns.filter(c => c.status === 'completed');
        progress = userCampaigns.length > 0 ? (completedCampaigns.length / userCampaigns.length) * 100 : 0;
        currentTask = userCampaigns.find(c => c.status === 'active')?.name || "No active campaign";
        status = userCampaigns.some(c => c.status === 'active') ? 'in-progress' : 'complete';
        break;
    }

    if (userUploads.length > 0) {
      const latestUpload = userUploads[0];
      lastUpload = latestUpload.fileName;
    }

    return {
      userId: user.id,
      userName: user.name,
      role: user.role,
      currentTask,
      progress: Math.round(progress),
      status,
      lastUpload,
      onlineStatus
    };
  };

  // Filter data
  const filteredActivities = activities.filter((activity) => {
    const matchRole = filterRole === "all" || activity.role === filterRole;
    const matchSearch = 
      activity.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.details?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const activityDate = activity.timestamp?.toDate?.() || new Date(activity.timestamp);
    const hoursDiff = Math.floor((Date.now() - activityDate.getTime()) / (1000 * 60 * 60));
    const matchDateRange = hoursDiff <= parseInt(dateRange);
    
    return matchRole && matchSearch && matchDateRange;
  });

  const filteredUploads = uploads.filter((upload) => {
    const matchRole = filterRole === "all" || upload.uploadedBy === filterRole;
    const matchSearch = 
      upload.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      upload.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const uploadDate = upload.uploadedAt?.toDate?.() || new Date(upload.uploadedAt);
    const hoursDiff = Math.floor((Date.now() - uploadDate.getTime()) / (1000 * 60 * 60));
    const matchDateRange = hoursDiff <= parseInt(dateRange);
    
    return matchRole && matchSearch && matchDateRange;
  });

  // Calculate summary statistics
  const activeUsers = users.filter(u => u.status === 'active');
  const onlineUsers = activeUsers.filter(u => getOnlineStatus(u) === 'online').length;
  const idleUsers = activeUsers.filter(u => getOnlineStatus(u) === 'idle').length;
  const offlineUsers = activeUsers.filter(u => getOnlineStatus(u) === 'offline').length;
  
  const allProgress = activeUsers.map(u => calculateProgress(u));
  const avgProgress = allProgress.length > 0 
    ? Math.round(allProgress.reduce((sum, p) => sum + p.progress, 0) / allProgress.length)
    : 0;

  // Handle member click
  const handleMemberClick = (user: User) => {
    const memberSnapshot: MemberSnapshot = {
      user,
      activities: activities.filter(a => a.userId === user.id).slice(0, 10),
      uploads: uploads.filter(u => u.uploadedBy === user.id).slice(0, 5),
      progress: calculateProgress(user)
    };
    setSelectedMember(memberSnapshot);
    setShowMemberModal(true);
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Member Monitoring...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#0B1C48]">Member Monitoring</h2>
            <p className="text-sm text-gray-600">Real-time activity tracking across all teams</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200"
        >
          <div className="flex items-center gap-3 mb-2">
            <Wifi className="w-6 h-6 text-green-600" />
            <span className="text-sm font-medium text-green-700">Online</span>
          </div>
          <p className="text-3xl font-bold text-[#0B1C48]">{onlineUsers}</p>
          <p className="text-xs text-green-600">Active now</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-sm border border-yellow-200"
        >
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">Idle</span>
          </div>
          <p className="text-3xl font-bold text-[#0B1C48]">{idleUsers}</p>
          <p className="text-xs text-yellow-600">Last 30 min</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-2">
            <WifiOff className="w-6 h-6 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Offline</span>
          </div>
          <p className="text-3xl font-bold text-[#0B1C48]">{offlineUsers}</p>
          <p className="text-xs text-gray-600">No activity 24h</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border border-blue-200"
        >
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Avg Progress</span>
          </div>
          <p className="text-3xl font-bold text-[#0B1C48]">{avgProgress}%</p>
          <p className="text-xs text-blue-600">Task completion</p>
        </motion.div>
      </div>

      {/* Filter Bar */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, action, or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              {Object.keys(roleDisplayNames).map((role) => (
                <option key={role} value={role}>
                  {roleDisplayNames[role]}
                </option>
              ))}
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1">Last hour</option>
              <option value="24">Last 24 hours</option>
              <option value="168">Last week</option>
              <option value="720">Last month</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Live Activity Feed */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-[#0B1C48]">Live Activity Feed</h3>
              <div className="ml-auto flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">Live</span>
              </div>
            </div>
          </div>
          <div className="h-[400px] overflow-y-auto p-4">
            <AnimatePresence>
              {filteredActivities.slice(0, 20).map((activity, index) => {
                const RoleIcon = roleIcons[activity.role] || Activity;
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-gray-100 py-3 last:border-b-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 ${roleColors[activity.role]} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <RoleIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-[#0B1C48] text-sm">
                            {activity.userName || 'Unknown User'}
                          </span>
                          <span className={`px-2 py-1 ${roleColors[activity.role]} text-xs rounded-full`}>
                            {roleDisplayNames[activity.role] || activity.role}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">{activity.action}</p>
                        {activity.details && (
                          <p className="text-xs text-gray-500 truncate">{activity.details}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {activity.timestamp?.toDate?.().toLocaleString() || 'Unknown time'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filteredActivities.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No activities found for the selected filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-[#0B1C48]">Progress Tracker</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left font-medium text-gray-700">Member</th>
                  <th className="p-3 text-center font-medium text-gray-700">Role</th>
                  <th className="p-3 text-center font-medium text-gray-700">Progress</th>
                  <th className="p-3 text-center font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {allProgress.slice(0, 15).map((progress) => {
                  const user = users.find(u => u.id === progress.userId);
                  const RoleIcon = roleIcons[progress.role] || Activity;
                  const statusColors = {
                    'in-progress': 'bg-blue-100 text-blue-800',
                    'on-hold': 'bg-yellow-100 text-yellow-800',
                    'complete': 'bg-green-100 text-green-800',
                    'pending': 'bg-gray-100 text-gray-800'
                  };
                  
                  return (
                    <tr key={progress.userId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <RoleIcon className="w-3 h-3 text-blue-600" />
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                              progress.onlineStatus === 'online' ? 'bg-green-500' :
                              progress.onlineStatus === 'idle' ? 'bg-yellow-500' : 'bg-gray-400'
                            }`}></div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-xs">{progress.userName}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[120px]">{progress.currentTask}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 ${roleColors[progress.role]} text-xs rounded-full`}>
                          {roleDisplayNames[progress.role]}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">{progress.progress}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[progress.status]}`}>
                          {progress.status.replace('-', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Successful Clients */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-[#0B1C48]">Successful Clients</h3>
              <span className="ml-auto text-xs text-gray-500">{signedContracts.length} signed</span>
            </div>
          </div>
          <div className="h-[400px] overflow-y-auto p-4">
            <AnimatePresence>
              {signedContracts.map((contract, index) => {
                return (
                  <motion.div
                    key={contract.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 py-3 last:border-b-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <UserCheck className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm truncate">
                            {contract.clientName || contract.name}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Completed
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1 truncate">{contract.company || contract.companyName}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            Commission: KSH {contract.commissionAmount?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {signedContracts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No signed contracts yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Work Management Section */}
      <div className="mt-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#0B1C48]">Work Management</h2>
          <p className="text-sm text-gray-600">Track content, leads, campaigns, and projects across all teams</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* File Uploads Section */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <FileUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-[#0B1C48]">Recent Uploads</h3>
            </div>
          </div>
          <div className="h-[400px] overflow-y-auto p-4">
            <AnimatePresence>
              {filteredUploads.slice(0, 15).map((upload, index) => {
                const uploader = users.find(u => u.id === upload.uploadedBy);
                const fileIcon = upload.fileType?.includes('image') ? Image :
                                upload.fileType?.includes('video') ? Video : File;
                const FileIcon = fileIcon;
                
                return (
                  <motion.div
                    key={upload.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 py-3 last:border-b-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileIcon className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm truncate">
                            {upload.fileName}
                          </span>
                          <span className="text-xs text-gray-500">
                            by {uploader?.name || 'Unknown'}
                          </span>
                        </div>
                        {upload.description && (
                          <p className="text-xs text-gray-600 mb-1 truncate">{upload.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {upload.uploadedAt?.toDate?.().toLocaleString() || 'Unknown time'}
                          </span>
                          <Button
                            onClick={() => window.open(upload.fileURL, '_blank')}
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 p-1 h-auto"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filteredUploads.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No uploads found</p>
              </div>
            )}
          </div>
        </div>

        {/* Content Leads Section */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-[#0B1C48]">Content Leads</h3>
            </div>
          </div>
          <div className="h-[400px] overflow-y-auto p-4">
              <AnimatePresence>
                {contentLeads?.slice(0, 10).map((lead: any, index: number) => {
                  const creator = users.find(u => u.id === lead.assignedTo);
                  return (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 py-3 last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Megaphone className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 text-sm truncate">
                              {lead.leadName || lead.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              by {creator?.name || 'Unknown'}
                            </span>
                          </div>
                          {lead.description && (
                            <p className="text-xs text-gray-600 mb-1 truncate">{lead.description}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              lead.status === 'new' ? 'bg-green-100 text-green-800' :
                              lead.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                              lead.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {lead.status || 'Unknown'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {lead.createdAt?.toDate?.().toLocaleString() || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {(!contentLeads || contentLeads.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Megaphone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No content leads</p>
                </div>
              )}
          </div>
        </div>

        {/* Content Ideas Section */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-[#0B1C48]">Content Ideas</h3>
            </div>
          </div>
          <div className="h-[400px] overflow-y-auto p-4">
              <AnimatePresence>
                {contentIdeas?.slice(0, 10).map((idea: any, index: number) => {
                  const creator = users.find(u => u.id === idea.creatorId);
                  return (
                    <motion.div
                      key={idea.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 py-3 last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 text-sm truncate">
                              {idea.title || idea.idea}
                            </span>
                            {idea.isDone && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Done
                              </span>
                            )}
                          </div>
                          {idea.description && (
                            <p className="text-xs text-gray-600 mb-1 truncate">{idea.description}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              by {creator?.name || 'Unknown'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {idea.createdAt?.toDate?.().toLocaleString() || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {(!contentIdeas || contentIdeas.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No content ideas</p>
                </div>
              )}
          </div>
        </div>

        {/* Sales Leads Section */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-[#0B1C48]">Sales Leads</h3>
            </div>
          </div>
          <div className="h-[400px] overflow-y-auto p-4">
              <AnimatePresence>
                {salesLeads?.slice(0, 10).map((lead: any, index: number) => {
                  const assignee = users.find(u => u.id === lead.assignedTo);
                  return (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 py-3 last:border-b-0 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
                      onClick={() => {
                        setSelectedLead(lead);
                        setShowLeadDetails(true);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 text-sm truncate">
                              {lead.clientName || lead.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              by {assignee?.name || 'Unknown'}
                            </span>
                          </div>
                          {lead.company && (
                            <p className="text-xs text-gray-600 mb-1 truncate">{lead.company}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              lead.status === 'new' ? 'bg-green-100 text-green-800' :
                              lead.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                              lead.status === 'qualified' ? 'bg-yellow-100 text-yellow-800' :
                              lead.status === 'client' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {lead.status || 'Unknown'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {lead.createdAt?.toDate?.().toLocaleString() || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {(!salesLeads || salesLeads.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No sales leads</p>
                </div>
              )}
          </div>
        </div>

        {/* Clients Section */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-[#0B1C48]">Clients</h3>
            </div>
          </div>
          <div className="h-[400px] overflow-y-auto p-4">
              <AnimatePresence>
                {clients?.slice(0, 10).map((client: any, index: number) => {
                  const assignee = users.find(u => u.id === client.assignedTo);
                  return (
                    <motion.div
                      key={client.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 py-3 last:border-b-0 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
                      onClick={() => {
                        setSelectedClient(client);
                        setShowClientDetails(true);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <UserCheck className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 text-sm truncate">
                              {client.clientName || client.name}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              client.status === 'active' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {client.status || 'Active'}
                            </span>
                          </div>
                          {client.company && (
                            <p className="text-xs text-gray-600 mb-1 truncate">{client.company}</p>
                          )}
                          {client.commissionAmount && (
                            <p className="text-xs text-green-600 font-medium mb-1">
                              Commission: KSH {client.commissionAmount.toLocaleString()}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            {assignee && (
                              <span className="text-xs text-gray-400">
                                by {assignee.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {(!clients || clients.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No clients</p>
                </div>
              )}
          </div>
        </div>

        {/* Campaigns Section */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-[#0B1C48]">Campaigns</h3>
            </div>
          </div>
          <div className="h-[400px] overflow-y-auto p-4">
              <AnimatePresence>
                {campaigns?.slice(0, 10).map((campaign: any, index: number) => {
                  return (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 py-3 last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Target className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 text-sm truncate">
                              {campaign.name || campaign.title}
                            </span>
                          </div>
                          {campaign.description && (
                            <p className="text-xs text-gray-600 mb-1 truncate">{campaign.description}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                              campaign.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                              campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              campaign.status === 'paused' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {campaign.status || 'Unknown'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {campaign.createdAt?.toDate?.().toLocaleString() || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {(!campaigns || campaigns.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No campaigns</p>
                </div>
              )}
          </div>
        </div>

        {/* Projects Section */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-pink-600" />
              <h3 className="text-lg font-semibold text-[#0B1C48]">Projects</h3>
            </div>
          </div>
          <div className="h-[400px] overflow-y-auto p-4">
              <AnimatePresence>
                {projects?.slice(0, 10).map((project: any, index: number) => {
                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 py-3 last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Code className="w-4 h-4 text-pink-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 text-sm truncate">
                              {project.title || project.name}
                            </span>
                          </div>
                          {project.description && (
                            <p className="text-xs text-gray-600 mb-1 truncate">{project.description}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              project.status === 'in-progress' ? 'bg-green-100 text-green-800' :
                              project.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                              project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {project.status || 'Unknown'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {project.deadline?.toDate?.().toLocaleDateString() || 'No deadline'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {(!projects || projects.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Code className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No projects</p>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Closing wrapper div */}
      </div>

      {/* Member Snapshot Modal */}
      <AnimatePresence>
        {showMemberModal && selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowMemberModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {selectedMember.user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#0B1C48]">{selectedMember.user.name}</h3>
                      <p className="text-sm text-gray-600">
                        {roleDisplayNames[selectedMember.user.role]} â€¢ {selectedMember.user.team}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowMemberModal(false)}
                    variant="outline"
                    size="sm"
                  >
                    Close
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Activity Summary */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h4>
                    <div className="space-y-2">
                      {selectedMember.activities.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-700">{activity.action}</span>
                          <span className="text-gray-400 text-xs">
                            {activity.timestamp?.toDate?.().toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress Summary */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Progress Summary</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Current Task</span>
                          <span className="font-medium">{selectedMember.progress.currentTask}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${selectedMember.progress.progress}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {selectedMember.progress.progress}% complete
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium">{selectedMember.progress.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Upload:</span>
                          <span className="font-medium">{selectedMember.progress.lastUpload || 'None'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Uploads */}
                {selectedMember.uploads.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Recent Uploads</h4>
                    <div className="space-y-2">
                      {selectedMember.uploads.map((upload) => (
                        <div key={upload.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                          <FileUp className="w-4 h-4 text-green-600" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{upload.fileName}</div>
                            <div className="text-xs text-gray-500">
                              {upload.uploadedAt?.toDate?.().toLocaleString()}
                            </div>
                          </div>
                          <Button
                            onClick={() => window.open(upload.fileURL, '_blank')}
                            variant="ghost"
                            size="sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lead Details Modal */}
      <AnimatePresence>
        {showLeadDetails && selectedLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowLeadDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Lead Details</h3>
                      <p className="text-sm text-green-100">View lead information</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLeadDetails(false)}
                    className="w-8 h-8 rounded-lg bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-colors flex items-center justify-center"
                  >
                    âœ•
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-6">
                  {/* Lead Info */}
                  <div>
                    <h4 className="text-2xl font-bold text-[#0B1C48] mb-2">{selectedLead.clientName || selectedLead.name}</h4>
                    <p className="text-gray-600">{selectedLead.company || 'No company specified'}</p>
                  </div>

                  {/* Contact Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-4 rounded-xl border border-blue-100">
                      <span className="text-xs font-medium text-blue-600 uppercase tracking-wider block mb-1">Email</span>
                      <p className="font-bold text-[#0B1C48] break-all">{selectedLead.email || 'N/A'}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                      <span className="text-xs font-medium text-green-600 uppercase tracking-wider block mb-1">Phone</span>
                      <p className="font-bold text-[#0B1C48]">{selectedLead.phone || 'N/A'}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                      <span className="text-xs font-medium text-purple-600 uppercase tracking-wider block mb-1">Status</span>
                      <p className="font-bold text-[#0B1C48] capitalize">{selectedLead.status || 'N/A'}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100">
                      <span className="text-xs font-medium text-orange-600 uppercase tracking-wider block mb-1">Value</span>
                      <p className="font-bold text-[#0B1C48]">KSH {selectedLead.value?.toLocaleString() || '0'}</p>
                    </div>
                  </div>

                  {/* Contact Actions */}
                  <div className="flex gap-3">
                    {selectedLead.phone && (
                      <a
                        href={`https://wa.me/${selectedLead.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-medium shadow-lg shadow-green-500/30"
                      >
                        <Phone className="w-4 h-4" />
                        WhatsApp
                      </a>
                    )}
                    {selectedLead.email && (
                      <a
                        href={`mailto:${selectedLead.email}`}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-medium shadow-lg shadow-blue-500/30"
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Client Details Modal */}
      <AnimatePresence>
        {showClientDetails && selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowClientDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Client Details</h3>
                      <p className="text-sm text-blue-100">View client information</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowClientDetails(false)}
                    className="w-8 h-8 rounded-lg bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-colors flex items-center justify-center"
                  >
                    âœ•
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-6">
                  {/* Client Info */}
                  <div>
                    <h4 className="text-2xl font-bold text-[#0B1C48] mb-2">{selectedClient.clientName || selectedClient.name}</h4>
                    <p className="text-gray-600">{selectedClient.company || 'No company specified'}</p>
                  </div>

                  {/* Contact Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-4 rounded-xl border border-blue-100">
                      <span className="text-xs font-medium text-blue-600 uppercase tracking-wider block mb-1">Email</span>
                      <p className="font-bold text-[#0B1C48] break-all">{selectedClient.email || 'N/A'}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                      <span className="text-xs font-medium text-green-600 uppercase tracking-wider block mb-1">Phone</span>
                      <p className="font-bold text-[#0B1C48]">{selectedClient.phone || 'N/A'}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                      <span className="text-xs font-medium text-purple-600 uppercase tracking-wider block mb-1">Status</span>
                      <p className="font-bold text-[#0B1C48] capitalize">{selectedClient.status || 'N/A'}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100">
                      <span className="text-xs font-medium text-orange-600 uppercase tracking-wider block mb-1">Last Contact</span>
                      <p className="font-bold text-[#0B1C48]">{selectedClient.lastContact?.toDate?.()?.toLocaleDateString() || 'Never'}</p>
                    </div>
                  </div>

                  {/* Commission Section */}
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl border border-yellow-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-yellow-600 uppercase tracking-wider">Commission</span>
                      <button
                        onClick={() => {
                          setCommissionAmount(selectedClient.commissionAmount || 0);
                          setIsEditingCommission(!isEditingCommission);
                        }}
                        className="text-xs text-yellow-600 hover:text-yellow-700 font-medium"
                      >
                        {isEditingCommission ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                    {isEditingCommission ? (
                      <div className="flex gap-2 items-center">
                        <span className="text-sm text-gray-600">KSH</span>
                        <input
                          type="number"
                          value={commissionAmount}
                          onChange={(e) => setCommissionAmount(parseFloat(e.target.value) || 0)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                        <button
                          onClick={async () => {
                            try {
                              const { doc, updateDoc } = await import('firebase/firestore');
                              const clientRef = doc(db, 'clients', selectedClient.id);
                              await updateDoc(clientRef, { commissionAmount });
                              setIsEditingCommission(false);
                              // Update selectedClient with new commission
                              setSelectedClient({ ...selectedClient, commissionAmount });
                              alert('Commission updated successfully!');
                            } catch (error) {
                              console.error('Error updating commission:', error);
                              alert('Failed to update commission. Please try again.');
                            }
                          }}
                          className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <p className="font-bold text-[#0B1C48] text-lg">
                        KSH {selectedClient.commissionAmount?.toLocaleString() || '0.00'}
                      </p>
                    )}
                  </div>

                  {/* Social Media Links */}
                  {(selectedClient.linkedin || selectedClient.twitter || selectedClient.facebook || selectedClient.instagram) && (
                    <div>
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider block mb-2">Social Media</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedClient.linkedin && (
                          <a href={selectedClient.linkedin} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 transition-colors">
                            LinkedIn
                          </a>
                        )}
                        {selectedClient.twitter && (
                          <a href={selectedClient.twitter} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-sky-100 text-sky-700 rounded-lg text-xs hover:bg-sky-200 transition-colors">
                            Twitter
                          </a>
                        )}
                        {selectedClient.facebook && (
                          <a href={selectedClient.facebook} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 transition-colors">
                            Facebook
                          </a>
                        )}
                        {selectedClient.instagram && (
                          <a href={selectedClient.instagram} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-pink-100 text-pink-700 rounded-lg text-xs hover:bg-pink-200 transition-colors">
                            Instagram
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowContactOptions(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-medium shadow-lg shadow-blue-500/30 flex-1 justify-center"
                    >
                      <Phone className="w-4 h-4" />
                      Contact
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Options Modal */}
      <AnimatePresence>
        {showContactOptions && (selectedClient || selectedLead) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowContactOptions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Options</h3>
                <div className="space-y-3">
                  {(selectedClient || selectedLead)?.phone && (
                    <>
                      <a
                        href={`tel:${(selectedClient || selectedLead).phone.replace(/\D/g, '')}`}
                        className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-medium"
                      >
                        <Phone className="w-5 h-5" />
                        Call
                      </a>
                      <a
                        href={`https://wa.me/${(selectedClient || selectedLead).phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors font-medium"
                      >
                        <Phone className="w-5 h-5" />
                        WhatsApp
                      </a>
                    </>
                  )}
                  {(selectedClient || selectedLead)?.email && (
                    <a
                      href={`mailto:${(selectedClient || selectedLead).email}`}
                      className="flex items-center gap-3 px-4 py-3 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors font-medium"
                    >
                      <Mail className="w-5 h-5" />
                      Email
                    </a>
                  )}
                  <div className="flex gap-3 mt-4">
                    {selectedClient && (
                      <>
                        <button
                          onClick={() => {
                            // Mark as successful client - add to successful clients
                            setShowContactOptions(false);
                          }}
                          className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
                        >
                          Mark as Successful
                        </button>
                        <button
                          onClick={() => {
                            setShowContactOptions(false);
                          }}
                          className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                        >
                          Close
                        </button>
                      </>
                    )}
                    {selectedLead && (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              const { doc, updateDoc, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
                              
                              // Update lead status to client
                              const leadRef = doc(db, 'sales_leads', selectedLead.id);
                              await updateDoc(leadRef, { 
                                status: 'client',
                                updatedAt: serverTimestamp()
                              });
                              
                              // Create client from lead
                              await addDoc(collection(db, 'clients'), {
                                clientName: selectedLead.clientName || selectedLead.name,
                                company: selectedLead.company || '',
                                email: selectedLead.email,
                                phone: selectedLead.phone || '',
                                address: '',
                                industry: '',
                                status: 'active',
                                assignedTo: selectedLead.assignedTo || '',
                                notes: `Converted from lead: ${selectedLead.id}`,
                                lastContact: serverTimestamp(),
                                nextFollowUp: serverTimestamp(),
                                companyId: selectedLead.companyId || '',
                                createdBy: selectedLead.assignedTo || '',
                                commissionAmount: selectedLead.value || 0,
                                createdAt: serverTimestamp()
                              });
                              
                              alert('Lead converted to client successfully!');
                              setShowContactOptions(false);
                            } catch (error) {
                              console.error('Error converting lead:', error);
                              alert('Failed to convert lead. Please try again.');
                            }
                          }}
                          className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                        >
                          Convert to Client
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
                              
                              // Update lead status to closed-lost
                              const leadRef = doc(db, 'sales_leads', selectedLead.id);
                              await updateDoc(leadRef, { 
                                status: 'closed-lost',
                                updatedAt: serverTimestamp()
                              });
                              
                              alert('Lead marked as unsuccessful!');
                              setShowContactOptions(false);
                            } catch (error) {
                              console.error('Error updating lead:', error);
                              alert('Failed to update lead. Please try again.');
                            }
                          }}
                          className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
                        >
                          Mark Unsuccessful
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
