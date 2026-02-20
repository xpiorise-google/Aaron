
import React, { useMemo, useState } from 'react';
import { Task, PREDEFINED_TAGS, TaskStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calendar, Trophy, Zap, TrendingUp, ChevronDown, ChevronRight, Target, Plus, CheckCircle, X, Palmtree, Trash2, Pencil, FileText, Briefcase } from 'lucide-react';
import WeekReportModal from './WeekReportModal';
import { getHolidayInfo } from '../services/holidayData'; // Import from the new service

interface QuarterlyReviewProps {
  tasks: Task[];
  onUpdateTags?: (taskId: string, tags: string[]) => void;
  onUpdateStatus?: (id: string, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  currentUser?: string; // Add currentUser prop
  userTitle?: string; // Add userTitle context if available (optional)
}

// --- Date & Holiday Helpers ---

// ISO 8601 Week Number to Date Range
const getDateRangeFromWeek = (year: number, week: number) => {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4)
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  
  const startDate = new Date(ISOweekStart);
  const endDate = new Date(ISOweekStart);
  endDate.setDate(startDate.getDate() + 6);
  
  return { start: startDate, end: endDate };
};

// Helper to get week number
const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const formatDateSimple = (d: Date) => {
  return `${d.getFullYear()}年${(d.getMonth() + 1).toString().padStart(2, '0')}月${d.getDate().toString().padStart(2, '0')}日`;
};

interface ReviewTaskRowProps {
  task: Task;
  onUpdateTags?: (taskId: string, tags: string[]) => void;
  onUpdateStatus?: (id: string, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
}

const ReviewTaskRow: React.FC<ReviewTaskRowProps> = ({ task, onUpdateTags, onUpdateStatus, onEdit }) => {
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');

  const getTagStyle = (tag: string) => {
    const t = tag.toLowerCase();
    if (t.includes('p0') || t.includes('urgent') || t.includes('紧急') || t.includes('bug')) {
      return "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50";
    }
    if (t.includes('p1') || t.includes('important') || t.includes('重要')) {
      return "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50";
    }
    if (t.includes('p2')) {
      return "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50";
    }
    return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700";
  };

  const addTag = (tag: string) => {
    if (!onUpdateTags) return;
    const currentTags = task.tags || [];
    if (!currentTags.includes(tag)) {
      onUpdateTags(task.id, [...currentTags, tag]);
    }
    setShowTagSelector(false);
    setCustomTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    if (!onUpdateTags) return;
    const currentTags = task.tags || [];
    onUpdateTags(task.id, currentTags.filter(t => t !== tagToRemove));
  };

  return (
    <div 
      className="p-4 border-b border-zinc-200 dark:border-zinc-800/30 last:border-0 flex items-start gap-4 hover:bg-white dark:hover:bg-zinc-800/20 transition-colors group"
      onMouseLeave={() => setShowTagSelector(false)}
    >
      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${task.impactScore >= 8 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
           <div className="flex flex-col gap-1 pr-4">
             <h4 className="text-zinc-900 dark:text-zinc-200 font-medium truncate">{task.title}</h4>
             {/* Tags with Interaction */}
             <div className="flex flex-wrap items-center gap-1">
               {task.tags?.map(tag => (
                 <div 
                   key={tag} 
                   className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center justify-center group/tag transition-all duration-200 cursor-default ${getTagStyle(tag)}`}
                 >
                   <span>{tag}</span>
                   <button 
                     onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                     className="w-0 overflow-hidden opacity-0 group-hover/tag:w-3 group-hover/tag:opacity-100 group-hover/tag:ml-1 transition-all duration-200 flex items-center justify-center hover:text-rose-600 outline-none"
                   >
                     <X size={10} strokeWidth={3} />
                   </button>
                 </div>
               ))}
               
               {/* Add Tag Button */}
               {onUpdateTags && (
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowTagSelector(!showTagSelector); }}
                    className={`w-5 h-5 rounded-full flex items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400 hover:text-indigo-500 hover:border-indigo-400 dark:hover:text-indigo-400 transition-all ${showTagSelector ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    title="添加标签"
                  >
                    <Plus size={10} />
                  </button>

                  {/* Tag Selector Popover */}
                  {showTagSelector && (
                    <div 
                      className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input 
                        type="text" 
                        autoFocus
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customTagInput.trim()) {
                            addTag(customTagInput.trim());
                          }
                        }}
                        placeholder="输入标签按回车..."
                        className="w-full text-xs p-2 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 text-zinc-900 dark:text-white mb-2"
                      />
                      <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                        {PREDEFINED_TAGS.map(t => (
                          <button
                            key={t}
                            onClick={() => addTag(t)}
                            className={`w-full text-left px-2 py-1 rounded text-[10px] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between ${task.tags?.includes(t) ? 'text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950' : 'text-zinc-600 dark:text-zinc-400'}`}
                            disabled={task.tags?.includes(t)}
                          >
                             {t}
                             {task.tags?.includes(t) && <CheckCircle size={10} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
             </div>
           </div>
           
           <div className="flex items-center gap-4">
             {/* Edit / Delete Buttons */}
             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               {onEdit && (
                 <button 
                  onClick={() => onEdit(task)}
                  className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-zinc-400 hover:text-indigo-500 rounded transition-colors"
                  title="编辑任务"
                 >
                   <Pencil size={14} />
                 </button>
               )}
               {onUpdateStatus && (
                 <button 
                  onClick={() => onUpdateStatus(task.id, TaskStatus.DIVESTED)}
                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-zinc-400 hover:text-rose-500 rounded transition-colors"
                  title="移至回收站"
                 >
                   <Trash2 size={14} />
                 </button>
               )}
             </div>

             <div className="flex gap-2 shrink-0">
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-500 bg-emerald-100 dark:bg-emerald-950/30 px-1.5 rounded border border-emerald-200 dark:border-emerald-900/50">I: {task.impactScore}</span>
             </div>
           </div>

        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-500 mt-1 line-clamp-1">{task.strategicAdvice}</p>
        
        {/* Subtask Summary */}
        <div className="flex gap-2 mt-2">
          {task.subTasks.slice(0, 3).map(st => (
            <span key={st.id} className="text-[10px] px-1.5 py-0.5 bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded border border-zinc-200 dark:border-zinc-700/50 truncate max-w-[150px] shadow-sm">
              {st.title}
            </span>
          ))}
          {task.subTasks.length > 3 && (
             <span className="text-[10px] px-1.5 py-0.5 text-zinc-500 dark:text-zinc-600">+{task.subTasks.length - 3}</span>
          )}
        </div>
      </div>
    </div>
  );
};

const QuarterlyReview: React.FC<QuarterlyReviewProps> = ({ tasks, onUpdateTags, onUpdateStatus, onEdit, currentUser, userTitle }) => {
  const [expandedWeeks, setExpandedWeeks] = useState<string[]>([]);
  // State for Report Modal
  const [reportWeek, setReportWeek] = useState<{tasks: Task[], weekLabel: string, dateRangeLabel: string} | null>(null);

  // Calculate the "System Genesis Week" - the week of the earliest created task
  const systemGenesisWeekEpoch = useMemo(() => {
    if (tasks.length === 0) return Date.now();
    const minCreated = Math.min(...tasks.map(t => t.createdAt));
    const d = new Date(minCreated);
    // Find the Monday of that week
    const day = d.getDay() || 7; 
    if (day !== 1) d.setHours(-24 * (day - 1));
    d.setHours(0,0,0,0);
    return d.getTime();
  }, [tasks]);

  // 1. Group tasks by Week
  const weeklyData = useMemo(() => {
    const groups: { [key: string]: { weekLabel: string; fullDateLabel: string; holidayLabel: string; weekNum: number; tasks: Task[]; totalImpact: number; totalEffort: number } } = {};
    
    tasks.forEach(task => {
      if (!task.completedAt) return;
      const date = new Date(task.completedAt);
      const year = date.getFullYear();
      const week = getWeekNumber(date);
      const key = `${year}-W${week}`;
      
      if (!groups[key]) {
        const { start, end } = getDateRangeFromWeek(year, week);
        const holidayText = getHolidayInfo(start, end);

        // Calculate Relative Week Number from Genesis
        // diff = currentWeekStart - genesisWeekStart
        const currentWeekStartEpoch = start.getTime();
        const diffMs = currentWeekStartEpoch - systemGenesisWeekEpoch;
        const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
        // Handle edge case where task might be created before genesis logic if data is weird, default to 1
        const relativeWeek = Math.max(1, diffWeeks);

        groups[key] = {
          weekLabel: `系统第 ${relativeWeek} 周`,
          fullDateLabel: `${formatDateSimple(start)} - ${formatDateSimple(end)}`,
          holidayLabel: holidayText,
          weekNum: week, // ISO week for sorting
          tasks: [],
          totalImpact: 0,
          totalEffort: 0
        };
      }
      
      groups[key].tasks.push(task);
      groups[key].totalImpact += task.impactScore;
      groups[key].totalEffort += task.effortScore;
    });

    return Object.entries(groups)
      .sort((a, b) => b[1].weekNum - a[1].weekNum)
      .map(([key, data]) => ({ key, ...data }));
  }, [tasks, systemGenesisWeekEpoch]);

  useMemo(() => {
    if (weeklyData.length > 0 && expandedWeeks.length === 0) {
      setExpandedWeeks([weeklyData[0].key]);
    }
  }, [weeklyData]);

  const chartData = useMemo(() => {
    return [...weeklyData].reverse().map(d => ({
      name: d.weekLabel, // Chart now uses "System Week X"
      impact: d.totalImpact,
      effort: d.totalEffort,
      count: d.tasks.length
    }));
  }, [weeklyData]);

  const toggleWeek = (key: string) => {
    setExpandedWeeks(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const totalImpact = tasks.reduce((acc, t) => acc + t.impactScore, 0);
  const avgImpactPerTask = tasks.length > 0 ? (totalImpact / tasks.length).toFixed(1) : '0.0';
  
  // Latest Week Impact (or 0)
  const latestWeekImpact = weeklyData.length > 0 ? weeklyData[0].totalImpact.toFixed(1) : '0.0';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-xl text-xs">
          <p className="font-bold text-zinc-900 dark:text-zinc-200 mb-2">{label}</p>
          <p className="text-emerald-600 dark:text-emerald-400">总影响力: {payload[0].value.toFixed(1)}</p>
          <p className="text-zinc-600 dark:text-zinc-500">完成任务: {payload[0].payload.count} 个</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-zinc-500 text-xs uppercase tracking-widest font-semibold mb-1">本周总产出 (Impact)</div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-white flex items-end gap-2">
              {latestWeekImpact}
              <span className="text-xs text-zinc-400 dark:text-zinc-500 font-normal mb-1">
                (总累计: {totalImpact.toFixed(0)})
              </span>
            </div>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 dark:text-emerald-500 border border-emerald-100 dark:border-transparent">
            <Trophy size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-zinc-500 text-xs uppercase tracking-widest font-semibold mb-1">平均单项 ROI</div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-white">{avgImpactPerTask}</div>
          </div>
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 dark:text-indigo-500 border border-indigo-100 dark:border-transparent">
            <Target size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-zinc-500 text-xs uppercase tracking-widest font-semibold mb-1">交付速度 (Velocity)</div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-white">{tasks.length} <span className="text-sm text-zinc-500 font-normal">项任务</span></div>
          </div>
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 dark:text-amber-500 border border-amber-100 dark:border-transparent">
            <Zap size={24} />
          </div>
        </div>
      </div>

      {/* Velocity Chart */}
      <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 relative overflow-hidden shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-zinc-900 dark:text-zinc-300 font-bold flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500"/> 
            周交付动能 (Weekly Impact Velocity)
          </h3>
          <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">WBR View</span>
        </div>
        
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="currentColor" className="text-zinc-400 dark:text-zinc-600" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 10}} />
              <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'currentColor', opacity: 0.05}} />
              <Bar dataKey="impact" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.impact >= 20 ? '#10b981' : entry.impact >= 10 ? '#3b82f6' : '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Breakdown List */}
      <div className="space-y-4">
        <h3 className="text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-widest font-semibold ml-1">复盘明细 (Breakdown by Week)</h3>
        
        {weeklyData.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-transparent">
            <p className="text-zinc-600">本季度暂无已完成的成果。</p>
          </div>
        ) : (
          weeklyData.map((week) => {
            const isExpanded = expandedWeeks.includes(week.key);
            const isHighPerformance = week.totalImpact > 20;

            return (
              <div key={week.key} className={`border rounded-xl transition-all duration-300 overflow-visible shadow-sm ${isExpanded ? 'bg-white dark:bg-zinc-900/40 border-zinc-300 dark:border-zinc-700 shadow-md' : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                
                {/* Week Header */}
                <div 
                  onClick={() => toggleWeek(week.key)}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer select-none group gap-4"
                >
                  <div className="flex items-start md:items-center gap-4">
                    <div className={`p-1.5 rounded transition-transform duration-200 mt-1 md:mt-0 ${isExpanded ? 'rotate-90 text-zinc-800 dark:text-zinc-200' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`}>
                      <ChevronRight size={18} />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-zinc-900 dark:text-white font-bold text-lg leading-tight">{week.fullDateLabel}</span>
                        {isHighPerformance && (
                          <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-200 dark:border-emerald-500/30">
                            HIGH IMPACT
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                        <span className="flex items-center gap-1"><Calendar size={10} /> {week.weekLabel}</span>
                        {week.holidayLabel && (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 rounded border border-amber-100 dark:border-amber-900/30">
                            <Palmtree size={10} /> {week.holidayLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 md:mr-2 pl-10 md:pl-0">
                    <div className="text-left md:text-right">
                      <div className="text-[10px] text-zinc-500 uppercase">Impact</div>
                      <div className={`text-lg font-mono font-bold ${isHighPerformance ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-300'}`}>
                        {week.totalImpact.toFixed(1)}
                      </div>
                    </div>
                    
                    {/* Report Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportWeek({ tasks: week.tasks, weekLabel: week.weekLabel, dateRangeLabel: week.fullDateLabel });
                      }}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/30 transition-colors border border-indigo-200 dark:border-indigo-500/40"
                    >
                      <FileText size={14} /> 生成周报
                    </button>

                  </div>
                </div>

                {/* Task List */}
                {isExpanded && (
                  <div className="border-t border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-950/30">
                    
                    {/* Mobile Only: Report Button */}
                    <div className="sm:hidden p-3 border-b border-zinc-100 dark:border-zinc-800">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportWeek({ tasks: week.tasks, weekLabel: week.weekLabel, dateRangeLabel: week.fullDateLabel });
                        }}
                        className="w-full flex justify-center items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold"
                      >
                        <FileText size={14} /> 生成本周汇报 (Word)
                      </button>
                    </div>

                    {week.tasks.map((task) => (
                      <ReviewTaskRow 
                        key={task.id} 
                        task={task} 
                        onUpdateTags={onUpdateTags} 
                        onUpdateStatus={onUpdateStatus}
                        onEdit={onEdit}
                      />
                    ))}
                    
                    {/* WBR Outlook Placeholder */}
                    <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border-t border-indigo-100 dark:border-indigo-900/20 text-center">
                       <p className="text-[10px] text-indigo-600 dark:text-indigo-300/60 italic flex items-center justify-center gap-2">
                          <Zap size={12} />
                          基于本周产出，建议在下周 WBR 会议中重点复盘高 ROI 项目的成功路径。
                       </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Week Report Modal */}
      {reportWeek && currentUser && (
        <WeekReportModal
          isOpen={true}
          onClose={() => setReportWeek(null)}
          tasks={reportWeek.tasks}
          weekLabel={reportWeek.weekLabel}
          dateRangeLabel={reportWeek.dateRangeLabel}
          currentUser={currentUser}
          userTitle={userTitle}
        />
      )}
    </div>
  );
};

export default QuarterlyReview;
