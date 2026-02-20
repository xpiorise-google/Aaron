
import React, { useState, useRef } from 'react';
import { Task, TaskStatus, HandoverRecord, PREDEFINED_TAGS, Attachment, Project } from '../types';
import { 
  Trash2, CheckCircle, Circle, Play, RotateCcw, Pencil, GripHorizontal, 
  MessageSquareQuote, CalendarClock, X, Zap, Layers, AlertOctagon, Coffee, 
  Tag, Plus, ChevronDown, ChevronUp, ListTodo, Paperclip, FileText, 
  FileSpreadsheet, FileImage, File, Loader2, UploadCloud, EyeOff, Lock, Eye, Briefcase
} from 'lucide-react';

interface ExecutiveCardProps {
  task: Task;
  projects?: Project[]; // New Prop
  priorityIndex?: number; // New Prop for Global Sequence
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdateTags?: (id: string, tags: string[]) => void;
  onUpdateAttachments?: (id: string, attachments: Attachment[]) => void;
  onRequestComplete?: (task: Task) => void; 
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete?: (id: string) => void;
  isHovered?: boolean;
  isDragging?: boolean;
  onHover?: () => void;
  onLeave?: () => void;
  currentViewer?: string; 
  onDirectUpdate?: (task: Task) => void; 
  onToggleMask?: () => void;
  onShareToTeam?: (task: Task) => void;
  readOnly?: boolean; // New Prop for View-Only Mode
}

const ExecutiveCard: React.FC<ExecutiveCardProps> = ({ 
  task, 
  projects, // New Prop
  priorityIndex,
  onUpdateStatus, 
  onUpdateTags,
  onRequestComplete,
  onToggleSubtask, 
  onEdit, 
  onDelete,
  isHovered,
  isDragging,
  onHover,
  onLeave,
  currentViewer,
  onDirectUpdate,
  onToggleMask,
  onShareToTeam,
  readOnly = false
}) => {
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDDLPopover, setShowDDLPopover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ddlButtonRef = useRef<HTMLDivElement>(null);

  // Helper to determine file type icon and color
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'excel': return <FileSpreadsheet size={12} className="text-emerald-600 dark:text-emerald-400" />;
      case 'word': return <FileText size={12} className="text-blue-600 dark:text-blue-400" />;
      case 'pdf': return <FileText size={12} className="text-rose-600 dark:text-rose-400" />;
      case 'image': return <FileImage size={12} className="text-purple-600 dark:text-purple-400" />;
      default: return <File size={12} className="text-zinc-500" />;
    }
  };

  const getFileBadgeColor = (type: string) => {
    switch (type) {
      case 'excel': return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30';
      case 'word': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30';
      case 'pdf': return 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/30';
      case 'image': return 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/30';
      default: return 'bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800';
    }
  };

  const processFile = async (file: File) => {
    // 1. Validation
    if (file.size > 10 * 1024 * 1024) {
      alert(`文件 ${file.name} 过大！最大支持 10MB。`);
      return null;
    }

    // 2. Type Detection
    let type: Attachment['type'] = 'other';
    if (file.type.includes('image')) type = 'image';
    else if (file.type.includes('pdf')) type = 'pdf';
    else if (file.type.includes('sheet') || file.type.includes('excel')) type = 'excel';
    else if (file.type.includes('word') || file.type.includes('document')) type = 'word';

    // 3. Convert to Base64
    return new Promise<Attachment>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          id: crypto.randomUUID(),
          name: file.name,
          type,
          mimeType: file.type,
          size: file.size,
          data: reader.result as string,
          createdAt: Date.now()
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      const newAttachments: Attachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const attachment = await processFile(files[i]);
        if (attachment) newAttachments.push(attachment);
      }

      if (newAttachments.length > 0) {
        const updatedTask = {
          ...task,
          attachments: [...(task.attachments || []), ...newAttachments]
        };
        
        if (onDirectUpdate) {
           onDirectUpdate(updatedTask);
        } else {
           onEdit(updatedTask);
        }
      }
    } catch (e) {
      console.error("Upload failed", e);
      alert("上传失败，请重试。");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragOver) setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files.length > 0) {
      e.preventDefault();
      handleFiles(e.clipboardData.files);
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    const updatedTask = {
      ...task,
      attachments: task.attachments?.filter(a => a.id !== attachmentId)
    };
    if (onDirectUpdate) onDirectUpdate(updatedTask);
  };

  const handleDownload = (att: Attachment) => {
    if (att.type === 'image' || att.type === 'pdf') {
      const win = window.open();
      if (win) {
        win.document.write(`<iframe src="${att.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      }
    } else {
      const link = document.createElement("a");
      link.href = att.data;
      link.download = att.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isDragging) {
    return (
      <div className="h-full min-h-[200px] w-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900/30 rounded-xl flex items-center justify-center opacity-60 animate-pulse">
        <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Drop Here</span>
      </div>
    );
  }

  // Styles & Icons Logic
  const isQuickWin = task.impactScore >= 5 && task.effortScore <= 5;
  const isMajorProject = task.impactScore >= 5 && task.effortScore > 5;
  const isMoneyPit = task.impactScore < 5 && task.effortScore > 5;
  const isProposed = task.status === TaskStatus.PROPOSED;
  const isCompleted = task.status === TaskStatus.COMPLETED;

  const project = projects?.find(p => p.id === task.projectId);

  let relevantHandover: HandoverRecord | undefined;
  if (currentViewer && task.handovers) {
    relevantHandover = task.handovers.find(h => h.toUser === currentViewer) || task.handovers[task.handovers.length - 1];
  }

  let baseClasses = "relative p-5 rounded-xl border transition-all duration-300 group select-none h-full flex flex-col outline-none cursor-grab active:cursor-grabbing";
  let bgClasses = "";
  let badgeColor = "";
  let icon = <Coffee size={14} />; 

  if (isProposed) {
    bgClasses = "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 shadow-sm";
    badgeColor = "bg-zinc-100 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800";
    if (isQuickWin) icon = <Zap size={14} className="text-zinc-400" />;
    else if (isMajorProject) icon = <Layers size={14} className="text-zinc-400" />;
    else if (isMoneyPit) icon = <AlertOctagon size={14} className="text-zinc-400" />;
  } else {
    if (isQuickWin) {
      bgClasses = "bg-emerald-50/80 dark:bg-zinc-900 border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-700/60 shadow-sm";
      badgeColor = "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50";
      icon = <Zap size={14} className="text-emerald-500" />;
    } else if (isMajorProject) {
      bgClasses = "bg-amber-50/80 dark:bg-zinc-900 border-amber-200 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700/60 shadow-sm";
      badgeColor = "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50";
      icon = <Layers size={14} className="text-amber-500" />;
    } else if (isMoneyPit) {
      bgClasses = "bg-rose-50/50 dark:bg-zinc-900 border-rose-200 dark:border-rose-900/40 hover:border-rose-300 dark:hover:border-rose-800 shadow-sm";
      badgeColor = "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50";
      icon = <AlertOctagon size={14} className="text-rose-500" />;
    } else {
      bgClasses = "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 shadow-sm";
      badgeColor = "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400";
    }
  }

  if (isCompleted) bgClasses = "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 opacity-75";
  if (relevantHandover && currentViewer === relevantHandover.toUser && !isCompleted) {
    bgClasses = "bg-indigo-50/50 dark:bg-zinc-900 border-indigo-200 dark:border-indigo-500/50 shadow-md shadow-indigo-100 dark:shadow-none";
  }
  if (isHovered) bgClasses = "bg-white dark:bg-black border-zinc-500 ring-1 ring-zinc-500 shadow-xl scale-[1.02] z-10";

  const formatDate = (ts?: number) => ts ? new Date(ts).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '';

  const getTagStyle = (tag: string) => {
    if (isProposed) return "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700";
    const t = tag.toLowerCase();
    if (t.includes('p0') || t.includes('urgent') || t.includes('紧急')) return "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50";
    if (t.includes('p1') || t.includes('important')) return "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50";
    return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700";
  };

  const addTag = (tag: string) => {
    if (!onUpdateTags) return;
    const currentTags = task.tags || [];
    if (!currentTags.includes(tag)) onUpdateTags(task.id, [...currentTags, tag]);
    setShowTagSelector(false);
    setCustomTagInput('');
  };

  const removeTag = (tag: string) => {
    if (!onUpdateTags) return;
    onUpdateTags(task.id, (task.tags || []).filter(t => t !== tag));
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleMask) {
      onToggleMask();
    }
  };

  return (
    <div 
      className={`${baseClasses} ${bgClasses} pb-7 relative overflow-hidden`} 
      onMouseEnter={onHover}
      onMouseLeave={() => { onLeave && onLeave(); setShowTagSelector(false); }}
      onDoubleClick={handleDoubleClick}
      tabIndex={0}
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Priority Badge - VISUAL SYNC WITH LIST VIEW */}
      {priorityIndex !== undefined && !isCompleted && !task.isMasked && (
        <div className="absolute top-0 left-0 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black text-[10px] font-mono font-bold px-2 py-1 rounded-br-lg z-20 shadow-sm border-r border-b border-zinc-200 dark:border-zinc-800">
          #{String(priorityIndex).padStart(2, '0')}
        </div>
      )}

      {/* File Drop Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-indigo-50/90 dark:bg-zinc-900/90 backdrop-blur-sm border-2 border-dashed border-indigo-500 rounded-xl flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-400 animate-in fade-in duration-200 pointer-events-none">
          <UploadCloud size={48} className="mb-2 animate-bounce" />
          <span className="font-bold text-lg tracking-wide">释放添加附件</span>
        </div>
      )}

      {/* Header Info - Scores are ALWAYS visible */}
      <div className="flex justify-between items-start mb-4 relative z-20 pl-8"> 
        <div className="flex flex-wrap gap-2 items-center">
          
          <div className="relative group/scores flex gap-2">
            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${badgeColor}`}>
              {icon}
              <span>I: {task.impactScore.toFixed(1)}</span>
            </div>
            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border shadow-sm ${isProposed ? 'bg-zinc-50 dark:bg-zinc-950 text-zinc-400 border-zinc-200 dark:border-zinc-800' : 'bg-white dark:bg-zinc-950 text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}>
              E: {task.effortScore.toFixed(1)}
            </div>
            {/* ROI Overlay - visible on hover */}
            <div className="absolute inset-0 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black rounded flex items-center justify-center text-[10px] font-bold opacity-0 group-hover/scores:opacity-100 transition-opacity z-10 shadow-sm cursor-default">
              ROI: {(task.effortScore > 0 ? (task.impactScore / task.effortScore).toFixed(1) : '∞')}
            </div>
          </div>
          
          {/* Tags hidden when masked */}
          {!task.isMasked && (
            <>
              {task.tags?.map(tag => (
                 <div key={tag} className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center justify-center group/tag cursor-default ${getTagStyle(tag)}`}>
                   <span>{tag}</span>
                   {!readOnly && <button onClick={(e) => { e.stopPropagation(); removeTag(tag); }} className="w-0 overflow-hidden opacity-0 group-hover/tag:w-3 group-hover/tag:opacity-100 group-hover/tag:ml-1 transition-all hover:text-rose-600 outline-none flex items-center"><X size={10} /></button>}
                 </div>
              ))}
              {onUpdateTags && !readOnly && (
                <div className="relative">
                  <button onClick={(e) => { e.stopPropagation(); setShowTagSelector(!showTagSelector); }} className={`w-5 h-5 rounded-full flex items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400 hover:text-indigo-500 hover:border-indigo-400 transition-all ${showTagSelector ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}><Plus size={10} /></button>
                  {showTagSelector && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                      <input type="text" autoFocus value={customTagInput} onChange={(e) => setCustomTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && customTagInput.trim()) addTag(customTagInput.trim()); }} className="w-full text-xs p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-indigo-500 text-zinc-900 dark:text-white mb-2" placeholder="输入标签..." />
                      <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                        {PREDEFINED_TAGS.map(t => (
                          <button key={t} onClick={() => addTag(t)} className={`w-full text-left px-2 py-1 rounded text-[10px] hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between ${task.tags?.includes(t) ? 'text-indigo-500 font-bold' : 'text-zinc-600 dark:text-zinc-400'}`} disabled={task.tags?.includes(t)}>{t} {task.tags?.includes(t) && <CheckCircle size={10} />}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Masked Indicator */}
          {task.isMasked && (
             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] text-zinc-500 font-medium select-none">
                <EyeOff size={10} /> 敏感信息隐藏
             </div>
          )}
        </div>

        {/* Dates hidden when masked */}
        {!task.isMasked && (
          <div className="ml-auto relative group/date">
             <div 
               ref={ddlButtonRef}
               className={`relative text-[10px] px-2 py-1 rounded border flex items-center gap-1 shadow-sm shrink-0 transition-colors ${
                 task.deadline 
                   ? (task.deadline < Date.now() && task.status !== TaskStatus.COMPLETED ? 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30' : 'text-zinc-600 bg-zinc-50 border-zinc-200 dark:text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700')
                   : 'text-zinc-400 bg-transparent border-dashed border-zinc-300 dark:border-zinc-700'
               } ${!readOnly ? 'cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600' : 'cursor-default'}`}
               title={readOnly ? "截止日期" : "点击设置截止日期 (DDL)"}
               onClick={(e) => {
                 if (readOnly) return;
                 e.stopPropagation();
                 setShowDDLPopover(!showDDLPopover);
               }}
             >
               <CalendarClock size={10} />
               <span>{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No DDL'}</span>
             </div>

             {/* Custom DDL Popover - Only if NOT readOnly */}
             {!readOnly && showDDLPopover && (
               <div 
                 className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 p-3 animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-2"
                 onClick={(e) => e.stopPropagation()}
               >
                 <div className="flex justify-between items-center mb-1">
                   <span className="text-xs font-bold text-zinc-500 uppercase">设置截止日期</span>
                   <button onClick={() => setShowDDLPopover(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"><X size={14} /></button>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-2">
                   <button 
                     onClick={() => {
                       const d = new Date();
                       d.setDate(d.getDate() + 1);
                       const updatedTask = { ...task, deadline: d.getTime() };
                       if (onDirectUpdate) onDirectUpdate(updatedTask); else onEdit(updatedTask);
                       setShowDDLPopover(false);
                     }}
                     className="text-[10px] px-2 py-1.5 bg-zinc-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded border border-zinc-200 dark:border-zinc-700 transition-colors"
                   >
                     1天后 (明天)
                   </button>
                   <button 
                     onClick={() => {
                       const d = new Date();
                       d.setDate(d.getDate() + 3);
                       const updatedTask = { ...task, deadline: d.getTime() };
                       if (onDirectUpdate) onDirectUpdate(updatedTask); else onEdit(updatedTask);
                       setShowDDLPopover(false);
                     }}
                     className="text-[10px] px-2 py-1.5 bg-zinc-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded border border-zinc-200 dark:border-zinc-700 transition-colors"
                   >
                     3天后
                   </button>
                   <button 
                     onClick={() => {
                       const d = new Date();
                       d.setDate(d.getDate() + 7);
                       const updatedTask = { ...task, deadline: d.getTime() };
                       if (onDirectUpdate) onDirectUpdate(updatedTask); else onEdit(updatedTask);
                       setShowDDLPopover(false);
                     }}
                     className="text-[10px] px-2 py-1.5 bg-zinc-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded border border-zinc-200 dark:border-zinc-700 transition-colors"
                   >
                     1周后
                   </button>
                   <button 
                     onClick={() => {
                       const d = new Date();
                       d.setMonth(d.getMonth() + 1);
                       const updatedTask = { ...task, deadline: d.getTime() };
                       if (onDirectUpdate) onDirectUpdate(updatedTask); else onEdit(updatedTask);
                       setShowDDLPopover(false);
                     }}
                     className="text-[10px] px-2 py-1.5 bg-zinc-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded border border-zinc-200 dark:border-zinc-700 transition-colors"
                   >
                     1个月后
                   </button>
                 </div>

                 <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 mt-1">
                   <label className="text-[10px] text-zinc-400 mb-1 block">具体日期</label>
                   <input 
                      type="date" 
                      className="w-full text-xs p-1.5 rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                      onChange={(e) => {
                        const val = e.target.valueAsNumber;
                        if (!isNaN(val)) {
                          const updatedTask = { ...task, deadline: val };
                          if (onDirectUpdate) onDirectUpdate(updatedTask); else onEdit(updatedTask);
                          setShowDDLPopover(false);
                        }
                      }}
                      value={task.deadline ? new Date(task.deadline).toLocaleDateString('en-CA') : ''}
                   />
                 </div>
                 
                 {task.deadline && (
                   <button 
                     onClick={() => {
                        const updatedTask = { ...task, deadline: undefined };
                        if (onDirectUpdate) onDirectUpdate(updatedTask); else onEdit(updatedTask);
                        setShowDDLPopover(false);
                     }}
                     className="text-[10px] text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 w-full text-center mt-1 hover:underline"
                   >
                     清除截止日期
                   </button>
                 )}
               </div>
             )}
          </div>
        )}
      </div>

      <div className="flex-1 relative z-10">
        {task.isMasked ? (
          /* MASKED VIEW */
          <div className="flex flex-col items-center justify-center h-full min-h-[160px] space-y-3 select-none opacity-80" title="双击卡片以显示详情">
             <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-1">
                <Lock size={20} className="text-zinc-400 dark:text-zinc-500" />
             </div>
             <div className="text-center">
               <div className="text-sm font-black text-zinc-300 dark:text-zinc-700 uppercase tracking-[0.2em] mb-1">Confidential</div>
               <div className="h-2 w-32 bg-zinc-100 dark:bg-zinc-800 rounded-full mx-auto mb-2"></div>
               <div className="h-2 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full mx-auto"></div>
             </div>
             <div className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-4 animate-pulse">
               Double-click to reveal
             </div>
          </div>
        ) : (
          /* NORMAL VIEW */
          <>
            {/* ADDED cursor-text to allow selection */}
            <div className="mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={`font-semibold text-lg leading-tight cursor-text ${isCompleted ? 'text-zinc-400 line-through' : isProposed ? 'text-zinc-500' : 'text-zinc-900 dark:text-zinc-100'}`}>{task.title}</h4>
                {project && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 whitespace-nowrap">
                    <Briefcase size={10} />
                    {project.name}
                  </span>
                )}
              </div>
            </div>
            <p className={`text-xs font-mono mb-2 cursor-text ${isProposed ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'}`}>{task.strategicAdvice}</p>
            <p className={`text-sm mb-4 leading-relaxed cursor-text ${isProposed ? 'text-zinc-400' : 'text-zinc-600 dark:text-zinc-300'}`}>{task.description}</p>
            
            {relevantHandover && (
              <div className="mb-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-500/30 rounded-lg p-3 relative shadow-sm cursor-text">
                 <div className="absolute -top-2 -left-2 bg-indigo-600 text-white p-1 rounded-full shadow-md"><MessageSquareQuote size={12} /></div>
                 <div className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 mb-1">来自 @{relevantHandover.fromUser}:</div>
                 <p className="text-sm text-indigo-900 dark:text-indigo-200 italic">"{relevantHandover.remark}"</p>
              </div>
            )}

            {/* --- ATTACHMENTS SECTION --- */}
            <div className="mb-4">
               {(task.attachments && task.attachments.length > 0) && (
                 <div className="space-y-3 mb-3">
                   {/* 1. Image Grid */}
                   {task.attachments.some(a => a.type === 'image') && (
                     <div className="grid grid-cols-4 gap-2">
                       {task.attachments.filter(a => a.type === 'image').map(att => (
                         <div key={att.id} onClick={(e) => { e.stopPropagation(); handleDownload(att); }} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 cursor-pointer group/img hover:ring-2 hover:ring-indigo-500 transition-all bg-zinc-100 dark:bg-zinc-800">
                           <img src={att.data} alt={att.name} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
                           <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors" />
                           {!readOnly && <button onClick={(e) => { e.stopPropagation(); handleRemoveAttachment(att.id); }} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-rose-500"><X size={10} /></button>}
                         </div>
                       ))}
                     </div>
                   )}
                   {/* 2. File List */}
                   {task.attachments.some(a => a.type !== 'image') && (
                     <div className="flex flex-wrap gap-2">
                       {task.attachments.filter(a => a.type !== 'image').map(att => (
                         <div key={att.id} onClick={(e) => { e.stopPropagation(); handleDownload(att); }} className={`flex items-center gap-1.5 px-2 py-1.5 rounded border text-[10px] cursor-pointer hover:shadow-md transition-all group/att ${getFileBadgeColor(att.type)}`} title="点击下载">
                           {getFileIcon(att.type)}
                           <span className="truncate max-w-[100px] font-medium text-zinc-700 dark:text-zinc-300">{att.name}</span>
                           {!readOnly && <button onClick={(e) => { e.stopPropagation(); handleRemoveAttachment(att.id); }} className="ml-1 text-zinc-400 hover:text-rose-500 opacity-0 group-hover/att:opacity-100 transition-opacity"><X size={10} /></button>}
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               )}

               {/* Add Attachment Button */}
               {!isCompleted && !isProposed && !readOnly && (
                 <div className="flex items-center gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFiles(e.target.files)} accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx" multiple />
                    <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/50" title="点击上传或直接拖拽文件到卡片">
                      {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Paperclip size={12} />}
                      <span>{task.attachments?.length ? '继续添加' : '添加附件'}</span>
                    </button>
                    <span className="text-[9px] text-zinc-300 dark:text-zinc-700 select-none hidden group-hover:inline-block animate-in fade-in">支持 Drag & Drop / Paste</span>
                 </div>
               )}
            </div>

            {/* Subtasks */}
            {task.subTasks.length > 0 && (
              <div className="mb-4">
                 <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className={`flex items-center gap-2 text-xs font-medium transition-colors w-full p-2 rounded-lg select-none ${isProposed ? 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800' : 'text-zinc-500 hover:text-indigo-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
                   <ListTodo size={14} /><span>{isExpanded ? '收起执行步骤' : `查看 ${task.subTasks.length} 项执行细节`}</span>{isExpanded ? <ChevronUp size={14} className="ml-auto"/> : <ChevronDown size={14} className="ml-auto"/>}
                 </button>
                {isExpanded && (
                  <div className="mt-2 space-y-2 pl-4 border-l-2 border-zinc-200 dark:border-zinc-700/50 ml-1 animate-in slide-in-from-top-2 fade-in duration-200">
                    {(task.subTasks || []).map(st => (
                      <div key={st.id} onClick={(e) => { if(!readOnly) { e.stopPropagation(); onToggleSubtask(task.id, st.id); } }} className={`flex items-center gap-3 text-sm group/item transition-colors ${readOnly ? 'cursor-default' : 'cursor-pointer'} ${isProposed ? 'text-zinc-400' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}>
                        {st.completed ? <CheckCircle size={14} className="text-emerald-500 shrink-0" /> : <Circle size={14} className={`text-zinc-300 dark:text-zinc-600 shrink-0 ${!readOnly && 'group-hover/item:text-amber-500'}`} />}
                        <div className="flex-1 flex items-center justify-between">
                          <span className={st.completed ? 'line-through decoration-zinc-400' : ''}>{st.title}</span>
                          {st.deadline && (
                            <span className={`text-[10px] font-mono ml-2 ${st.deadline < Date.now() && !st.completed ? 'text-rose-500' : 'text-zinc-400'}`}>
                              {new Date(st.deadline).toLocaleDateString(undefined, {month:'numeric', day:'numeric'})}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Control Panel - Hidden when masked to prevent accidental changes */}
      {!task.isMasked && !readOnly && (
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800/50 mt-2 opacity-60 group-hover:opacity-100 transition-opacity relative z-10">
          <div className="flex items-center gap-2">
            {task.status === TaskStatus.PROPOSED && <button onClick={() => onUpdateStatus(task.id, TaskStatus.IN_PROGRESS)} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium px-2 py-1 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded"><Play size={14} /> 启动</button>}
            {task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.DIVESTED && <button onClick={() => onRequestComplete ? onRequestComplete(task) : onUpdateStatus(task.id, TaskStatus.COMPLETED)} className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-medium px-2 py-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded"><CheckCircle size={14} /> 完成</button>}
            {(task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.COMPLETED) && <button onClick={() => onUpdateStatus(task.id, task.status === TaskStatus.COMPLETED ? TaskStatus.IN_PROGRESS : TaskStatus.PROPOSED)} className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 font-medium px-2 py-1 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded"><RotateCcw size={14} /> 撤回</button>}
          </div>
          <div className="flex items-center gap-2">
            {/* Share to Team Button */}
            {onShareToTeam && !task.isMasked && (
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   onShareToTeam(task);
                 }}
                 className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors ${
                   task.isSharedToTeam 
                     ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40' 
                     : 'text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
                 }`}
                 title={task.isSharedToTeam ? "已公开 (点击撤回)" : "同步到团队任务大屏"}
               >
                 <Eye size={14} /> {task.isSharedToTeam ? "已公开" : "公开"}
               </button>
            )}

            {task.status !== TaskStatus.DIVESTED && <button onClick={() => onEdit(task)} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-indigo-600 font-medium px-2 py-1 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded"><Pencil size={14} /> 编辑</button>}
            {task.status !== TaskStatus.DIVESTED && <button onClick={() => onUpdateStatus(task.id, TaskStatus.DIVESTED)} className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-medium px-2 py-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded"><Trash2 size={14} /> 删除</button>}
            {task.status === TaskStatus.DIVESTED && <button onClick={() => onUpdateStatus(task.id, TaskStatus.PROPOSED)} className="flex items-center gap-1 text-xs text-emerald-600 font-medium px-2 py-1 hover:bg-emerald-50 rounded"><RotateCcw size={14} /> 恢复</button>}
            {task.status === TaskStatus.DIVESTED && onDelete && <button onClick={() => onDelete(task.id)} className="flex items-center gap-1 text-xs text-rose-500 font-medium px-2 py-1 hover:bg-rose-50 rounded"><X size={14} /> 彻底删除</button>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveCard;
