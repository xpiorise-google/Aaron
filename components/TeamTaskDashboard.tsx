import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, Project } from '../types';
import ExecutiveCard from './ExecutiveCard';
import { ArrowUpDown, User, Calendar, Zap, Layers, Search, Filter, Clock, LayoutGrid, List, Briefcase } from 'lucide-react';
import ExecutiveListView from './ExecutiveListView';

interface TeamTaskDashboardProps {
  tasks: Task[];
  projects: Project[]; // New Prop
  currentUser: string;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void; 
  viewMode: 'BOARD' | 'LIST';
  onViewModeChange: (mode: 'BOARD' | 'LIST') => void;
}

type SortField = 'IMPACT_EFFORT' | 'CREATED_AT' | 'DEADLINE';

const TeamTaskDashboard: React.FC<TeamTaskDashboardProps> = ({ 
  tasks, 
  projects,
  currentUser,
  onUpdateStatus,
  onEdit,
  viewMode,
  onViewModeChange
}) => {
  const [sortField, setSortField] = useState<SortField>('IMPACT_EFFORT');
  const [creatorFilter, setCreatorFilter] = useState<string>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL'); // New Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique creators
  const creators = useMemo(() => {
    const s = new Set(tasks.map(t => t.creatorId).filter(Boolean) as string[]);
    return Array.from(s);
  }, [tasks]);

  const filteredAndSortedTasks = useMemo(() => {
    // Filter out completed tasks for the dashboard view
    // Also filter out tasks that are marked as completed in the shared view if they were completed after sharing
    // But the requirement says "Already completed tasks should not be displayed in the team task screen"
    // So we strictly filter by status !== COMPLETED
    let result = tasks.filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.DIVESTED);

    // Filter by Creator
    if (creatorFilter !== 'ALL') {
      result = result.filter(t => t.creatorId === creatorFilter);
    }

    // Filter by Project
    if (projectFilter !== 'ALL') {
      result = result.filter(t => t.projectId === projectFilter);
    }

    // Filter by Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.description.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortField === 'IMPACT_EFFORT') {
        const ratioA = a.effortScore > 0 ? a.impactScore / a.effortScore : 0;
        const ratioB = b.effortScore > 0 ? b.impactScore / b.effortScore : 0;
        return ratioB - ratioA; // Descending
      } else if (sortField === 'CREATED_AT') {
        return b.createdAt - a.createdAt;
      } else if (sortField === 'DEADLINE') {
        // Tasks with deadline come first, sorted by nearest deadline
        const ddlA = a.deadline || Number.MAX_SAFE_INTEGER;
        const ddlB = b.deadline || Number.MAX_SAFE_INTEGER;
        return ddlA - ddlB;
      }
      return 0;
    });

    return result;
  }, [tasks, creatorFilter, searchQuery, sortField]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col lg:flex-row gap-5 justify-between items-center shadow-sm sticky top-0 z-30 backdrop-blur-md bg-white/90 dark:bg-zinc-900/90">
        
        {/* Left: Search & Filter */}
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="搜索团队任务 (关键词/标签)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <select 
              value={creatorFilter} 
              onChange={(e) => setCreatorFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-600 dark:text-zinc-300 focus:outline-none appearance-none cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors"
            >
              <option value="ALL">所有成员</option>
              {creators.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

          <div className="relative">
            <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <select 
              value={projectFilter} 
              onChange={(e) => setProjectFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-600 dark:text-zinc-300 focus:outline-none appearance-none cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors"
            >
              <option value="ALL">所有项目</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>

        {/* Right: Sorting & View Mode */}
        <div className="flex items-center gap-4 w-full lg:w-auto justify-end">
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 p-1 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <button 
              onClick={() => setSortField('IMPACT_EFFORT')}
              className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${sortField === 'IMPACT_EFFORT' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              <Zap size={14} /> ROI
            </button>
            <button 
              onClick={() => setSortField('CREATED_AT')}
              className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${sortField === 'CREATED_AT' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              <Calendar size={14} /> 最新
            </button>
            <button 
              onClick={() => setSortField('DEADLINE')}
              className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${sortField === 'DEADLINE' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              <Clock size={14} /> DDL
            </button>
          </div>

          <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 hidden lg:block"></div>

          <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800/50 p-1 rounded-xl border border-zinc-100 dark:border-zinc-800">
             <button 
               onClick={() => onViewModeChange('BOARD')}
               className={`p-2 rounded-lg transition-all ${viewMode === 'BOARD' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
               title="看板视图"
             >
               <LayoutGrid size={16} />
             </button>
             <button 
               onClick={() => onViewModeChange('LIST')}
               className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
               title="列表视图"
             >
               <List size={16} />
             </button>
          </div>
        </div>
      </div>

      {/* Task Content */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="col-span-full py-32 text-center text-zinc-400 dark:text-zinc-600 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <Layers size={32} className="opacity-50" />
          </div>
          <p className="text-lg font-medium mb-1">暂无公开的团队任务</p>
          <p className="text-sm">在您的仪表盘中点击“公开”按钮，即可将任务分享至此。</p>
        </div>
      ) : (
        <>
          {viewMode === 'BOARD' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAndSortedTasks.map((task, index) => (
                <div key={task.id} className="h-full relative group">
                   {/* Creator Badge - Floating */}
                   <div className="absolute -top-3 left-0 z-20 bg-transparent px-2 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-300 dark:text-zinc-600">
                     {task.creatorId || 'UNKNOWN'}
                   </div>
                   
                   <ExecutiveCard 
                     task={task}
                     projects={projects}
                     readOnly={true} 
                     onUpdateStatus={() => {}} 
                     onEdit={() => {}} 
                     onToggleSubtask={() => {}} 
                     isHovered={false}
                   />
                   
                   {/* ROI Badge Overlay Removed - Moved to ExecutiveCard */}
                </div>
              ))}
            </div>
          ) : (
            <ExecutiveListView 
              tasks={filteredAndSortedTasks}
              onUpdateStatus={() => {}}
              onEdit={() => {}}
              readOnly={true} 
            />
          )}
        </>
      )}
    </div>
  );
};

export default TeamTaskDashboard;
