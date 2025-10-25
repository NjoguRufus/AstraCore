import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc, 
  addDoc, 
  deleteDoc,
  limit,
  serverTimestamp 
} from "firebase/firestore";
import { db } from '../config/firebase';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  Trash2, 
  Search,
  TrendingUp,
  FileText,
  Image,
  Video,
  Download,
  Bell,
  BarChart3,
  Zap,
  Palette,
  Layers,
  Target,
  Lightbulb,
  User,
  Edit,
  Star,
  Filter,
  Grid,
  List,
  Settings
} from "lucide-react";

const ContentDashboard = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [contentIdeas, setContentIdeas] = useState<any[]>([]);
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [showCreateIdeaModal, setShowCreateIdeaModal] = useState(false);
  const [fileViewMode, setFileViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setUser(currentUser);

    // Fetch tasks
    const tasksQuery = query(
      collection(db, "content_tasks"),
      where("assignedTo", "==", currentUser.uid)
    );

    const unsub = onSnapshot(tasksQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTasks(data);
      setLoading(false);
    });

    // Fetch notifications
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", currentUser.uid),
      limit(10)
    );

    const unsubNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotifications(data);
    });

    // Fetch recent activity
    const activityQuery = query(
      collection(db, "activity_logs"),
      where("userId", "==", currentUser.uid),
      limit(5)
    );

    const unsubActivity = onSnapshot(activityQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRecentActivity(data);
    });

    // Fetch leads
    const leadsQuery = query(
      collection(db, "content_leads"),
      where("assignedTo", "==", currentUser.uid)
    );

    const unsubLeads = onSnapshot(leadsQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLeads(data);
    });

    // Fetch content ideas
    const ideasQuery = query(
      collection(db, "content_ideas"),
      where("creatorId", "==", currentUser.uid)
    );

    const unsubIdeas = onSnapshot(ideasQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setContentIdeas(data);
    });

    // Fetch uploaded files
    const filesQuery = query(
      collection(db, "uploaded_files"),
      where("uploadedBy", "==", currentUser.uid)
    );

    const unsubFiles = onSnapshot(filesQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUploadedFiles(data);
    });

    // Calculate analytics
    calculateAnalytics();

    return () => {
      unsub();
      unsubNotifications();
      unsubActivity();
      unsubLeads();
      unsubIdeas();
      unsubFiles();
    };
  }, []);

  const calculateAnalytics = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "approved").length;
    const pendingTasks = tasks.filter(t => t.status === "pending-review").length;
    const inProgressTasks = tasks.filter(t => t.status === "in-progress").length;
    const overdueTasks = tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== "approved").length;

    setAnalytics({
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      productivityScore: calculateProductivityScore()
    });
  };

  const calculateProductivityScore = () => {
    if (tasks.length === 0) return 0;
    
    const score = Math.min(100, Math.max(0, 
      (analytics.completedTasks / Math.max(analytics.totalTasks, 1) * 40) +
      ((analytics.totalTasks - analytics.overdueTasks) / Math.max(analytics.totalTasks, 1) * 60)
    ));
    return Math.round(score);
  };

  const handleTaskFileUpload = async (taskId: string, e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'astraronix_content');

      const response = await fetch('https://api.cloudinary.com/v1_1/demo/image/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.secure_url) {
        await updateDoc(doc(db, "content_tasks", taskId), {
          fileURL: result.secure_url,
          status: "pending-review",
          uploadHistory: [
            {
              fileName: file.name,
              uploadedAt: new Date(),
              fileURL: result.secure_url
            }
          ],
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateTask = async (taskData: any) => {
    try {
      await addDoc(collection(db, "content_tasks"), {
        ...taskData,
        assignedTo: user.uid,
        status: "in-progress",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        uploadHistory: []
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "content_tasks", taskId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, "content_tasks", taskId));
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleCreateLead = async (leadData: any) => {
    try {
      await addDoc(collection(db, "content_leads"), {
        ...leadData,
        assignedTo: user.uid,
        status: "new",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setShowCreateLeadModal(false);
    } catch (error) {
      console.error("Failed to create lead:", error);
    }
  };

  const handleCreateIdea = async (ideaData: any) => {
    try {
      await addDoc(collection(db, "content_ideas"), {
        ...ideaData,
        creatorId: user.uid,
        isDone: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setShowCreateIdeaModal(false);
    } catch (error) {
      console.error("Failed to create idea:", error);
    }
  };

  const handleToggleIdea = async (ideaId: string, isDone: boolean) => {
    try {
      await updateDoc(doc(db, "content_ideas", ideaId), {
        isDone: !isDone,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to update idea:", error);
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "content_leads", leadId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to update lead:", error);
    }
  };

  const handleFileUpload = async (fileData: any) => {
    try {
      setUploading(true);
      
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', fileData.file);
      formData.append('upload_preset', 'astraronix_content');
      
      const response = await fetch('https://api.cloudinary.com/v1_1/demo/image/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.secure_url) {
        // Save file metadata to Firestore
        await addDoc(collection(db, "uploaded_files"), {
          fileName: fileData.file.name,
          fileURL: result.secure_url,
          fileType: fileData.file.type,
          fileSize: fileData.file.size,
          description: fileData.description,
          category: fileData.category,
          tags: fileData.tags || [],
          uploadedBy: user.uid,
          uploadedAt: serverTimestamp(),
          status: 'active'
        });
        
        setShowUploadModal(false);
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
    } finally {
      setUploading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "approved").length,
    pending: tasks.filter((t) => t.status === "pending-review").length,
    active: tasks.filter((t) => t.status === "in-progress").length,
    overdue: tasks.filter((t) => new Date(t.deadline) < new Date() && t.status !== "approved").length,
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'tasks', label: 'My Tasks', icon: FileText },
    { id: 'leads', label: 'Leads', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'files', label: 'Files', icon: Image },
    { id: 'ideas', label: 'Content Ideas', icon: Lightbulb },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-sky-100">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-3xl font-bold text-[#0B1C48] flex items-center gap-3">
                <Palette className="w-8 h-8 text-sky-500" />
                Content Creator Studio
              </h1>
              <p className="text-sky-600 mt-1">Welcome back, {user?.name || user?.email || "Creator"} 🎨</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-sky-50 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-sky-700">Productivity Score: {analytics.productivityScore || 0}%</span>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Task
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-sky-500 text-sky-600 bg-sky-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                      <p className="text-2xl font-bold text-[#0B1C48]">{stats.total}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">In Progress</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.active}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Overdue</p>
                      <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-[#0B1C48] mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-3 p-4 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-[#0B1C48]">Create New Task</h3>
                      <p className="text-sm text-gray-500">Start a new content project</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('files')}
                    className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-[#0B1C48]">Upload Files</h3>
                      <p className="text-sm text-gray-500">Add images, videos, or documents</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('tasks')}
                    className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-[#0B1C48]">Schedule Content</h3>
                      <p className="text-sm text-gray-500">Manage your content calendar</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Productivity Insights */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-[#0B1C48] mb-6">Productivity Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-sky-600 mb-2">{stats.completed}</div>
                    <div className="text-sm text-gray-600">Tasks completed today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">2.5h</div>
                    <div className="text-sm text-gray-600">Average completion time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">92%</div>
                    <div className="text-sm text-gray-600">Success rate</div>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Productivity Progress</span>
                    <span className="text-sm text-gray-500">{analytics.productivityScore || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-sky-500 to-sky-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${analytics.productivityScore || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#0B1C48]">My Tasks</h2>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New Task
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="in-progress">In Progress</option>
                    <option value="pending-review">Pending Review</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>

                <div className="space-y-4">
                  {filteredTasks.map((task, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-[#0B1C48]">{task.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {task.deadline}
                            </span>
                            <span className="flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              {task.type}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              task.status === "approved" ? "bg-green-100 text-green-700" :
                              task.status === "pending-review" ? "bg-yellow-100 text-yellow-700" :
                              "bg-blue-100 text-blue-700"
                            }`}>
                              {task.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setShowTaskDetails(true);
                            }}
                            className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <label className="p-1 hover:bg-gray-100 rounded cursor-pointer">
                            <Upload className="w-4 h-4 text-sky-600" />
                            <input
                              type="file"
                              accept="image/*,video/*"
                              onChange={(e) => handleTaskFileUpload(task.id, e)}
                              className="hidden"
                            />
                          </label>
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, "approved")}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {uploading && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-sky-600">
                          <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Uploading file...</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {filteredTasks.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No tasks found</h3>
                    <p className="text-gray-500 mb-4">Create your first task to get started</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors"
                    >
                      Create Task
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'leads' && (
            <motion.div
              key="leads"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#0B1C48]">Content Leads</h2>
                  <button
                    onClick={() => setShowCreateLeadModal(true)}
                    className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New Lead
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {leads.map((lead, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-[#0B1C48]">{lead.clientName}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          lead.status === "new" ? "bg-blue-100 text-blue-700" :
                          lead.status === "contacted" ? "bg-yellow-100 text-yellow-700" :
                          lead.status === "qualified" ? "bg-green-100 text-green-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {lead.status}
                        </span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600">{lead.description}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Target className="w-4 h-4" />
                          <span>{lead.projectType}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{lead.deadline}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateLeadStatus(lead.id, "contacted")}
                          className="flex-1 bg-sky-50 text-sky-600 py-2 rounded-lg hover:bg-sky-100 transition-colors text-sm"
                        >
                          Contact
                        </button>
                        <button
                          onClick={() => handleUpdateLeadStatus(lead.id, "qualified")}
                          className="flex-1 bg-green-50 text-green-600 py-2 rounded-lg hover:bg-green-100 transition-colors text-sm"
                        >
                          Qualify
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {leads.length === 0 && (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No leads yet</h3>
                    <p className="text-gray-500 mb-4">Start by creating your first content lead</p>
                    <button
                      onClick={() => setShowCreateLeadModal(true)}
                      className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors"
                    >
                      Create Lead
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-[#0B1C48] mb-6">Analytics Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Total Projects</p>
                        <p className="text-2xl font-bold text-blue-700">{analytics.totalTasks || 0}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600">Completed</p>
                        <p className="text-2xl font-bold text-green-700">{analytics.completedTasks || 0}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-yellow-600">In Progress</p>
                        <p className="text-2xl font-bold text-yellow-700">{analytics.inProgressTasks || 0}</p>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-600" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600">Success Rate</p>
                        <p className="text-2xl font-bold text-purple-700">{analytics.productivityScore || 0}%</p>
                      </div>
                      <Zap className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'files' && (
            <motion.div
              key="files"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#0B1C48]">File Management</h2>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload File
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setFileViewMode('grid')}
                        className={`p-2 rounded-lg ${fileViewMode === 'grid' ? 'bg-sky-100 text-sky-600' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setFileViewMode('list')}
                        className={`p-2 rounded-lg ${fileViewMode === 'list' ? 'bg-sky-100 text-sky-600' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-400" />
                      <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent">
                        <option value="all">All Files</option>
                        <option value="images">Images</option>
                        <option value="videos">Videos</option>
                        <option value="documents">Documents</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Combined Files Display */}
                {fileViewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Task Files */}
                    {tasks.filter(t => t.fileURL).map((task, i) => (
                      <div key={`task-${i}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center relative group">
                          <Image className="w-8 h-8 text-gray-400" />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                            <button className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all">
                              <Eye className="w-4 h-4 text-gray-700" />
                            </button>
                          </div>
                        </div>
                        <h3 className="font-medium text-[#0B1C48] mb-1">{task.title}</h3>
                        <p className="text-sm text-gray-500 mb-2">{task.type}</p>
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                          <span>{task.uploadHistory?.[0]?.fileName || 'Unknown file'}</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Task File</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => window.open(task.fileURL, '_blank')}
                            className="flex-1 bg-sky-50 text-sky-600 py-2 rounded-lg hover:bg-sky-100 transition-colors text-sm flex items-center justify-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </button>
                          <button 
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = task.fileURL;
                              link.download = task.uploadHistory?.[0]?.fileName || 'download';
                              link.click();
                            }}
                            className="flex-1 bg-gray-50 text-gray-600 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm flex items-center justify-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Direct Uploaded Files */}
                    {uploadedFiles.map((file, i) => (
                      <div key={`file-${i}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center relative group">
                          {file.fileType?.startsWith('image/') ? (
                            <img src={file.fileURL} alt={file.fileName} className="w-full h-full object-cover rounded-lg" />
                          ) : file.fileType?.startsWith('video/') ? (
                            <Video className="w-8 h-8 text-gray-400" />
                          ) : (
                            <Image className="w-8 h-8 text-gray-400" />
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                            <button className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all">
                              <Eye className="w-4 h-4 text-gray-700" />
                            </button>
                          </div>
                        </div>
                        <h3 className="font-medium text-[#0B1C48] mb-1">{file.fileName}</h3>
                        <p className="text-sm text-gray-500 mb-2">{file.description || 'No description'}</p>
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                          <span>{file.category}</span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Direct Upload</span>
                        </div>
                        {file.tags && file.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {file.tags.map((tag: string, tagIndex: number) => (
                              <span key={tagIndex} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => window.open(file.fileURL, '_blank')}
                            className="flex-1 bg-sky-50 text-sky-600 py-2 rounded-lg hover:bg-sky-100 transition-colors text-sm flex items-center justify-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </button>
                          <button 
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = file.fileURL;
                              link.download = file.fileName;
                              link.click();
                            }}
                            className="flex-1 bg-gray-50 text-gray-600 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm flex items-center justify-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Task Files List View */}
                    {tasks.filter(t => t.fileURL).map((task, i) => (
                      <div key={`task-${i}`} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Image className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-[#0B1C48]">{task.title}</h3>
                          <p className="text-sm text-gray-500">{task.type} • {task.uploadHistory?.[0]?.fileName || 'Unknown file'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Task File</span>
                          <button 
                            onClick={() => window.open(task.fileURL, '_blank')}
                            className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = task.fileURL;
                              link.download = task.uploadHistory?.[0]?.fileName || 'download';
                              link.click();
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Direct Uploaded Files List View */}
                    {uploadedFiles.map((file, i) => (
                      <div key={`file-${i}`} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {file.fileType?.startsWith('image/') ? (
                            <img src={file.fileURL} alt={file.fileName} className="w-full h-full object-cover rounded-lg" />
                          ) : file.fileType?.startsWith('video/') ? (
                            <Video className="w-6 h-6 text-gray-400" />
                          ) : (
                            <Image className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-[#0B1C48]">{file.fileName}</h3>
                          <p className="text-sm text-gray-500">{file.description || 'No description'} • {file.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Direct Upload</span>
                          <button 
                            onClick={() => window.open(file.fileURL, '_blank')}
                            className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = file.fileURL;
                              link.download = file.fileName;
                              link.click();
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {tasks.filter(t => t.fileURL).length === 0 && uploadedFiles.length === 0 && (
                  <div className="text-center py-12">
                    <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No files uploaded yet</h3>
                    <p className="text-gray-500 mb-4">Upload files directly or through tasks to see them here</p>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors"
                    >
                      Upload Your First File
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'ideas' && (
            <motion.div
              key="ideas"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#0B1C48]">Content Ideas</h2>
                  <button
                    onClick={() => setShowCreateIdeaModal(true)}
                    className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New Idea
                  </button>
                </div>

                <div className="space-y-4">
                  {contentIdeas.map((idea, i) => (
                    <div key={i} className={`border rounded-lg p-4 transition-all duration-200 ${
                      idea.isDone ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:shadow-md'
                    }`}>
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => handleToggleIdea(idea.id, idea.isDone)}
                          className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            idea.isDone 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-300 hover:border-sky-400'
                          }`}
                        >
                          {idea.isDone && <CheckCircle className="w-4 h-4" />}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className={`font-medium ${idea.isDone ? 'text-green-700 line-through' : 'text-[#0B1C48]'}`}>
                              {idea.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                idea.category === "social" ? "bg-blue-100 text-blue-700" :
                                idea.category === "blog" ? "bg-green-100 text-green-700" :
                                idea.category === "video" ? "bg-purple-100 text-purple-700" :
                                "bg-gray-100 text-gray-700"
                              }`}>
                                {idea.category}
                              </span>
                              <span className="text-xs text-gray-400">
                                {idea.createdAt?.toDate?.()?.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <p className={`text-sm mb-3 ${idea.isDone ? 'text-green-600' : 'text-gray-600'}`}>
                            {idea.description}
                          </p>
                          {idea.tags && idea.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {idea.tags.map((tag: string, tagIndex: number) => (
                                <span key={tagIndex} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {contentIdeas.length === 0 && (
                  <div className="text-center py-12">
                    <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No content ideas yet</h3>
                    <p className="text-gray-500 mb-4">Start brainstorming and capture your creative ideas</p>
                    <button
                      onClick={() => setShowCreateIdeaModal(true)}
                      className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors"
                    >
                      Create First Idea
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-[#0B1C48] mb-6">Profile Settings</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Profile Info */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-[#0B1C48] mb-4">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                          <input
                            type="text"
                            defaultValue={user?.name || user?.email || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            defaultValue={user?.email || ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <input
                            type="text"
                            defaultValue="Content Creator"
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
                          <input
                            type="text"
                            defaultValue={user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-[#0B1C48] mb-4">Bio & Skills</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                          <textarea
                            rows={4}
                            placeholder="Tell us about yourself and your creative journey..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                          <input
                            type="text"
                            placeholder="Design, Photography, Video Editing, etc."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-[#0B1C48] mb-4">Preferences</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Content Types</label>
                          <div className="flex flex-wrap gap-2">
                            {['Social Media', 'Web Design', 'Video', 'Graphics', 'Branding'].map((type) => (
                              <label key={type} className="flex items-center gap-2">
                                <input type="checkbox" className="rounded" />
                                <span className="text-sm">{type}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notification Preferences</label>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2">
                              <input type="checkbox" defaultChecked className="rounded" />
                              <span className="text-sm">Email notifications for new tasks</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input type="checkbox" defaultChecked className="rounded" />
                              <span className="text-sm">Weekly productivity reports</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input type="checkbox" className="rounded" />
                              <span className="text-sm">Marketing updates and tips</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Stats */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-[#0B1C48] mb-4">Profile Stats</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Tasks Completed</span>
                          <span className="text-2xl font-bold text-sky-600">{stats.completed}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Active Projects</span>
                          <span className="text-2xl font-bold text-blue-600">{stats.active}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Content Ideas</span>
                          <span className="text-2xl font-bold text-purple-600">{contentIdeas.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Leads Generated</span>
                          <span className="text-2xl font-bold text-green-600">{leads.length}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-[#0B1C48] mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                          <Edit className="w-5 h-5 text-sky-500" />
                          <span>Edit Profile</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                          <Star className="w-5 h-5 text-sky-500" />
                          <span>View Portfolio</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                          <Settings className="w-5 h-5 text-sky-500" />
                          <span>Account Settings</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button className="bg-sky-500 text-white px-6 py-2 rounded-lg hover:bg-sky-600 transition-colors">
                    Save Changes
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-[#0B1C48] mb-6">Notifications</h2>
                <div className="space-y-4">
                  {notifications.map((notification, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                        <Bell className="w-5 h-5 text-sky-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-[#0B1C48]">{notification.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">{notification.createdAt?.toDate?.()?.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {notifications.length === 0 && (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No notifications</h3>
                    <p className="text-gray-500">You're all caught up!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[#0B1C48] mb-4">Create New Task</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleCreateTask({
                title: formData.get('title'),
                description: formData.get('description'),
                type: formData.get('type'),
                priority: formData.get('priority'),
                deadline: formData.get('deadline')
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                  <input
                    name="title"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Enter task title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Describe the task"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      name="type"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    >
                      <option value="Social Media">Social Media</option>
                      <option value="Web Design">Web Design</option>
                      <option value="Video">Video</option>
                      <option value="Graphics">Graphics</option>
                      <option value="Content Writing">Content Writing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      name="priority"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <input
                    name="deadline"
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {showTaskDetails && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#0B1C48]">Task Details</h3>
              <button
                onClick={() => setShowTaskDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-[#0B1C48]">{selectedTask.title}</h4>
                <p className="text-gray-600 mt-1">{selectedTask.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Type</span>
                  <p className="font-medium">{selectedTask.type}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Priority</span>
                  <p className="font-medium">{selectedTask.priority}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Deadline</span>
                  <p className="font-medium">{selectedTask.deadline}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Status</span>
                  <p className="font-medium">{selectedTask.status}</p>
                </div>
              </div>
              {selectedTask.fileURL && (
                <div>
                  <span className="text-sm text-gray-500">Uploaded File</span>
                  <div className="mt-2">
                    <a
                      href={selectedTask.fileURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:text-sky-700 underline"
                    >
                      {selectedTask.uploadHistory?.[0]?.fileName || 'View File'}
                    </a>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  handleUpdateTaskStatus(selectedTask.id, "approved");
                  setShowTaskDetails(false);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  handleUpdateTaskStatus(selectedTask.id, "pending-review");
                  setShowTaskDetails(false);
                }}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  handleDeleteTask(selectedTask.id);
                  setShowTaskDetails(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      {showCreateLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[#0B1C48] mb-4">Create New Lead</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleCreateLead({
                clientName: formData.get('clientName'),
                description: formData.get('description'),
                projectType: formData.get('projectType'),
                deadline: formData.get('deadline'),
                contactInfo: formData.get('contactInfo')
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                  <input
                    name="clientName"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Describe the project"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                    <select
                      name="projectType"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    >
                      <option value="Social Media">Social Media</option>
                      <option value="Website Design">Website Design</option>
                      <option value="Video Production">Video Production</option>
                      <option value="Branding">Branding</option>
                      <option value="Content Strategy">Content Strategy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                    <input
                      name="deadline"
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info</label>
                  <input
                    name="contactInfo"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Email or phone number"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateLeadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                >
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Content Idea Modal */}
      {showCreateIdeaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[#0B1C48] mb-4">Create Content Idea</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const tags = formData.get('tags')?.toString().split(',').map(tag => tag.trim()).filter(tag => tag);
              handleCreateIdea({
                title: formData.get('title'),
                description: formData.get('description'),
                category: formData.get('category'),
                tags: tags || []
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Idea Title</label>
                  <input
                    name="title"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Enter idea title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Describe your content idea"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="social">Social Media</option>
                    <option value="blog">Blog Post</option>
                    <option value="video">Video Content</option>
                    <option value="graphics">Graphics/Design</option>
                    <option value="campaign">Marketing Campaign</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <input
                    name="tags"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="marketing, design, social"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateIdeaModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                >
                  Create Idea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[#0B1C48] mb-4">Upload File</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const fileInput = (e.target as HTMLFormElement).querySelector('input[type="file"]') as HTMLInputElement;
              const tags = formData.get('tags')?.toString().split(',').map(tag => tag.trim()).filter(tag => tag);
              
              if (fileInput.files && fileInput.files[0]) {
                handleFileUpload({
                  file: fileInput.files[0],
                  description: formData.get('description'),
                  category: formData.get('category'),
                  tags: tags || []
                });
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
                  <input
                    type="file"
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="What is this file about? Describe the content..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="Social Media">Social Media Content</option>
                    <option value="Website">Website Assets</option>
                    <option value="Marketing">Marketing Materials</option>
                    <option value="Branding">Branding Assets</option>
                    <option value="Documentation">Documentation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <input
                    name="tags"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="design, social, marketing"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentDashboard;