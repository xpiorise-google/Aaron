import React, { useState, useRef, useEffect } from 'react';
import { Task, TeamMember } from '../types';
import { CheckCircle, Send, AtSign, X } from 'lucide-react';

interface CompletionModalProps {
  task: Task;
  currentUser: string;
  teamMembers: TeamMember[]; // New prop to receive dynamic members
  onConfirm: (taskId: string, remark: string, mentionedUser?: TeamMember) => void;
  onCancel: () => void;
}

const CompletionModal: React.FC<CompletionModalProps> = ({ task, currentUser, teamMembers, onConfirm, onCancel }) => {
  const [text, setText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Filter members excluding current user
  const availableMembers = teamMembers.filter(m => m.id !== currentUser);
  const filteredMembers = availableMembers.filter(m => 
    m.name.toLowerCase().includes(mentionQuery.toLowerCase()) || 
    m.role.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setText(newVal);

    // Detect if the last character typed is '@' or if we are typing a name after '@'
    const lastAtPos = newVal.lastIndexOf('@');
    if (lastAtPos !== -1) {
      const textAfterAt = newVal.substring(lastAtPos + 1);
      // If there is no space after @, we assume user is searching for a name
      if (!textAfterAt.includes(' ')) {
        setShowMentions(true);
        setMentionQuery(textAfterAt);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMember = (member: TeamMember) => {
    const lastAtPos = text.lastIndexOf('@');
    if (lastAtPos !== -1) {
      const newText = text.substring(0, lastAtPos) + `@${member.name} `;
      setText(newText);
      setShowMentions(false);
      textareaRef.current?.focus();
    }
  };

  const handleSubmit = () => {
    // Basic logic to find who was mentioned in the final text
    // We look for the first valid member mentioned in the text
    let mentionedMember: TeamMember | undefined;
    
    for (const member of availableMembers) {
      if (text.includes(`@${member.name}`)) {
        mentionedMember = member;
        break; // Assume single assignee for this MVP
      }
    }

    // Extract the remark. If mentioned, the remark is loosely everything. 
    // In a real NLP system we might extract specific sentences.
    // Here we just pass the full text.
    onConfirm(task.id, text, mentionedMember);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-xl shadow-2xl flex flex-col relative transition-colors duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-start bg-zinc-50 dark:bg-zinc-900/50 rounded-t-xl">
          <div>
            <h3 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-lg">
              <CheckCircle size={20} /> 完成并交接
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
              任务 "<span className="text-zinc-900 dark:text-white font-medium">{task.title}</span>" 将被标记为完成。
            </p>
          </div>
          <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors">
            <X size={20}/>
          </button>
        </div>

        <div className="p-6 bg-white dark:bg-black">
          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            补充留言 / 协作交接
          </label>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleInput}
              rows={4}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 dark:focus:ring-indigo-500/50 resize-none leading-relaxed transition-colors"
              placeholder="输入工作总结。使用 @ 提及同事进行工作交接..."
            />
            
            {/* Mention Dropdown */}
            {showMentions && filteredMembers.length > 0 && (
              <div className="absolute left-0 bottom-full mb-2 w-64 max-h-48 overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-30 animate-in slide-in-from-bottom-2">
                <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900/50 text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-700 sticky top-0 backdrop-blur-sm">
                  选择协作成员
                </div>
                {filteredMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => insertMember(member)}
                    className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-indigo-50 dark:hover:bg-indigo-600/20 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors group border-b border-zinc-100 dark:border-zinc-800/50 last:border-0"
                  >
                    <div className={`w-6 h-6 rounded-full ${member.avatarColor} flex items-center justify-center text-[10px] text-white font-bold shrink-0`}>
                      {member.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{member.name}</div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400/70 truncate">{member.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            <div className="absolute bottom-3 right-3 text-zinc-400 hover:text-indigo-500 dark:text-zinc-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">
              <AtSign size={16} onClick={() => {
                setText(prev => prev + '@');
                setShowMentions(true);
                setMentionQuery('');
                textareaRef.current?.focus();
              }}/>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-100 dark:border-blue-900/30">
             <div className="mt-0.5 min-w-[14px]">💡</div>
             <p>
               提示：输入 <span className="text-indigo-600 dark:text-indigo-400 font-mono">@</span> 可指派同事。例如：<br/>
               <span className="italic opacity-70">"@yuna 财务报表已生成，请复核数据准确性。"</span><br/>
               这将自动在对方的“协作”列表中创建一条记录。
             </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3 rounded-b-xl">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            暂不补充
          </button>
          <button 
            onClick={handleSubmit} 
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-500/20 dark:shadow-emerald-900/20 transition-all hover:scale-105"
          >
            <Send size={16} /> 确认完成
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompletionModal;