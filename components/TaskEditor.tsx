import React, { useState, useRef } from 'react';
import { Task, SubTask } from '../types';
import { Project } from '../types';
import { X, Plus, Save, Trash2, Sliders, ListTodo, GripVertical, Briefcase, Eye, EyeOff } from 'lucide-react';

interface TaskEditorProps {
  task: Task;
  projects: Project[];
  onSave: (task: Task) => void;
  onCancel: () => void;
}

const TaskEditor: React.FC<TaskEditorProps> = ({ task, projects, onSave, onCancel }) => {
  const [editedTask, setEditedTask] = useState<Task>({ ...task });
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const addSubtask = () => {
    const newSubtask: SubTask = {
      id: Date.now().toString(),
      title: '',
      completed: false,
    };
    setEditedTask(prev => ({
      ...prev,
      subTasks: [...prev.subTasks, newSubtask]
    }));
  };

  const deleteSubtask = (id: string) => {
    setEditedTask(prev => ({
      ...prev,
      subTasks: prev.subTasks.filter(st => st.id !== id)
    }));
  };

  const handleSubtaskChange = (id: string, value: string) => {
    setEditedTask(prev => ({
      ...prev,
      subTasks: prev.subTasks.map(st => st.id === id ? { ...st, title: value } : st)
    }));
  };

  const handleDragStart = (e: React.DragEvent, position: number) => {
    dragItem.current = position;
  };

  const handleDragEnter = (e: React.DragEvent, position: number) => {
    dragOverItem.current = position;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    const copyListItems = [...editedTask.subTasks];
    const dragItemContent = copyListItems[dragItem.current];
    copyListItems.splice(dragItem.current, 1);
    copyListItems.splice(dragOverItem.current, 0, dragItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;
    
    setEditedTask(prev => ({
      ...prev,
      subTasks: copyListItems
    }));
  };

  const handleToggleShare = () => {
    setEditedTask(prev => ({ ...prev, isSharedToTeam: !prev.isSharedToTeam }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Changed max-w-lg to max-w-3xl for wider card */}
      <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Sliders size={18} />
            <h3 className="font-bold text-zinc-900 dark:text-white tracking-wide">调整提案配置</h3>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Share Toggle Switch */}
             <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-full p-1 pr-3">
               <button 
                 onClick={handleToggleShare}
                 className={`w-8 h-5 rounded-full relative transition-colors duration-300 ${editedTask.isSharedToTeam ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
               >
                 <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-300 ${editedTask.isSharedToTeam ? 'translate-x-3' : 'translate-x-0'}`}></div>
               </button>
               <span className={`text-xs font-bold flex items-center gap-1 ${editedTask.isSharedToTeam ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'}`}>
                 {editedTask.isSharedToTeam ? <Eye size={12} /> : <EyeOff size={12} />}
                 {editedTask.isSharedToTeam ? '已公开' : '私有'}
               </span>
             </div>

             <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors">
               <X size={20}/>
             </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1 bg-white dark:bg-black">
          
          {/* Title, Strategic Advice & Desc */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">提案名称 (Title)</label>
              <input 
                type="text" 
                value={editedTask.title}
                onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-zinc-900 dark:text-white focus:border-indigo-500 focus:outline-none transition-colors font-medium text-lg"
              />
            </div>

            {/* Added Strategic Advice Input */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">一句话战略建议 (Strategic Advice)</label>
              <input 
                type="text" 
                value={editedTask.strategicAdvice}
                onChange={(e) => setEditedTask({...editedTask, strategicAdvice: e.target.value})}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-zinc-600 dark:text-zinc-300 font-mono text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="例如：立即执行、委派给团队..."
              />
            </div>

            {/* Deadline Input */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">截止日期 (Deadline)</label>
              <input 
                type="date" 
                value={editedTask.deadline ? new Date(editedTask.deadline).toISOString().split('T')[0] : ''}
                onChange={(e) => setEditedTask({...editedTask, deadline: e.target.valueAsNumber})}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-zinc-900 dark:text-white focus:border-indigo-500 focus:outline-none transition-colors font-mono text-sm"
              />
            </div>

            {/* Project Association */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">关联项目 (Project)</label>
              <div className="relative">
                <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <select 
                  value={editedTask.projectId || ''}
                  onChange={(e) => setEditedTask({...editedTask, projectId: e.target.value || undefined})}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-white focus:border-indigo-500 focus:outline-none appearance-none"
                >
                  <option value="">-- 无关联项目 --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">详细描述 (Description)</label>
              <textarea 
                rows={4}
                value={editedTask.description}
                onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-zinc-700 dark:text-zinc-300 text-sm focus:border-indigo-500 focus:outline-none resize-none transition-colors leading-relaxed"
              />
            </div>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-6 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase">影响力 (ROI)</label>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/30 px-2 rounded border border-emerald-200 dark:border-emerald-900/50">{editedTask.impactScore.toFixed(1)}</span>
              </div>
              <input 
                type="range" min="1" max="10" step="0.1"
                value={editedTask.impactScore}
                onChange={(e) => setEditedTask({...editedTask, impactScore: Number(e.target.value)})}
                className="w-full accent-emerald-500 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-rose-600 dark:text-rose-500 uppercase">耗时 (Cost)</label>
                <span className="text-sm font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/30 px-2 rounded border border-rose-200 dark:border-rose-900/50">{editedTask.effortScore.toFixed(1)}</span>
              </div>
              <input 
                type="range" min="1" max="10" step="0.1"
                value={editedTask.effortScore}
                onChange={(e) => setEditedTask({...editedTask, effortScore: Number(e.target.value)})}
                className="w-full accent-rose-500 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Subtasks - Optimized Layout with Drag & Drop */}
          <div className="flex flex-col h-full min-h-0">
            <div className="flex justify-between items-center mb-3">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                <ListTodo size={14} /> 执行步骤 ({editedTask.subTasks.length})
              </label>
              <button 
                onClick={addSubtask}
                className="text-xs flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-2 py-1 rounded transition-colors border border-indigo-100 dark:border-indigo-500/20"
              >
                <Plus size={14} /> 添加步骤
              </button>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1 -mx-1">
              <div className="space-y-2 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg p-3 border border-zinc-100 dark:border-zinc-800">
                {editedTask.subTasks.map((st, idx) => (
                  <div 
                    key={st.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragEnter={(e) => handleDragEnter(e, idx)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex items-start gap-2 group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all cursor-move active:cursor-grabbing active:scale-[1.02] active:shadow-md"
                  >
                    {/* Grip Handle */}
                    <div className="mt-2 text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 cursor-grab active:cursor-grabbing">
                      <GripVertical size={14} />
                    </div>

                    <span className="text-xs text-zinc-400 dark:text-zinc-600 font-mono mt-2 w-4 text-center shrink-0 select-none">{idx + 1}.</span>
                    
                    <div className="flex-1 flex flex-col gap-1">
                      <textarea 
                        value={st.title}
                        onChange={(e) => handleSubtaskChange(st.id, e.target.value)}
                        placeholder="输入具体执行动作..."
                        rows={2}
                        className="w-full bg-transparent border-none text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-0 resize-none leading-relaxed placeholder-zinc-400"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400 uppercase font-bold">DDL:</span>
                        <input 
                          type="date"
                          value={st.deadline ? new Date(st.deadline).toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            const val = e.target.valueAsNumber;
                            setEditedTask(prev => ({
                              ...prev,
                              subTasks: prev.subTasks.map(s => s.id === st.id ? { ...s, deadline: isNaN(val) ? undefined : val } : s)
                            }));
                          }}
                          className="bg-transparent text-[10px] text-zinc-500 dark:text-zinc-400 border-none p-0 focus:ring-0"
                        />
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => deleteSubtask(st.id)}
                      className="text-zinc-300 hover:text-rose-500 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="删除步骤"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                {editedTask.subTasks.length === 0 && (
                  <div className="text-center py-8 text-xs text-zinc-400 dark:text-zinc-600 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded">
                    <p className="mb-1">AI 已留白</p>
                    <p>点击上方按钮自行规划执行细节</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            取消
          </button>
          <button 
            onClick={() => onSave(editedTask)} 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Save size={16} /> 保存变更
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskEditor;