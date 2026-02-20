import React, { useMemo, useState } from 'react';
import { Task, TaskStatus, PREDEFINED_TAGS } from '../types';
import { 
  Activity, 
  AlertCircle, 
  CheckSquare, 
  Clock, 
  Flame, 
  MoreHorizontal, 
  RotateCcw, 
  CheckCircle2,
  StopCircle,
  TrendingUp,
  AlertTriangle,
  Plus,
  CheckCircle,
  X
} from 'lucide-react';

interface ActiveProjectsDashboardProps {
  tasks: Task[];
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdateTags?: (taskId: string, tags: string[]) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onEdit: (task: Task) => void;
}

const ActiveProjectCard: React.FC<{
  task: Task;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdateTags?: (taskId: string, tags: string[]) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onEdit: (task: Task) => void;
  stalled: boolean;
  percent: number;
  durationString: string;
}> = ({ task, onUpdateStatus, onUpdateTags, onToggleSubtask, onEdit, stalled, percent, durationString }) => {
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
      className={`
        relative bg-white dark:bg-zinc-900/40 border rounded-xl overflow-visible transition-all duration-300 group shadow-sm hover:shadow-md
        ${stalled ? 'border-rose-200 dark:border-rose-900/40 shadow-[0_0_20px_rgba(225,29,72,0.05)]' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}
      `}
      onMouseLeave={() => setShowTagSelector(false)}
    >
      {/* Status Stripe */}
      <div className={`h-1 w-full rounded-t-xl ${stalled ? 'bg-rose-500' : task.impactScore >= 8 ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
      
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className={`text-lg font-bold truncate ${stalled ? 'text-rose-600 dark:text-rose-200' : 'text-zinc-900 dark:text-zinc-100'}`}>{task.title}</h3>
              {task.impactScore >= 8 && (
                 <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">HIGH VALUE</span>
              )}
              {/* Tags with Interaction */}
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
                      className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200"
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
                        className="w-full text-xs p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 text-zinc-900 dark:text-white mb-2"
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
            <div className="text-xs text-zinc-500 font-mono flex items-center gap-2">
              <Clock size={12} />
              {durationString}
              {stalled && <span className="text-rose-500 dark:text-rose-400 font-bold flex items-center gap-1"><AlertTriangle size={10}/> 进度停滞</span>}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
             <span className="text-2xl font-bold font-mono text-zinc-800 dark:text-zinc-200">{percent}%</span>
             <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Completion</span>
          </div>
        </div>

        {/* Strategic Context */}
        <div className="bg-zinc-50 dark:bg-zinc-950/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/50 mb-4">
           <p className="text-xs text-zinc-600 dark:text-zinc-400 italic leading-relaxed">
             <span className="text-indigo-600 dark:text-indigo-400 font-bold not-italic mr-1">Strategy:</span>
             {task.strategicAdvice}
           </p>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full mb-5 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${stalled ? 'bg-rose-500' : task.impactScore >= 8 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
            style={{ width: `${percent}%` }}
          ></div>
        </div>

        {/* Subtasks (Interactive) */}
        <div className="space-y-2 mb-6">
          {task.subTasks.length > 0 ? (
            task.subTasks.map(st => (
              <div 
                key={st.id} 
                onClick={() => onToggleSubtask(task.id, st.id)}
                className="flex items-start gap-3 p-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors group/item"
              >
                <div className={`mt-0.5 shrink-0 transition-colors ${st.completed ? 'text-emerald-500' : 'text-zinc-400 dark:text-zinc-600 group-hover/item:text-zinc-600 dark:group-hover/item:text-zinc-400'}`}>
                  {st.completed ? <CheckCircle2 size={16} /> : <CheckSquare size={16} />}
                </div>
                <span className={`text-sm transition-all ${st.completed ? 'text-zinc-500 dark:text-zinc-600 line-through' : 'text-zinc-700 dark:text-zinc-300'}`}>
                  {st.title}
                </span>
              </div>
            ))
          ) : (
            <div className="text-xs text-zinc-500 dark:text-zinc-600 italic text-center py-2">无具体执行步骤</div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
          <div className="flex gap-2">
             <button 
               onClick={() => onUpdateStatus(task.id, TaskStatus.PROPOSED)}
               className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors border border-transparent hover:border-amber-100 dark:hover:border-amber-900/30"
             >
               <RotateCcw size={14} /> 挂起/撤回
             </button>
             <button 
               onClick={() => onEdit(task)}
               className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30"
             >
               <MoreHorizontal size={14} /> 调整
             </button>
          </div>

          <button 
            onClick={() => onUpdateStatus(task.id, TaskStatus.COMPLETED)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white dark:hover:text-white rounded-lg text-xs font-bold transition-all shadow-sm hover:shadow-lg hover:shadow-emerald-500/20 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500"
          >
            <StopCircle size={14} /> 标记为完成
          </button>
        </div>

      </div>
    </div>
  );
};


const ActiveProjectsDashboard: React.FC<ActiveProjectsDashboardProps> = ({ 
  tasks, 
  onUpdateStatus, 
  onUpdateTags,
  onToggleSubtask,
  onEdit 
}) => {
  
  // Metrics Calculation
  const metrics = useMemo(() => {
    const total = tasks.length;
    const highImpact = tasks.filter(t => t.impactScore >= 8).length;
    
    const now = Date.now();
    const staleThreshold = 5 * 24 * 60 * 60 * 1000; // 5 days
    
    // Tasks that are started > 5 days ago and less than 80% complete
    const stalled = tasks.filter(t => {
       if (!t.startedAt) return false;
       const duration = now - t.startedAt;
       const completedSubs = t.subTasks.filter(s => s.completed).length;
       const progress = t.subTasks.length > 0 ? completedSubs / t.subTasks.length : 0;
       return duration > staleThreshold && progress < 0.8;
    }).length;

    return { total, highImpact, stalled };
  }, [tasks]);

  const getProgressStats = (task: Task) => {
    const total = task.subTasks.length;
    const completed = task.subTasks.filter(s => s.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, percent };
  };

  const getDurationString = (startedAt?: number) => {
    if (!startedAt) return '刚刚启动';
    const days = Math.floor((Date.now() - startedAt) / (1000 * 60 * 60 * 24));
    if (days === 0) return '今天启动';
    return `已运行 ${days} 天`;
  };

  const isStalled = (task: Task) => {
    if (!task.startedAt) return false;
    const days = Math.floor((Date.now() - task.startedAt) / (1000 * 60 * 60 * 24));
    const { percent } = getProgressStats(task);
    return days > 5 && percent < 50;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HUD Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center gap-4 relative overflow-hidden shadow-sm">
           <div className="absolute right-0 top-0 h-full w-1 bg-blue-500/50"></div>
           <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-full text-blue-500 dark:text-blue-400 border border-blue-100 dark:border-transparent">
             <Activity size={24} />
           </div>
           <div>
             <div className="text-zinc-500 text-xs uppercase tracking-widest font-bold">并行作战数</div>
             <div className="text-2xl font-bold text-zinc-900 dark:text-white flex items-end gap-2">
               {metrics.total} <span className="text-sm font-normal text-zinc-500 mb-1">Projects</span>
             </div>
           </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center gap-4 relative overflow-hidden shadow-sm">
           <div className="absolute right-0 top-0 h-full w-1 bg-emerald-500/50"></div>
           <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-full text-emerald-500 dark:text-emerald-400 border border-emerald-100 dark:border-transparent">
             <Flame size={24} />
           </div>
           <div>
             <div className="text-zinc-500 text-xs uppercase tracking-widest font-bold">高价值攻坚</div>
             <div className="text-2xl font-bold text-zinc-900 dark:text-white flex items-end gap-2">
               {metrics.highImpact} <span className="text-sm font-normal text-zinc-500 mb-1">High ROI</span>
             </div>
           </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center gap-4 relative overflow-hidden shadow-sm">
           <div className="absolute right-0 top-0 h-full w-1 bg-rose-500/50"></div>
           <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-full text-rose-500 dark:text-rose-400 border border-rose-100 dark:border-transparent">
             <AlertCircle size={24} />
           </div>
           <div>
             <div className="text-zinc-500 text-xs uppercase tracking-widest font-bold">效率赤字 (Stalled)</div>
             <div className="text-2xl font-bold text-zinc-900 dark:text-white flex items-end gap-2">
               {metrics.stalled} <span className="text-sm font-normal text-zinc-500 mb-1">At Risk</span>
             </div>
           </div>
        </div>
      </div>

      {/* Operations Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {tasks.length === 0 ? (
           <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-transparent">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 mb-4">
               <Activity className="text-zinc-400 dark:text-zinc-600" size={32} />
             </div>
             <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-300">指挥室空闲</h3>
             <p className="text-zinc-500 mt-2">目前没有正在进行的战役。请从提案池中启动项目。</p>
           </div>
        ) : (
          tasks.sort((a, b) => b.impactScore - a.impactScore).map((task) => {
            const { total, completed, percent } = getProgressStats(task);
            const stalled = isStalled(task);
            
            return (
              <ActiveProjectCard
                key={task.id}
                task={task}
                onUpdateStatus={onUpdateStatus}
                onUpdateTags={onUpdateTags}
                onToggleSubtask={onToggleSubtask}
                onEdit={onEdit}
                stalled={stalled}
                percent={percent}
                durationString={getDurationString(task.startedAt)}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActiveProjectsDashboard;