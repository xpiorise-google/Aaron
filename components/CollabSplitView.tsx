
import React, { useState } from 'react';
import { Task, HandoverStatus, HandoverRecord, Attachment } from '../types';
import { 
  CheckCircle, 
  HelpCircle, 
  XCircle, 
  ArrowRight, 
  MessageSquare, 
  Clock, 
  User, 
  Send, 
  AlertCircle,
  Paperclip,
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  File,
  History,
  Trash2,
  Archive
} from 'lucide-react';

interface CollabSplitViewProps {
  tasks: Task[];
  currentUser: string;
  onRespond: (taskId: string, status: HandoverStatus, message: string) => void;
  onArchive: (taskId: string) => void;
  onClearHistory: () => void;
  // Sender specific actions
  onArchiveSender: (taskId: string) => void;
  onClearSenderHistory: () => void;
}

// --- Shared Helpers ---

const getFileIcon = (type: string) => {
  switch (type) {
    case 'excel': return <FileSpreadsheet size={10} className="text-emerald-600 dark:text-emerald-400" />;
    case 'word': return <FileText size={10} className="text-blue-600 dark:text-blue-400" />;
    case 'pdf': return <FileText size={10} className="text-rose-600 dark:text-rose-400" />;
    case 'image': return <FileImage size={10} className="text-purple-600 dark:text-purple-400" />;
    default: return <File size={10} className="text-zinc-500" />;
  }
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

const AttachmentPill: React.FC<{ att: Attachment }> = ({ att }) => (
  <div 
    onClick={(e) => { e.stopPropagation(); handleDownload(att); }}
    className="flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/50 text-[10px] cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all max-w-[120px]"
    title="点击预览/下载"
  >
    {getFileIcon(att.type)}
    <span className="truncate text-zinc-600 dark:text-zinc-300 font-medium">{att.name}</span>
  </div>
);

// --- History Log Row Component (Shared for Sender/Receiver) ---
const HistoryLogRow: React.FC<{
  task: Task;
  targetUser: string; 
  relation: 'FROM' | 'TO'; // Is the targetUser the sender (FROM) or receiver (TO)?
  onArchive: (taskId: string) => void;
  handover: HandoverRecord;
}> = ({ task, targetUser, relation, onArchive, handover }) => {
  const status = handover.status;
  
  return (
    <div className="group flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800 transition-all">
       {/* Status Icon */}
       <div className="shrink-0 mt-0.5">
          {status === HandoverStatus.ACCEPTED && <CheckCircle size={14} className="text-emerald-500 opacity-60 group-hover:opacity-100" />}
          {status === HandoverStatus.QUESTIONING && <HelpCircle size={14} className="text-amber-500 opacity-60 group-hover:opacity-100" />}
          {status === HandoverStatus.REJECTED && <XCircle size={14} className="text-rose-500 opacity-60 group-hover:opacity-100" />}
          {status === HandoverStatus.PENDING && <Clock size={14} className="text-zinc-400 opacity-60" />}
       </div>

       {/* Main Text Log */}
       <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate">{task.title}</span>
          <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono truncate">
             {relation === 'FROM' ? (
                <><span>@{handover.fromUser}</span><span>→</span></>
             ) : (
                <><span>→</span><span>@{handover.toUser}</span></>
             )}
             <span className="italic truncate max-w-[200px]">"{handover.response || 'No response'}"</span>
          </div>
       </div>

       {/* Timestamp & Actions */}
       <div className="flex items-center gap-3 shrink-0">
          <span className="text-[9px] text-zinc-300 dark:text-zinc-600 font-mono hidden sm:inline-block">
            {handover.responseTimestamp ? new Date(handover.responseTimestamp).toLocaleDateString() : '-'}
          </span>
          <button 
            onClick={() => onArchive(task.id)}
            className="text-zinc-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
            title="移除此记录"
          >
             <Trash2 size={12} />
          </button>
       </div>
    </div>
  );
};

// --- Helper Component: Received Card (Active) ---
const ReceivedCard: React.FC<{
  task: Task;
  currentUser: string;
  onRespond: (taskId: string, status: HandoverStatus, message: string) => void;
}> = ({ task, currentUser, onRespond }) => {
  const handover = task.handovers?.slice().reverse().find(h => h.toUser === currentUser);
  if (!handover) return null;

  const [interactionMode, setInteractionMode] = useState<'NONE' | 'QUESTION' | 'REJECT'>('NONE');
  const [inputText, setInputText] = useState('');

  const handleConfirm = () => {
    onRespond(task.id, HandoverStatus.ACCEPTED, "好的");
  };

  const handleSubmitInput = () => {
    if (!inputText.trim()) return;
    if (interactionMode === 'QUESTION') {
      onRespond(task.id, HandoverStatus.QUESTIONING, inputText);
    } else if (interactionMode === 'REJECT') {
      onRespond(task.id, HandoverStatus.REJECTED, inputText);
    }
    setInteractionMode('NONE');
    setInputText('');
  };

  return (
    <div className="p-4 rounded-xl border mb-4 shadow-sm transition-all bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">
            {handover.fromUser.substring(0,2)}
          </div>
          <div>
            <div className="text-xs text-zinc-500">来自 @{handover.fromUser}</div>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{task.title}</h4>
          </div>
        </div>
        <span className="text-[10px] text-zinc-400 font-mono">
           {new Date(handover.timestamp).toLocaleDateString()}
        </span>
      </div>

      {/* Attachments Display */}
      {task.attachments && task.attachments.length > 0 && (
        <div className="mb-3 pl-10">
           <div className="flex flex-wrap gap-2">
             {task.attachments.map(att => (
               <AttachmentPill key={att.id} att={att} />
             ))}
           </div>
        </div>
      )}

      {/* Message Bubble */}
      <div className="bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 mb-4 relative ml-10">
        <div className="absolute -top-1 left-2 w-2 h-2 bg-zinc-100 dark:bg-zinc-800/50 rotate-45 transform"></div>
        "{handover.remark}"
      </div>

      {/* Action Area */}
      <div className="space-y-3 pl-10">
           {/* Interaction Input Area */}
           {interactionMode !== 'NONE' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                 <textarea
                   autoFocus
                   className="w-full text-xs p-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black focus:outline-none focus:border-indigo-500 mb-2 resize-none"
                   placeholder={interactionMode === 'QUESTION' ? "请输入您的问题..." : "请输入拒绝理由..."}
                   rows={2}
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value)}
                 />
                 <div className="flex gap-2">
                   <button 
                     onClick={handleSubmitInput}
                     disabled={!inputText.trim()}
                     className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-black text-xs py-1.5 rounded font-medium disabled:opacity-50"
                   >
                     发送
                   </button>
                   <button 
                     onClick={() => setInteractionMode('NONE')}
                     className="px-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs py-1.5 rounded"
                   >
                     取消
                   </button>
                 </div>
              </div>
           )}

           {/* Main Buttons */}
           {interactionMode === 'NONE' && (
             <div className="grid grid-cols-3 gap-2">
               <button 
                 onClick={handleConfirm}
                 className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-900/50 transition-colors"
               >
                 <CheckCircle size={18} />
                 <span className="text-xs font-bold">收到 (好的)</span>
               </button>

               <button 
                 onClick={() => setInteractionMode('QUESTION')}
                 className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-100 dark:border-amber-900/50 transition-colors"
               >
                 <HelpCircle size={18} />
                 <span className="text-xs font-bold">有疑问</span>
               </button>

               <button 
                 onClick={() => setInteractionMode('REJECT')}
                 className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 border border-rose-100 dark:border-rose-900/50 transition-colors"
               >
                 <XCircle size={18} />
                 <span className="text-xs font-bold">拒绝任务</span>
               </button>
             </div>
           )}
      </div>
    </div>
  );
};

// --- Helper Component: Sent Card ---
const SentCard: React.FC<{
  task: Task;
  currentUser: string;
  onArchive: (taskId: string) => void;
}> = ({ task, currentUser, onArchive }) => {
  const handover = task.handovers?.slice().reverse().find(h => h.fromUser === currentUser);
  if (!handover) return null;

  const status = handover.status || HandoverStatus.PENDING;
  const hasFeedback = status !== HandoverStatus.PENDING;

  return (
    <div className={`p-4 rounded-xl border mb-4 shadow-sm bg-white dark:bg-zinc-900/40 ${hasFeedback ? 'border-indigo-200 dark:border-indigo-500/30' : 'border-zinc-200 dark:border-zinc-800'}`}>
       <div className="flex justify-between items-start mb-3">
         <div>
           <div className="text-xs text-zinc-500 flex items-center gap-1 mb-0.5">
             发送给 <ArrowRight size={10}/> <span className="font-bold text-zinc-700 dark:text-zinc-300">@{handover.toUser}</span>
           </div>
           <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm truncate max-w-[200px]">{task.title}</h4>
         </div>
         
         {/* Status Badge */}
         <div className={`px-2 py-1 rounded text-[10px] font-bold border flex items-center gap-1 ${
            status === HandoverStatus.PENDING ? 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' :
            status === HandoverStatus.ACCEPTED ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50' :
            status === HandoverStatus.QUESTIONING ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50' :
            'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/50'
         }`}>
            {status === HandoverStatus.PENDING && <><Clock size={10} /> 等待中</>}
            {status === HandoverStatus.ACCEPTED && <><CheckCircle size={10} /> 已确认</>}
            {status === HandoverStatus.QUESTIONING && <><HelpCircle size={10} /> 对方提问</>}
            {status === HandoverStatus.REJECTED && <><AlertCircle size={10} /> 被拒绝</>}
         </div>
       </div>

       {/* Attachments Display */}
       {task.attachments && task.attachments.length > 0 && (
        <div className="mb-3">
           <div className="flex flex-wrap gap-2">
             {task.attachments.map(att => (
               <AttachmentPill key={att.id} att={att} />
             ))}
           </div>
        </div>
       )}

       <div className="text-xs text-zinc-500 italic mb-3 pl-2 border-l-2 border-zinc-200 dark:border-zinc-700">
         我: "{handover.remark}"
       </div>

       {/* Feedback Area */}
       {hasFeedback && handover.response && (
         <div className="animate-in fade-in slide-in-from-bottom-2">
            <div className={`mt-2 p-2 rounded text-xs mb-3 ${
                status === HandoverStatus.ACCEPTED ? 'bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-200' :
                status === HandoverStatus.QUESTIONING ? 'bg-amber-50/50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-200' :
                'bg-rose-50/50 dark:bg-rose-900/10 text-rose-800 dark:text-rose-200'
            }`}>
              <span className="font-bold mr-1">@{handover.toUser}:</span>
              {handover.response}
            </div>
            
            {/* Archive Action for Sender */}
            <button 
              onClick={() => onArchive(task.id)}
              className="w-full py-1.5 flex items-center justify-center gap-2 rounded bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <Archive size={12} /> 阅毕归档 (Acknowledge)
            </button>
         </div>
       )}
    </div>
  );
};

const CollabSplitView: React.FC<CollabSplitViewProps> = ({ 
  tasks, 
  currentUser, 
  onRespond, 
  onArchive, 
  onClearHistory,
  onArchiveSender,
  onClearSenderHistory
}) => {
  
  // --- INBOX LOGIC (Received) ---
  const allReceived = tasks.filter(t => 
    t.handovers?.some(h => h.toUser === currentUser)
  );

  const pendingReceived = allReceived.filter(t => {
     const h = t.handovers?.slice().reverse().find(h => h.toUser === currentUser);
     return h && h.status === HandoverStatus.PENDING;
  }).sort((a,b) => b.createdAt - a.createdAt);

  const historyReceived = allReceived.filter(t => {
     const h = t.handovers?.slice().reverse().find(h => h.toUser === currentUser);
     // Show if status is NOT pending AND not yet archived by me
     return h && h.status !== HandoverStatus.PENDING && !h.receiverArchived;
  }).sort((a,b) => {
     const lastA = a.handovers?.slice().reverse().find(h => h.toUser === currentUser);
     const lastB = b.handovers?.slice().reverse().find(h => h.toUser === currentUser);
     return (lastB?.responseTimestamp || 0) - (lastA?.responseTimestamp || 0);
  });


  // --- OUTBOX LOGIC (Sent) ---
  const allSent = tasks.filter(t => 
    t.handovers?.some(h => h.fromUser === currentUser)
  );

  // Active Sent: Pending OR (Responded but NOT yet archived by sender)
  const activeSent = allSent.filter(t => {
     const h = t.handovers?.slice().reverse().find(h => h.fromUser === currentUser);
     // If pending, it's active. If responded but not archived, it's active (needs acknowledgement).
     if (!h) return false;
     if (h.status === HandoverStatus.PENDING) return true;
     return !h.senderArchived;
  }).sort((a,b) => b.createdAt - a.createdAt);

  // History Sent: Responded AND Archived by sender
  const historySent = allSent.filter(t => {
     const h = t.handovers?.slice().reverse().find(h => h.fromUser === currentUser);
     return h && h.status !== HandoverStatus.PENDING && h.senderArchived;
  }).sort((a,b) => {
     const lastA = a.handovers?.slice().reverse().find(h => h.fromUser === currentUser);
     const lastB = b.handovers?.slice().reverse().find(h => h.fromUser === currentUser);
     return (lastB?.responseTimestamp || 0) - (lastA?.responseTimestamp || 0);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      
      {/* Left Column: Received (Split into Pending & History) */}
      <div className="flex flex-col h-full">
        {/* SECTION A: PENDING INBOX */}
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
           <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded text-indigo-600 dark:text-indigo-400">
             <MessageSquare size={16} />
           </div>
           <div>
             <h3 className="text-sm font-bold text-zinc-900 dark:text-white">收件箱 (Inbox)</h3>
             <p className="text-[10px] text-zinc-500">等待处理的任务</p>
           </div>
           <span className="ml-auto text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-500">
             {pendingReceived.length}
           </span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-[200px]">
          {pendingReceived.length === 0 ? (
            <div className="text-center py-10 text-zinc-400 dark:text-zinc-600 text-xs italic border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-xl">
              太棒了！所有任务都已处理完毕。
            </div>
          ) : (
            pendingReceived.map(t => (
              <ReceivedCard 
                key={t.id} 
                task={t} 
                currentUser={currentUser} 
                onRespond={onRespond} 
              />
            ))
          )}
        </div>

        {/* SECTION B: HISTORY LOG (RECEIVED) */}
        <div className="mt-6 pt-4 border-t-2 border-zinc-100 dark:border-zinc-800/50 shrink-0 h-[40%] flex flex-col">
           <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                 <History size={12} /> 历史流转日志 (已处理)
              </h4>
              {historyReceived.length > 0 && (
                <button 
                  onClick={onClearHistory}
                  className="text-[10px] text-zinc-400 hover:text-rose-500 hover:underline transition-colors"
                >
                  清空所有记录
                </button>
              )}
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-lg p-1 border border-zinc-100 dark:border-zinc-800/30">
              {historyReceived.length === 0 ? (
                 <div className="h-full flex items-center justify-center text-[10px] text-zinc-300 dark:text-zinc-700 italic">
                    暂无历史记录
                 </div>
              ) : (
                 <div className="space-y-1">
                    {historyReceived.map(t => (
                       <HistoryLogRow 
                         key={t.id}
                         task={t}
                         targetUser={currentUser}
                         relation="FROM"
                         onArchive={onArchive}
                         handover={t.handovers!.slice().reverse().find(h => h.toUser === currentUser)!}
                       />
                    ))}
                 </div>
              )}
           </div>
        </div>
      </div>

      {/* Right Column: Sent (Split into Active & History) */}
      <div className="flex flex-col h-full lg:border-l lg:border-zinc-100 dark:lg:border-zinc-800/50 lg:pl-8">
        {/* SECTION C: ACTIVE OUTBOX */}
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
           <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400">
             <Send size={16} />
           </div>
           <div>
             <h3 className="text-sm font-bold text-zinc-900 dark:text-white">发件箱 (Outbox)</h3>
             <p className="text-[10px] text-zinc-500">追踪我发出的任务</p>
           </div>
           <span className="ml-auto text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-500">
             {activeSent.length}
           </span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-[200px]">
           {activeSent.length === 0 ? (
            <div className="text-center py-10 text-zinc-400 dark:text-zinc-600 text-xs italic">
              暂无进行中的协作任务
            </div>
          ) : (
            activeSent.map(t => (
              <SentCard 
                key={t.id} 
                task={t} 
                currentUser={currentUser} 
                onArchive={onArchiveSender}
              />
            ))
          )}
        </div>

        {/* SECTION D: HISTORY LOG (SENT) */}
        <div className="mt-6 pt-4 border-t-2 border-zinc-100 dark:border-zinc-800/50 shrink-0 h-[40%] flex flex-col">
           <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                 <CheckCircle size={12} /> 已获得反馈任务 (已归档)
              </h4>
              {historySent.length > 0 && (
                <button 
                  onClick={onClearSenderHistory}
                  className="text-[10px] text-zinc-400 hover:text-rose-500 hover:underline transition-colors"
                >
                  清空所有记录
                </button>
              )}
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-lg p-1 border border-zinc-100 dark:border-zinc-800/30">
              {historySent.length === 0 ? (
                 <div className="h-full flex items-center justify-center text-[10px] text-zinc-300 dark:text-zinc-700 italic">
                    暂无已归档的发件记录
                 </div>
              ) : (
                 <div className="space-y-1">
                    {historySent.map(t => (
                       <HistoryLogRow 
                         key={t.id}
                         task={t}
                         targetUser={currentUser}
                         relation="TO"
                         onArchive={onArchiveSender}
                         handover={t.handovers!.slice().reverse().find(h => h.fromUser === currentUser)!}
                       />
                    ))}
                 </div>
              )}
           </div>
        </div>

      </div>

    </div>
  );
};

export default CollabSplitView;
