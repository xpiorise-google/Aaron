
import React, { useRef, useState } from 'react';
import { Task, TaskStatus } from '../types';
import { Trash2, CheckCircle, Play, RotateCcw, Pencil, CalendarClock, GripVertical } from 'lucide-react';

interface ExecutiveListViewProps {
  tasks: Task[];
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onReorder?: (newTasks: Task[]) => void;
  readOnly?: boolean; // New Prop
}

const ExecutiveListView: React.FC<ExecutiveListViewProps> = ({ tasks, onUpdateStatus, onEdit, onReorder, readOnly = false }) => {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragActive, setDragActive] = useState<string | null>(null);

  const formatDate = (ts?: number) => {
    if (!ts) return '-';
    return new Date(ts).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  };

  const getTagStyle = (tag: string) => {
    const t = tag.toLowerCase();
    if (t.includes('p0') || t.includes('urgent') || t.includes('紧急') || t.includes('bug')) {
      return "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800";
    }
    if (t.includes('p1') || t.includes('important') || t.includes('重要')) {
      return "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    }
    if (t.includes('p2')) {
      return "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    }
    return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700";
  };

  // --- Drag & Drop Handlers ---
  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, position: number, taskId: string) => {
    if (readOnly || !onReorder) return; // Disable drag in readOnly
    dragItem.current = position;
    setDragActive(taskId);
    e.dataTransfer.effectAllowed = "move";
    // Slight delay to allow the ghost image to be captured before we modify styling
    setTimeout(() => {
       const el = e.target as HTMLElement;
       el.classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLTableRowElement>, position: number) => {
    if (readOnly || !onReorder) return;
    e.preventDefault(); // Necessary to allow dropping
    dragOverItem.current = position;
    
    if (dragItem.current === null || dragItem.current === position || !onReorder) return;

    const newList = [...tasks];
    const draggedItemContent = newList[dragItem.current];
    
    // Remove from old pos
    newList.splice(dragItem.current, 1);
    // Insert at new pos
    newList.splice(position, 0, draggedItemContent);
    
    dragItem.current = position;
    onReorder(newList);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
    if (readOnly || !onReorder) return;
    const el = e.target as HTMLElement;
    el.classList.remove('opacity-50');
    dragItem.current = null;
    dragOverItem.current = null;
    setDragActive(null);
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 backdrop-blur-sm shadow-sm transition-colors duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wider text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50">
              <th className="p-4 font-medium w-16 text-center">序号</th>
              {readOnly && <th className="p-4 font-medium w-24">创建人</th>}
              <th className="p-4 font-medium w-1/3">提案与战略</th>
              <th className="p-4 font-medium text-center">ROI 指数</th>
              <th className="p-4 font-medium text-center w-28">截止日期 (DDL)</th>
              <th className="p-4 font-medium text-center w-32">执行进度</th>
              {!readOnly && <th className="p-4 font-medium text-right">操作</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {tasks.map((task, index) => {
              const subTasks = task.subTasks || [];
              const completedSubs = subTasks.filter(s => s.completed).length;
              const totalSubs = subTasks.length;
              const progress = totalSubs === 0 ? 0 : (completedSubs / totalSubs) * 100;
              const isDragging = dragActive === task.id;

              return (
                <tr 
                  key={task.id} 
                  className={`group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${isDragging ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                  draggable={!!onReorder && !readOnly}
                  onDragStart={(e) => handleDragStart(e, index, task.id)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 group cursor-grab active:cursor-grabbing">
                       {/* Grip Handle - Visible on hover/drag */}
                       {onReorder && !readOnly && (
                         <div className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400">
                           <GripVertical size={14} />
                         </div>
                       )}
                       {/* Sequential Index */}
                       <span className={`font-mono text-sm font-bold ${task.status === TaskStatus.COMPLETED ? 'text-zinc-300 line-through' : 'text-zinc-900 dark:text-zinc-100'}`}>
                         {String(index + 1).padStart(2, '0')}
                       </span>
                    </div>
                  </td>
                  {readOnly && (
                    <td className="p-4">
                      <div className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                        {task.creatorId || 'UNKNOWN'}
                      </div>
                    </td>
                  )}
                  <td className="p-4">
                    <div className={`font-semibold text-base ${task.status === TaskStatus.COMPLETED ? 'text-zinc-400 dark:text-zinc-500 line-through' : 'text-zinc-900 dark:text-zinc-200'}`}>
                      {task.title}
                    </div>
                    {/* Tag Display Row */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {task.tags.map(tag => (
                          <span 
                            key={tag} 
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getTagStyle(tag)}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-zinc-500 mt-1 line-clamp-1 font-mono tracking-tight opacity-80">
                      {task.strategicAdvice}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                     <div className="relative group/scores flex items-center justify-center gap-4 bg-zinc-100 dark:bg-zinc-950/30 py-1.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800/50 w-fit mx-auto">
                        <div className="flex flex-col items-center">
                          <span className={`text-sm font-bold ${task.impactScore >= 7 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}`}>{task.impactScore}</span>
                          <span className="text-[9px] text-zinc-500 dark:text-zinc-600 uppercase tracking-widest">影响</span>
                        </div>
                        <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-800"></div>
                        <div className="flex flex-col items-center">
                          <span className={`text-sm font-bold ${task.effortScore <= 5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{task.effortScore}</span>
                           <span className="text-[9px] text-zinc-500 dark:text-zinc-600 uppercase tracking-widest">耗时</span>
                        </div>
                        
                        {/* ROI Overlay - visible on hover */}
                        <div className="absolute inset-0 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black rounded-lg flex items-center justify-center text-[10px] font-bold opacity-0 group-hover/scores:opacity-100 transition-opacity z-10 shadow-sm cursor-default">
                          ROI: {(task.effortScore > 0 ? (task.impactScore / task.effortScore).toFixed(1) : '∞')}
                        </div>
                     </div>
                  </td>
                  <td className="p-4 text-center">
                    {task.deadline ? (
                      <div className={`flex flex-col items-center gap-1 text-xs ${
                        task.deadline < Date.now() && task.status !== TaskStatus.COMPLETED 
                          ? 'text-rose-600 dark:text-rose-400 font-bold' 
                          : 'text-zinc-500 dark:text-zinc-400'
                      }`}>
                        <CalendarClock size={14} />
                        <span>{formatDate(task.deadline)}</span>
                      </div>
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-700 text-xs">-</span>
                    )}
                  </td>
                  <td className="p-4 text-center align-middle">
                    {totalSubs > 0 ? (
                      <div className="w-full max-w-[100px] mx-auto">
                        <div className="flex justify-between text-[10px] text-zinc-400 mb-1 font-medium">
                          <span>{completedSubs}/{totalSubs}项</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400 dark:text-zinc-700 italic">无子任务</span>
                    )}
                  </td>
                  {!readOnly && (
                    <td className="p-4 text-right">
                       <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          {task.status === TaskStatus.PROPOSED && (
                             <button 
                               onClick={() => onUpdateStatus(task.id, TaskStatus.IN_PROGRESS)} 
                               className="p-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-md transition-colors" 
                               title="启动"
                             >
                                <Play size={18} />
                             </button>
                          )}
                          {(task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.COMPLETED) && (
                             <button 
                               onClick={() => onUpdateStatus(task.id, task.status === TaskStatus.COMPLETED ? TaskStatus.IN_PROGRESS : TaskStatus.PROPOSED)} 
                               className="p-2 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-zinc-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-md transition-colors" 
                               title={task.status === TaskStatus.COMPLETED ? "重开" : "撤回"}
                             >
                                <RotateCcw size={18} />
                             </button>
                          )}
                          {task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.DIVESTED && (
                            <button 
                              onClick={() => onUpdateStatus(task.id, TaskStatus.COMPLETED)} 
                              className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 rounded-md transition-colors" 
                              title="完成"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                          
                          {/* Add Edit Button */}
                          {task.status !== TaskStatus.DIVESTED && (
                            <button 
                              onClick={() => onEdit(task)}
                              className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-zinc-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-md transition-colors" 
                              title="编辑"
                            >
                              <Pencil size={18} />
                            </button>
                          )}
  
                          {task.status === TaskStatus.DIVESTED ? (
                             <button 
                               onClick={() => onUpdateStatus(task.id, TaskStatus.PROPOSED)} 
                               className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-md transition-colors" 
                               title="恢复"
                             >
                                <RotateCcw size={18} />
                             </button>
                          ) : (
                            <button 
                              onClick={() => onUpdateStatus(task.id, TaskStatus.DIVESTED)} 
                              className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-md transition-colors" 
                              title="删除"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                       </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ExecutiveListView;
