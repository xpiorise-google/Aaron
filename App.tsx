
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, TaskStatus, UserContext, TeamMember, HandoverRecord, HandoverStatus } from './types';
import { analyzeTaskInitiative } from './services/geminiService';
import { getUserTasks, saveUserTasks, getUserContext, saveUserContext, pushTaskToColleague, respondToHandover, getAllTeamMembers, archiveHandover, clearAllArchivedHandovers, archiveSenderHandover, clearAllSenderArchivedHandovers, getSharedTasks, shareTaskToTeam, unshareTaskFromTeam, getProjects, saveProject, deleteProject } from './services/databaseService';
import ExecutiveCard from './components/ExecutiveCard';
import ExecutiveListView from './components/ExecutiveListView';
import DashboardOverview from './components/DashboardOverview'; 
import QuarterlyReview from './components/QuarterlyReview';
import TaskEditor from './components/TaskEditor';
import Login from './components/Login';
import LockScreen from './components/LockScreen'; 
import ContextEditor from './components/ContextEditor';
import CompletionModal from './components/CompletionModal';
import CollabSplitView from './components/CollabSplitView';
import OrgManagerModal from './components/OrgManagerModal';
import TeamTaskDashboard from './components/TeamTaskDashboard';
import ProjectDashboard from './components/ProjectDashboard';
import ShareConfirmModal from './components/ShareConfirmModal';

import { 
  BrainCircuit, 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown,
  Plus, 
  Loader2,
  ListFilter,
  ArchiveX,
  LogOut,
  User,
  Settings,
  Target,
  GitPullRequest,
  Trash2,
  Sun,
  Moon,
  Lock,
  Shield,
  MonitorPlay,
  Briefcase,
  LayoutGrid
} from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [sharedTasks, setSharedTasks] = useState<Task[]>([]); // Team Dashboard Tasks
  const [projects, setProjects] = useState<any[]>([]); // Projects
  
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'BOARD' | 'LIST'>('BOARD');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLocked, setIsLocked] = useState(false); 
  
  const [filter, setFilter] = useState<TaskStatus | 'ALL' | 'COLLAB' | 'TEAM_TASKS' | 'PROJECTS'>('ALL');
  
  // Collab Notification State
  const [lastSeenCollabTime, setLastSeenCollabTime] = useState<number>(0);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showContextEditor, setShowContextEditor] = useState<boolean>(false);
  const [showOrgManager, setShowOrgManager] = useState<boolean>(false);
  
  // Completion Modal State
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [taskToShare, setTaskToShare] = useState<Task | null>(null); // New state for share modal
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Interaction State
  const [hoveredTaskIds, setHoveredTaskIds] = useState<string[]>([]);
  
  // Drag and Drop State
  const dragItem = useRef<number | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  // Load user session and Theme
  useEffect(() => {
    const sessionUser = localStorage.getItem('executive_session_user');
    const sessionOrg = localStorage.getItem('executive_session_org_id');
    const sessionAdmin = localStorage.getItem('executive_session_is_admin') === 'true';

    if (sessionUser && sessionOrg) {
      handleLogin(sessionUser, sessionOrg, sessionAdmin);
    }

    // Theme Logic
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Update team members whenever context/org might change
  useEffect(() => {
    if (currentOrgId) {
      const members = getAllTeamMembers(currentOrgId);
      setTeamMembers(members);
    }
  }, [currentUser, currentOrgId, showContextEditor, showOrgManager]); 

  const handleLogin = (username: string, orgId: string, admin: boolean) => {
    setCurrentUser(username);
    setCurrentOrgId(orgId);
    setIsAdmin(admin);

    localStorage.setItem('executive_session_user', username);
    localStorage.setItem('executive_session_org_id', orgId);
    localStorage.setItem('executive_session_is_admin', String(admin));

    // Force data load with Org ID scoping
    const userTasks = getUserTasks(username, orgId);
    const context = getUserContext(username, orgId);
    const teamTasks = getSharedTasks(orgId);
    const teamProjects = getProjects(orgId);
    
    // Load last seen time
    const lastSeen = localStorage.getItem(`executive_collab_last_seen_${orgId}_${username}`);
    setLastSeenCollabTime(lastSeen ? parseInt(lastSeen) : 0);

    setTasks(userTasks);
    setSharedTasks(teamTasks);
    setProjects(teamProjects);
    setUserContext(context);
    setIsLocked(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentOrgId(null);
    setIsAdmin(false);
    localStorage.removeItem('executive_session_user');
    localStorage.removeItem('executive_session_org_id');
    localStorage.removeItem('executive_session_is_admin');
    setTasks([]);
    setUserContext(null);
  };

  const updateTasks = (newTasks: Task[], saveToDb: boolean = true) => {
    setTasks(newTasks);
    if (saveToDb && currentUser && currentOrgId) {
      saveUserTasks(currentUser, newTasks, currentOrgId);
    }
  };

  const handleUpdateContext = (newContext: UserContext) => {
    setUserContext(newContext);
    if (currentUser && currentOrgId) {
      saveUserContext(currentUser, newContext, currentOrgId);
    }
    setShowContextEditor(false);
  };

  const handleNavClick = (newFilter: typeof filter) => {
    setFilter(newFilter);
    if (newFilter === 'COLLAB' && currentUser && currentOrgId) {
      const now = Date.now();
      setLastSeenCollabTime(now);
      localStorage.setItem(`executive_collab_last_seen_${currentOrgId}_${currentUser}`, now.toString());
    }
  };

  const hasUnreadCollab = useMemo(() => {
    if (!currentUser) return false;
    return tasks.some(t => 
      t.handovers?.some(h => 
        h.toUser === currentUser && 
        h.status === HandoverStatus.PENDING &&
        h.timestamp > lastSeenCollabTime
      )
    );
  }, [tasks, currentUser, lastSeenCollabTime]);

  const handleProposeInitiative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsAnalyzing(true);
    const analysis = await analyzeTaskInitiative(inputValue, userContext || undefined);
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      originalInput: inputValue,
      title: analysis.title || inputValue,
      description: analysis.description || '',
      impactScore: analysis.impactScore || 5,
      effortScore: analysis.effortScore || 5,
      strategicAdvice: analysis.strategicAdvice || '',
      subTasks: analysis.subTasks || [],
      status: TaskStatus.PROPOSED,
      createdAt: Date.now(),
      tags: [],
      attachments: [],
      isMasked: false
    };

    const newTaskList = [newTask, ...tasks];
    updateTasks(newTaskList);
    setInputValue('');
    setIsAnalyzing(false);
  };

  const handleRespondToHandover = (taskId: string, status: HandoverStatus, message: string) => {
    if (!currentUser) return;
    const updatedTasks = respondToHandover(currentUser, taskId, status, message);
    updateTasks(updatedTasks);
  };

  // Archive Received Task (Receiver Side)
  const handleArchiveHandover = (taskId: string) => {
    if (!currentUser) return;
    const updatedTasks = archiveHandover(currentUser, taskId);
    updateTasks(updatedTasks);
  };

  const handleClearCollabHistory = () => {
    if (!currentUser) return;
    if (window.confirm("确定要清空所有已处理的收件箱记录吗？")) {
       const updatedTasks = clearAllArchivedHandovers(currentUser);
       updateTasks(updatedTasks);
    }
  };

  // Archive Sent Task (Sender Side)
  const handleArchiveSenderHandover = (taskId: string) => {
    if (!currentUser) return;
    const updatedTasks = archiveSenderHandover(currentUser, taskId);
    updateTasks(updatedTasks);
  };

  const handleClearSenderHistory = () => {
    if (!currentUser) return;
    if (window.confirm("确定要清空所有已处理的发件箱记录吗？")) {
       const updatedTasks = clearAllSenderArchivedHandovers(currentUser);
       updateTasks(updatedTasks);
    }
  };

  const handleUpdateStatus = (id: string, status: TaskStatus) => {
    const now = Date.now();
    const newTaskList = tasks.map(t => {
      if (t.id === id) {
        const updates: Partial<Task> = { status };
        if (status === TaskStatus.IN_PROGRESS) {
           if (!t.startedAt) updates.startedAt = now;
           if (t.status === TaskStatus.COMPLETED) updates.completedAt = undefined;
        } else if (status === TaskStatus.COMPLETED) {
           updates.completedAt = now;
        }
        return { ...t, ...updates };
      }
      return t;
    });
    updateTasks(newTaskList);
  };

  const handleUpdateTags = (taskId: string, tags: string[]) => {
    const newTaskList = tasks.map(t => 
      t.id === taskId ? { ...t, tags } : t
    );
    updateTasks(newTaskList);
  };
  
  const handleToggleMask = (taskId: string) => {
    const newTaskList = tasks.map(t => 
      t.id === taskId ? { ...t, isMasked: !t.isMasked } : t
    );
    updateTasks(newTaskList);
  };

  const handleRequestComplete = (task: Task) => {
    setTaskToComplete(task);
  };

  const handleConfirmComplete = (taskId: string, remark: string, mentionedUser?: TeamMember) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !currentUser) return;

    const now = Date.now();

    let updatedHandovers = task.handovers || [];
    let handoverRecord: HandoverRecord | null = null;
    
    if (mentionedUser) {
       handoverRecord = {
         fromUser: currentUser,
         toUser: mentionedUser.id,
         remark: remark || "任务已完成",
         timestamp: now,
         status: HandoverStatus.PENDING 
       };
       updatedHandovers = [...updatedHandovers, handoverRecord];
       
       const taskWithHandover = { 
         ...task, 
         status: TaskStatus.COMPLETED, 
         completedAt: now,
         handovers: updatedHandovers 
       };
       pushTaskToColleague(mentionedUser.id, taskWithHandover, handoverRecord);
    }

    const newTaskList = tasks.map(t => {
      if (t.id === taskId) {
        return { 
          ...t, 
          status: TaskStatus.COMPLETED, 
          completedAt: now, 
          handovers: updatedHandovers 
        };
      }
      return t;
    });

    updateTasks(newTaskList);
    setTaskToComplete(null);
  };

  const handlePermanentDelete = (taskId: string) => {
    if (window.confirm('确定要彻底删除此任务吗？此操作无法撤销。')) {
      const newTaskList = tasks.filter(t => t.id !== taskId);
      updateTasks(newTaskList);
    }
  };

  const handleClearAllDivested = () => {
    if (window.confirm('确定要清空所有已放弃的任务吗？此操作无法撤销。')) {
      const newTaskList = tasks.filter(t => t.status !== TaskStatus.DIVESTED);
      updateTasks(newTaskList);
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const newTaskList = tasks.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subTasks: t.subTasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st)
      };
    });
    updateTasks(newTaskList);
  };

  const handleSaveTask = (updatedTask: Task) => {
    // Check if sharing status changed
    const originalTask = tasks.find(t => t.id === updatedTask.id);
    if (originalTask && originalTask.isSharedToTeam !== updatedTask.isSharedToTeam) {
       if (updatedTask.isSharedToTeam) {
         shareTaskToTeam({ ...updatedTask, creatorId: currentUser || 'unknown' }, currentOrgId || undefined);
       } else {
         unshareTaskFromTeam(updatedTask.id, currentOrgId || undefined);
       }
       // Refresh shared tasks
       setSharedTasks(getSharedTasks(currentOrgId || undefined));
    } else if (updatedTask.isSharedToTeam) {
       // If it was already shared and is still shared, update the shared copy too
       shareTaskToTeam({ ...updatedTask, creatorId: currentUser || 'unknown' }, currentOrgId || undefined);
       setSharedTasks(getSharedTasks(currentOrgId || undefined));
    }

    const newTaskList = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    updateTasks(newTaskList);
    setEditingTask(null);
  };

  // Direct update without modal (e.g. for attachments)
  const handleDirectUpdate = (updatedTask: Task) => {
    const newTaskList = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    updateTasks(newTaskList);
  };

  const handleShareToTeam = (task: Task) => {
    if (!currentUser || !currentOrgId) return;
    setTaskToShare(task);
  };

  const confirmShareTask = () => {
    if (!taskToShare || !currentUser || !currentOrgId) return;
    
    if (taskToShare.isSharedToTeam) {
      // Unshare Logic
      unshareTaskFromTeam(taskToShare.id, currentOrgId);
      const updatedTasks = tasks.map(t => t.id === taskToShare.id ? { ...t, isSharedToTeam: false } : t);
      updateTasks(updatedTasks);
    } else {
      // Share Logic
      const taskWithCreator = { ...taskToShare, creatorId: currentUser };
      shareTaskToTeam(taskWithCreator, currentOrgId);
      const updatedTasks = tasks.map(t => t.id === taskToShare.id ? { ...t, isSharedToTeam: true } : t);
      updateTasks(updatedTasks);
    }
    
    // Refresh shared tasks
    setSharedTasks(getSharedTasks(currentOrgId));
    setTaskToShare(null);
  };

  const handleSaveProject = (project: any) => {
    if (!currentOrgId) return;
    saveProject(project, currentOrgId);
    setProjects(getProjects(currentOrgId));
  };

  const handleDeleteProject = (projectId: string) => {
    if (!currentOrgId) return;
    deleteProject(projectId, currentOrgId);
    setProjects(getProjects(currentOrgId));
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'COLLAB') {
      return (t.handovers?.some(h => h.toUser === currentUser) || t.handovers?.some(h => h.fromUser === currentUser)) && t.status !== TaskStatus.DIVESTED;
    }
    if (t.status === TaskStatus.DIVESTED && filter !== TaskStatus.DIVESTED) return false;
    
    if (filter === 'ALL') {
      return t.status !== TaskStatus.DIVESTED && t.status !== TaskStatus.COMPLETED;
    }
    
    return t.status === filter;
  });

  // Drag and Drop Logic (Board View)
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, positionIndex: number, task: Task) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, a, select, [role="button"]')) {
      e.preventDefault();
      return;
    }
    if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'SPAN', 'CODE', 'PRE'].includes(target.tagName)) {
       e.preventDefault();
       return;
    }
    dragItem.current = positionIndex;
    setDraggingTaskId(task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    if (dragItem.current === null || dragItem.current === targetIndex) return;

    const newFilteredList = [...filteredTasks];
    const draggedTask = newFilteredList[dragItem.current];
    
    newFilteredList.splice(dragItem.current, 1);
    newFilteredList.splice(targetIndex, 0, draggedTask);

    const visibleIds = new Set(newFilteredList.map(t => t.id));
    const hiddenTasks = tasks.filter(t => !visibleIds.has(t.id));
    
    const finalTaskList = [...newFilteredList, ...hiddenTasks];
    updateTasks(finalTaskList, false);
    dragItem.current = targetIndex;
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    dragItem.current = null;
    if (currentUser && currentOrgId) {
      saveUserTasks(currentUser, tasks, currentOrgId);
    }
  };

  // Reorder Logic (List View)
  const handleReorderTasks = (reorderedFilteredTasks: Task[]) => {
    const visibleIds = new Set(reorderedFilteredTasks.map(t => t.id));
    const hiddenTasks = tasks.filter(t => !visibleIds.has(t.id));
    // Combine reordered visible tasks with hidden tasks
    const finalTaskList = [...reorderedFilteredTasks, ...hiddenTasks];
    updateTasks(finalTaskList);
  };

  const metrics = useMemo(() => {
    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);
    const currentWeekTasks = completedTasks.filter(t => t.completedAt && t.completedAt > now - oneWeekMs);
    const currentWeekImpact = currentWeekTasks.reduce((acc, t) => acc + t.impactScore, 0);
    const lastWeekTasks = completedTasks.filter(t => t.completedAt && t.completedAt <= now - oneWeekMs && t.completedAt > now - (2 * oneWeekMs));
    const lastWeekImpact = lastWeekTasks.reduce((acc, t) => acc + t.impactScore, 0);

    let percentChange = 0;
    let isNetGrowth = false;
    if (lastWeekImpact > 0) {
      percentChange = ((currentWeekImpact - lastWeekImpact) / lastWeekImpact) * 100;
    } else if (currentWeekImpact > 0) {
      isNetGrowth = true;
    }
    return { currentImpact: currentWeekImpact, percentChange, isNetGrowth };
  }, [tasks]);

  if (!currentUser || !currentOrgId) {
    return (
      <Login 
        onLogin={handleLogin} 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme} 
      />
    );
  }

  if (isLocked) {
    return <LockScreen currentUser={currentUser} currentOrgId={currentOrgId} onUnlock={() => setIsLocked(false)} />;
  }
  
  const activeCount = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.PROPOSED).length;
  
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-200 flex flex-col md:flex-row font-sans selection:bg-zinc-800 selection:text-white transition-colors duration-300">
      
      <aside className="w-full md:w-64 bg-white dark:bg-black border-r border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0 sticky top-0 h-auto md:h-screen z-20 transition-colors duration-300">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <span className="font-bold tracking-tight text-zinc-900 dark:text-white text-lg font-cool block">The COO</span>
            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-zinc-500 font-mono">{currentOrgId}</span>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/30">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm text-zinc-900 dark:text-white font-bold uppercase tracking-tight flex items-center gap-1">
                 {currentUser}
                 {isAdmin && <Shield size={12} className="text-amber-500" />}
              </div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold mt-1 tracking-widest">{userContext?.jobTitle || 'Member'}</div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowContextEditor(true)}
            className="w-full mt-2 flex items-center justify-between px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-600 dark:text-zinc-300 transition-colors group"
          >
            <span className="flex items-center gap-2"><Target size={12} className="text-zinc-500"/> 战略背景</span>
            <Settings size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          <button 
            onClick={() => handleNavClick('ALL')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${filter === 'ALL' ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold border dark:border-zinc-700' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 border border-transparent'}`}
          >
            <LayoutDashboard size={18} /> 仪表盘
          </button>
          
          <button 
            onClick={() => handleNavClick(TaskStatus.COMPLETED)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${filter === TaskStatus.COMPLETED ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold border dark:border-zinc-700' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 border border-transparent'}`}
          >
            <TrendingUp size={18} /> 已完成
          </button>
          
          <div className="my-2 border-t border-zinc-200 dark:border-zinc-800/50 mx-2"></div>

          <div className="px-4 py-2">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 px-2">团队驾驶舱</div>
            <button 
              onClick={() => handleNavClick('TEAM_TASKS')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-1 ${filter === 'TEAM_TASKS' ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 border border-transparent'}`}
            >
              <LayoutGrid size={18} /> 任务大屏
            </button>
            <button 
              onClick={() => handleNavClick('PROJECTS')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${filter === 'PROJECTS' ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 border border-transparent'}`}
            >
              <Briefcase size={18} /> 项目大屏
            </button>
          </div>
          
          <div className="my-2 border-t border-zinc-200 dark:border-zinc-800/50 mx-2"></div>
          
          <button 
            onClick={() => handleNavClick('COLLAB')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${filter === 'COLLAB' ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 border border-transparent'}`}
          >
            <div className="flex items-center gap-3">
              <GitPullRequest size={18} /> 协同任务
            </div>
            {hasUnreadCollab && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </button>

          <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800/50">
            <button 
              onClick={() => handleNavClick(TaskStatus.DIVESTED)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${filter === TaskStatus.DIVESTED ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'}`}
            >
              <ArchiveX size={18} /> 回收站
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
           <div>
            {/* ADMIN ENTRY */}
            {isAdmin && (
               <button 
                onClick={() => setShowOrgManager(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-zinc-800 text-white dark:bg-zinc-100 dark:text-black rounded mb-4 text-xs font-bold hover:opacity-90 transition-opacity"
               >
                 <Shield size={12} /> 组织管理
               </button>
            )}

            <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2 font-semibold">近7天生产力指数</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">{metrics.currentImpact.toFixed(1)} 分</div>
            
            {metrics.isNetGrowth ? (
              <div className="text-xs flex items-center gap-1 text-emerald-500">
                <TrendingUp size={12} />
                本周净增长
              </div>
            ) : (
              <div className={`text-xs flex items-center gap-1 ${metrics.percentChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {metrics.percentChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                环比 {metrics.percentChange >= 0 ? '+' : ''}{metrics.percentChange.toFixed(1)}%
              </div>
            )}
           </div>
           
           <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
           >
             <LogOut size={14} /> 安全退出
           </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
              {filter === TaskStatus.DIVESTED ? '已放弃任务 (回收站)' : 
               filter === 'COLLAB' ? '协作流转中心' : 
               filter === TaskStatus.COMPLETED ? '周任务复盘 (WBR)' :
               filter === 'TEAM_TASKS' ? '团队任务大屏 (Team Tasks)' :
               filter === 'PROJECTS' ? '项目大屏 (Project Dashboard)' :
               '决策指挥中心 (Command Dashboard)'}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              {filter === TaskStatus.DIVESTED ? '回收站与被剥离的资产。' : 
               filter === 'COLLAB' ? '来自团队成员的已完成任务交接与复核请求。' : 
               filter === TaskStatus.COMPLETED ? '按周复盘产出，确保每周动能不减。' :
               filter === 'TEAM_TASKS' ? '全团队公开任务概览，促进信息透明与资源对齐。' :
               filter === 'PROJECTS' ? '核心项目组合管理，基于 ROI 优先级排序。' :
               `基于 ROI 矩阵分配 ${activeCount} 个活跃提案的资源投入。`}
            </p>
          </div>

          <div className="flex items-center gap-3">
             <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 transition-all shadow-sm"
              title={isDarkMode ? "切换至浅色模式" : "切换至深色模式"}
             >
               {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
             </button>

            {filter === TaskStatus.DIVESTED && filteredTasks.length > 0 && (
               <button 
                 onClick={handleClearAllDivested}
                 className="px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors shadow-lg"
               >
                 <Trash2 size={14} /> 清空回收站
               </button>
            )}

            {filter !== TaskStatus.DIVESTED && filter !== TaskStatus.COMPLETED && filter !== 'COLLAB' && filter !== 'TEAM_TASKS' && filter !== 'PROJECTS' && (
              <div className="flex bg-white dark:bg-zinc-900 rounded-lg p-1 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <button 
                  onClick={() => setViewMode('BOARD')}
                  className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-colors ${viewMode === 'BOARD' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
                >
                  <BrainCircuit size={14} /> 战略视图
                </button>
                <button 
                  onClick={() => setViewMode('LIST')}
                  className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-colors ${viewMode === 'LIST' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
                >
                  <ListFilter size={14} /> 列表视图
                </button>
              </div>
            )}
          </div>
        </header>

        {filter !== TaskStatus.DIVESTED && filter !== 'COLLAB' && filter !== TaskStatus.COMPLETED && filter !== 'TEAM_TASKS' && filter !== 'PROJECTS' && (
          <div className="bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-950 dark:to-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-8 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <label className="block text-zinc-800 dark:text-zinc-200 text-xs font-bold uppercase tracking-widest mb-3">
              提出新提案 (AI COO 分析)
            </label>
            
            <form onSubmit={handleProposeInitiative} className="relative">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="例如：'重构客户引导流程' 或 '修理洗手池'"
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg py-4 px-5 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-600 focus:ring-1 focus:ring-zinc-500/20 dark:focus:ring-zinc-600/50 transition-all pr-12 shadow-sm"
                disabled={isAnalyzing}
              />
              <button 
                type="submit" 
                disabled={isAnalyzing || !inputValue.trim()}
                className="absolute right-2 top-2 bottom-2 bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-100 dark:hover:bg-zinc-300 text-white dark:text-black p-2 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-10 shadow-md"
              >
                {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
              </button>
            </form>
            {isAnalyzing && (
              <div className="mt-3 flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-xs animate-pulse">
                <BrainCircuit size={14} />
                <span>AI 正在结合您的 [{userContext?.jobTitle}] 背景分析 ROI 与资源匹配度...</span>
              </div>
            )}
          </div>
        )}

        {filter === TaskStatus.COMPLETED ? (
           <QuarterlyReview 
             tasks={filteredTasks} 
             onUpdateTags={handleUpdateTags}
             onUpdateStatus={handleUpdateStatus}
             onEdit={setEditingTask}
             currentUser={currentUser}
             userTitle={userContext?.jobTitle}
           />
        ) : filter === 'COLLAB' ? (
           <CollabSplitView 
             tasks={tasks}
             currentUser={currentUser}
             onRespond={handleRespondToHandover}
             onArchive={handleArchiveHandover}
             onClearHistory={handleClearCollabHistory}
             // Wired up sender actions
             // @ts-ignore - The component is updated to accept these
             onArchiveSender={handleArchiveSenderHandover}
             onClearSenderHistory={handleClearSenderHistory}
           />
        ) : filter === 'TEAM_TASKS' ? (
           <TeamTaskDashboard 
             tasks={sharedTasks}
             projects={projects}
             currentUser={currentUser}
             onUpdateStatus={handleUpdateStatus}
             onEdit={setEditingTask}
             viewMode={viewMode}
             onViewModeChange={setViewMode}
           />
        ) : filter === 'PROJECTS' ? (
           <ProjectDashboard 
             projects={projects}
             sharedTasks={sharedTasks}
             isAdmin={isAdmin}
             onSaveProject={handleSaveProject}
             onDeleteProject={handleDeleteProject}
           />
        ) : (
           <>
             {viewMode === 'BOARD' && filter === 'ALL' ? (
                <DashboardOverview 
                  tasks={filteredTasks}
                  allTasks={tasks}
                  onUpdateStatus={handleUpdateStatus}
                  onEdit={setEditingTask}
                  hoveredTaskIds={hoveredTaskIds}
                  setHoveredTaskIds={setHoveredTaskIds}
                  onTaskClick={(id) => {
                    const el = document.getElementById(`task-${id}`);
                    el?.scrollIntoView({ behavior: 'smooth' });
                    setHoveredTaskIds([id]);
                    setTimeout(() => setHoveredTaskIds([]), 2000);
                  }}
                />
             ) : null}

             {viewMode === 'BOARD' && filter === 'ALL' && (
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                 {filteredTasks.length === 0 ? (
                   <div className="col-span-full py-20 text-center text-zinc-500 dark:text-zinc-600">
                     <p>该板块暂无提案。</p>
                   </div>
                 ) : (
                   filteredTasks.map((task, index) => (
                     <div 
                       id={`task-${task.id}`} 
                       key={task.id}
                       draggable
                       onDragStart={(e) => handleDragStart(e, index, task)}
                       onDragEnter={(e) => handleDragEnter(e, index)}
                       onDragEnd={handleDragEnd}
                       onDragOver={(e) => e.preventDefault()}
                       className="transition-transform duration-200 h-full"
                     >
                       <ExecutiveCard 
                         task={task}
                         projects={projects}
                         priorityIndex={index + 1} // Sync order from filtered list
                         currentViewer={currentUser}
                         onUpdateStatus={handleUpdateStatus}
                         onUpdateTags={handleUpdateTags}
                         onRequestComplete={handleRequestComplete} 
                         onToggleSubtask={handleToggleSubtask}
                         onEdit={setEditingTask}
                         onDelete={handlePermanentDelete}
                         isHovered={hoveredTaskIds.includes(task.id)}
                         onToggleMask={() => handleToggleMask(task.id)}
                         // NEW PROP INJECTION FOR ATTACHMENTS
                         // @ts-ignore
                         onDirectUpdate={handleDirectUpdate}
                         onShareToTeam={handleShareToTeam}
                       />
                     </div>
                   ))
                 )}
               </div>
             )}

             {viewMode === 'LIST' && filter !== TaskStatus.DIVESTED && (
               <ExecutiveListView 
                 tasks={filteredTasks} 
                 onUpdateStatus={handleUpdateStatus} 
                 onEdit={setEditingTask}
                 onReorder={handleReorderTasks}
               />
             )}
             
             {(filter !== 'ALL' && viewMode === 'BOARD') && (
               <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                 {filteredTasks.map((task, index) => (
                   <div key={task.id} className="h-full">
                      <ExecutiveCard 
                         task={task}
                         projects={projects}
                         priorityIndex={index + 1}
                         currentViewer={currentUser}
                         onUpdateStatus={handleUpdateStatus}
                         onUpdateTags={handleUpdateTags}
                         onRequestComplete={handleRequestComplete} 
                         onToggleSubtask={handleToggleSubtask}
                         onEdit={setEditingTask}
                         onDelete={handlePermanentDelete}
                         isHovered={hoveredTaskIds.includes(task.id)}
                         onToggleMask={() => handleToggleMask(task.id)}
                         // NEW PROP INJECTION FOR ATTACHMENTS
                         // @ts-ignore
                         onDirectUpdate={handleDirectUpdate}
                         onShareToTeam={handleShareToTeam}
                       />
                   </div>
                 ))}
               </div>
             )}
           </>
        )}

      </main>

      {editingTask && (
        <TaskEditor 
          task={editingTask} 
          projects={projects}
          onSave={handleSaveTask} 
          onCancel={() => setEditingTask(null)} 
        />
      )}

      {taskToComplete && (
        <CompletionModal
          task={taskToComplete}
          currentUser={currentUser}
          teamMembers={teamMembers}
          onConfirm={handleConfirmComplete}
          onCancel={() => setTaskToComplete(null)}
        />
      )}

      <ShareConfirmModal 
        isOpen={!!taskToShare}
        task={taskToShare}
        onClose={() => setTaskToShare(null)}
        onConfirm={confirmShareTask}
      />

      {showContextEditor && userContext && (
        <ContextEditor
          context={userContext}
          onSave={handleUpdateContext}
          onCancel={() => setShowContextEditor(false)}
        />
      )}
      
      {showOrgManager && currentOrgId && (
        <OrgManagerModal
          orgId={currentOrgId}
          currentUser={currentUser}
          isOpen={showOrgManager}
          onClose={() => setShowOrgManager(false)}
        />
      )}

      <div className="fixed bottom-4 right-4 z-50 group">
        <button 
          onClick={() => setIsLocked(true)}
          className="backdrop-blur-md bg-white/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400/80 px-4 py-2 rounded-full text-xs font-medium shadow-xl hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all flex items-center gap-2 group-hover:pr-3"
          title="进入锁屏界面"
        >
          <span>designed by Aaron</span>
          <Lock size={10} className="w-0 overflow-hidden group-hover:w-3 transition-all opacity-0 group-hover:opacity-100" />
        </button>
      </div>
    </div>
  );
};

export default App;
