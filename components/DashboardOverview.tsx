
import React, { useMemo, useState } from 'react';
import { Task, TaskStatus, Project } from '../types';
import StrategyMatrix from './StrategyMatrix';
import { 
  PieChart, 
  Wallet, 
  Scissors, 
  ArrowUp,
  AlertOctagon, 
  Layers, 
  Sparkles,
  AlertTriangle,
  Lock,
  Briefcase
} from 'lucide-react';

interface DashboardOverviewProps {
  tasks: Task[]; // The active/filtered tasks
  allTasks: Task[]; // Full history for heatmap
  projects: Project[]; // Available projects
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  hoveredTaskIds: string[];
  setHoveredTaskIds: (ids: string[]) => void;
  onTaskClick: (id: string) => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ 
  tasks,
  allTasks,
  projects,
  onUpdateStatus, 
  onEdit,
  hoveredTaskIds,
  setHoveredTaskIds,
  onTaskClick
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleProjectAssign = (taskId: string, projectId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      onEdit({ ...task, projectId });
    }
  };
  
  // 1. Segmentation Logic
  const analysis = useMemo(() => {
    // Only analyze what's visible in this view for the buckets (Dashboard Logic)
    // But Capital allocation might want to reflect the "current portfolio"
    const active = tasks.filter(t => t.status !== TaskStatus.DIVESTED && t.status !== TaskStatus.COMPLETED);
    
    // Total Effort "Capital"
    const totalEffort = active.reduce((acc, t) => acc + t.effortScore, 0) || 1;

    const buckets = {
      q1_quickWins: active.filter(t => t.impactScore >= 5 && t.effortScore <= 5),
      q2_major: active.filter(t => t.impactScore >= 5 && t.effortScore > 5),
      q3_fillers: active.filter(t => t.impactScore < 5 && t.effortScore <= 5),
      q4_moneyPits: active.filter(t => t.impactScore < 5 && t.effortScore > 5),
    };

    // Calculate Capital Allocation (Effort %)
    const allocation = {
      strategic: buckets.q2_major.reduce((acc, t) => acc + t.effortScore, 0) / totalEffort,
      quickWins: buckets.q1_quickWins.reduce((acc, t) => acc + t.effortScore, 0) / totalEffort,
      waste: buckets.q4_moneyPits.reduce((acc, t) => acc + t.effortScore, 0) / totalEffort,
    };

    return { buckets, allocation, totalCount: active.length };
  }, [tasks]);

  const { buckets, allocation, totalCount } = analysis;
  const highValueRatio = allocation.strategic + allocation.quickWins;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Level Financials (Effort Allocation) - Full Width for Focus Score */}
      <div className="grid grid-cols-1">
        <div className={`bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl relative overflow-hidden shadow-sm transition-all duration-500 ${totalCount === 0 ? 'border-dashed border-indigo-300 dark:border-indigo-800' : ''}`}>
           
           {totalCount === 0 ? (
             /* EMPTY STATE: Animated Call to Action */
             <div className="flex flex-col items-center justify-center py-4 text-center space-y-3 relative z-10">
                <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                  <div className="w-32 h-32 bg-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
                </div>
                
                <div className="flex items-center justify-center w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 rounded-full text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 animate-bounce mb-2">
                   <ArrowUp size={24} strokeWidth={2.5} />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-zinc-800 dark:text-white flex items-center justify-center gap-2">
                    <Sparkles size={16} className="text-amber-500" />
                    决策中心已就绪
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-md mx-auto">
                    目前暂无活跃的战略提案。请在<span className="font-bold text-indigo-600 dark:text-indigo-400 mx-1">上方输入框</span>输入您的想法，AI COO 将为您分析 ROI。
                  </p>
                </div>
             </div>
           ) : (
             /* ACTIVE STATE: Focus Score Data */
             <div className="flex items-center justify-between">
                <div className="absolute left-0 top-0 h-full w-1.5 bg-indigo-500"></div>
                <div className="flex-1">
                  <div className="text-zinc-500 text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                    <Wallet size={16} /> 战略资源集中度 (Focus Score)
                  </div>
                  <div className="flex items-end gap-4 mt-2">
                      <div className="text-4xl font-bold text-zinc-900 dark:text-white leading-none">
                        {(highValueRatio * 100).toFixed(0)}<span className="text-lg text-zinc-500 font-medium ml-1">%</span>
                      </div>
                      <div className="mb-1 h-2 flex-1 max-w-xs bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-1000" 
                          style={{width: `${highValueRatio * 100}%`}}
                        ></div>
                      </div>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
                    您的精力有 <span className="text-zinc-900 dark:text-white font-bold">{(highValueRatio * 100).toFixed(0)}%</span> 投资于高 ROI (Q1+Q2) 项目。
                    {allocation.waste > 0.1 ? (
                      <span className="text-rose-500 dark:text-rose-400 ml-2 font-medium flex items-center gap-1 inline-flex">
                        <AlertOctagon size={12}/> 警告：{(allocation.waste * 100).toFixed(0)}% 浪费在黑洞业务。
                      </span>
                    ) : highValueRatio < 0.4 ? (
                      <span className="text-amber-500 dark:text-amber-400 ml-2 font-medium flex items-center gap-1 inline-flex">
                        <AlertTriangle size={12}/> 提示：过多精力陷入低产出琐事(Fillers)。
                      </span>
                    ) : (
                      <span className="text-emerald-500 dark:text-emerald-400 ml-2 font-medium">资源配置健康。</span>
                    )}
                  </p>
                </div>
                
                <div className="hidden md:block h-24 w-24 ml-6">
                  <PieChart className="text-indigo-500/10 dark:text-indigo-500/20 w-full h-full" strokeWidth={1.5} />
                </div>
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px] lg:h-[500px]">
        
        {/* Left: The Strategy Matrix (Visual) */}
        <div className="lg:col-span-2 h-full flex flex-col">
          <StrategyMatrix 
            tasks={tasks}
            allTasks={allTasks}
            onTaskClick={onTaskClick}
            hoveredTaskIds={hoveredTaskIds}
            setHoveredTaskIds={setHoveredTaskIds}
          />
        </div>

        {/* Right: The Actionable Buckets (Tactical) */}
        <div className="lg:col-span-1 flex flex-col gap-3 h-full min-h-0">
          
          {/* Bucket 1: Major Projects (Top Priority - Plan) */}
          <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex-1 flex flex-col min-h-0 shadow-sm overflow-hidden">
             <div className="flex justify-between items-center mb-3 shrink-0">
              <h3 className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2 text-sm uppercase tracking-wide">
                <Layers size={16} /> 重大战略 (Plan)
              </h3>
              <span className="text-xs font-mono bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                {buckets.q2_major.length}
              </span>
            </div>
            <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
              {buckets.q2_major.map(t => {
                // Calculate Global Priority Index
                const priorityIndex = tasks.indexOf(t) + 1;
                
                return (
                  <div 
                    key={t.id} 
                    className="bg-zinc-50 dark:bg-zinc-950/50 p-3 rounded border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 cursor-pointer group transition-colors flex flex-col gap-2"
                    onClick={() => onTaskClick(t.id)}
                    onMouseEnter={() => setHoveredTaskIds([t.id])}
                    onMouseLeave={() => setHoveredTaskIds([])}
                  >
                     <div className="flex items-center gap-3">
                       <span className="text-xs font-mono font-bold text-zinc-400 dark:text-zinc-600 group-hover:text-amber-500 transition-colors">#{String(priorityIndex).padStart(2, '0')}</span>
                       {t.isMasked ? (
                         <div className="text-sm text-zinc-400 dark:text-zinc-600 italic flex items-center gap-2">
                           <Lock size={12}/> Confidential
                         </div>
                       ) : (
                         <div className="text-sm text-zinc-800 dark:text-zinc-200 truncate group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">{t.title}</div>
                       )}
                     </div>
                     
                     {/* Project Association */}
                     <div className="pl-8 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Briefcase size={10} className="text-zinc-400" />
                        <select 
                          value={t.projectId || ''} 
                          onChange={(e) => handleProjectAssign(t.id, e.target.value)}
                          className="bg-transparent text-[10px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 border-none focus:ring-0 cursor-pointer py-0 pl-0 pr-4 max-w-[150px] truncate"
                        >
                          <option value="">关联项目...</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                     </div>
                  </div>
                );
              })}
              {buckets.q2_major.length === 0 && <p className="text-xs text-zinc-500 italic">暂无重大战略项目。</p>}
            </div>
          </div>

          {/* Bucket 2: Money Pits (Bottom Priority - Divest) */}
          <div className={`
            rounded-xl border p-4 transition-all duration-300 flex-1 flex flex-col min-h-0 overflow-hidden
            ${buckets.q4_moneyPits.length > 0 
              ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50' 
              : 'bg-zinc-50 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800 opacity-60'}
          `}>
            <div className="flex justify-between items-center mb-3 shrink-0">
              <h3 className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 text-sm uppercase tracking-wide">
                <AlertOctagon size={16} /> 资源黑洞 (Divest)
              </h3>
              <span className="text-xs font-mono bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                {buckets.q4_moneyPits.length}
              </span>
            </div>
            {buckets.q4_moneyPits.length === 0 ? (
               <p className="text-xs text-zinc-500 italic">暂无低产出高耗时任务。资产健康。</p>
            ) : (
              <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
                {buckets.q4_moneyPits.map(t => {
                  // Calculate Global Priority Index
                  const priorityIndex = tasks.indexOf(t) + 1;

                  return (
                    <div 
                      key={t.id} 
                      className="bg-white dark:bg-zinc-950/80 p-3 rounded border border-rose-100 dark:border-rose-900/30 flex justify-between items-center group hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                      onMouseEnter={() => setHoveredTaskIds([t.id])}
                      onMouseLeave={() => setHoveredTaskIds([])}
                    >
                      <div className="flex items-center gap-3 truncate flex-1 mr-2">
                        <span className="text-xs font-mono font-bold text-zinc-400 dark:text-zinc-600 group-hover:text-rose-500 transition-colors">#{String(priorityIndex).padStart(2, '0')}</span>
                        <div className="truncate">
                          {t.isMasked ? (
                            <div className="text-sm text-zinc-400 dark:text-zinc-600 italic flex items-center gap-2">
                              <Lock size={12}/> Confidential
                            </div>
                          ) : (
                            <div className="text-sm text-zinc-800 dark:text-zinc-200 truncate">{t.title}</div>
                          )}
                          <div className="text-[10px] text-rose-500 dark:text-rose-400/70">ROI: {t.impactScore} / Cost: {t.effortScore}</div>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(t.id, TaskStatus.DIVESTED); }}
                        className="p-1.5 bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white rounded transition-colors"
                        title="立即剥离 (Divest)"
                      >
                        <Scissors size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
