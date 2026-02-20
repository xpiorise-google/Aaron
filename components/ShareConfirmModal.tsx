import React from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { Task } from '../types';

interface ShareConfirmModalProps {
  isOpen: boolean;
  task?: Task | null;
  onClose: () => void;
  onConfirm: () => void;
}

const ShareConfirmModal: React.FC<ShareConfirmModalProps> = ({ isOpen, task, onClose, onConfirm }) => {
  if (!isOpen) return null;

  const isUnsharing = task?.isSharedToTeam;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200 dark:border-zinc-800">
        <div className="p-6 text-center">
          <div className={`w-12 h-12 ${isUnsharing ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {isUnsharing ? <EyeOff size={24} /> : <Eye size={24} />}
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
            {isUnsharing ? '撤回公开任务？' : '确认公开任务？'}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {isUnsharing ? (
              <>
                撤回后，团队成员将无法在<br/>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">“任务大屏”</span>中看到此任务。
              </>
            ) : (
              <>
                公开的任务可以被团队中其他的成员在<br/>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">“任务大屏”</span>中看到。
              </>
            )}
          </p>
        </div>
        
        <div className="flex border-t border-zinc-100 dark:border-zinc-800">
          <button 
            onClick={onClose}
            className="flex-1 py-3 text-sm font-medium text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            取消
          </button>
          <div className="w-px bg-zinc-100 dark:bg-zinc-800"></div>
          <button 
            onClick={onConfirm}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${isUnsharing ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
          >
            {isUnsharing ? '确认撤回' : '确认公开'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareConfirmModal;
