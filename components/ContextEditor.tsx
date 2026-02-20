import React, { useState } from 'react';
import { UserContext } from '../types';
import { generateStrategicContext } from '../services/geminiService';
import { X, Save, Shield, Users, Target, Briefcase, Sparkles, Loader2 } from 'lucide-react';

interface ContextEditorProps {
  context: UserContext;
  onSave: (updatedContext: UserContext) => void;
  onCancel: () => void;
}

const ContextEditor: React.FC<ContextEditorProps> = ({ context, onSave, onCancel }) => {
  const [formData, setFormData] = useState<UserContext>({ ...context });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAIAutoFill = async () => {
    if (!formData.jobTitle) {
      alert("请先填写职位头衔 (Job Title)");
      return;
    }

    setIsGenerating(true);
    const generated = await generateStrategicContext(formData.jobTitle);
    
    setFormData(prev => {
      // Smart Merge: Only fill fields that are empty or zero (default state)
      const merged = { ...prev };
      
      // Helper to check if a field is "empty"
      const isEmpty = (val: any) => val === '' || val === 0 || val === null || val === undefined;

      if (isEmpty(merged.reportingTo) && generated.reportingTo) merged.reportingTo = generated.reportingTo;
      if (isEmpty(merged.quarterlyGoal) && generated.quarterlyGoal) merged.quarterlyGoal = generated.quarterlyGoal;
      if (isEmpty(merged.annualGoal) && generated.annualGoal) merged.annualGoal = generated.annualGoal;
      
      if (isEmpty(merged.directTeamSize) && generated.directTeamSize !== undefined) merged.directTeamSize = generated.directTeamSize;
      if (isEmpty(merged.directTeamSkills) && generated.directTeamSkills) merged.directTeamSkills = generated.directTeamSkills;
      
      if (isEmpty(merged.collabTeamSize) && generated.collabTeamSize !== undefined) merged.collabTeamSize = generated.collabTeamSize;
      if (isEmpty(merged.collabTeamSkills) && generated.collabTeamSkills) merged.collabTeamSkills = generated.collabTeamSkills;

      return merged;
    });
    
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
               <Shield size={20} />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white tracking-wide text-lg">战略背景配置</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">AI 将根据您的职位与资源提供定制建议</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors">
            <X size={24}/>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar flex-1 bg-white dark:bg-black">
          
          {/* Section 1: Role */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/30 pb-2 mb-2">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-bold uppercase tracking-wider">
                <Briefcase size={16} /> 职位定位
              </div>
              <button 
                onClick={handleAIAutoFill}
                disabled={isGenerating || !formData.jobTitle}
                className="text-xs flex items-center gap-1.5 text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-white bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-100 dark:border-indigo-500/20 shadow-sm"
                title="根据职位头衔自动补全空白字段（不会覆盖已有内容）"
              >
                {isGenerating ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />}
                {isGenerating ? 'AI 推演中...' : 'AI 智能补全'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 mb-1.5">当前职位 <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-black focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 placeholder-zinc-400 dark:placeholder-zinc-600 transition-all shadow-sm"
                  placeholder="例如：CEO, 产品总监 (必填)"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 mb-1.5">直接汇报对象</label>
                <input 
                  type="text" 
                  value={formData.reportingTo}
                  onChange={(e) => setFormData({...formData, reportingTo: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-black focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 placeholder-zinc-400 dark:placeholder-zinc-600 transition-all shadow-sm"
                  placeholder="例如：董事会, VP of Sales"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Goals */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm font-bold uppercase tracking-wider mb-2 border-b border-amber-100 dark:border-amber-900/30 pb-2">
              <Target size={16} /> 核心目标 (OKRs)
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 mb-1.5">本季度首要目标</label>
                <input 
                  type="text" 
                  value={formData.quarterlyGoal}
                  onChange={(e) => setFormData({...formData, quarterlyGoal: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-black focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 placeholder-zinc-400 dark:placeholder-zinc-600 transition-all shadow-sm"
                  placeholder="例如：提升转化率至 5%"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 mb-1.5">年度战略愿景</label>
                <textarea 
                  rows={2}
                  value={formData.annualGoal}
                  onChange={(e) => setFormData({...formData, annualGoal: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-zinc-900 dark:text-zinc-300 text-sm focus:bg-white dark:focus:bg-black focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 resize-none placeholder-zinc-400 dark:placeholder-zinc-600 transition-all shadow-sm leading-relaxed"
                  placeholder="例如：成为行业市场占有率第一"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Resources */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-bold uppercase tracking-wider mb-2 border-b border-blue-100 dark:border-blue-900/30 pb-2">
              <Users size={16} /> 团队与资源
            </div>
            
            {/* Direct Team */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800/50">
              <div className="flex justify-between mb-3">
                 <label className="text-xs font-bold text-zinc-900 dark:text-zinc-300">直接管理团队</label>
                 <span className="text-xs text-zinc-500">可直接下达指令</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-4">
                 <input 
                  type="number" 
                  value={formData.directTeamSize}
                  onChange={(e) => setFormData({...formData, directTeamSize: Number(e.target.value)})}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white text-center focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 shadow-sm placeholder-zinc-400 dark:placeholder-zinc-600"
                  placeholder="人数"
                />
                <input 
                  type="text" 
                  value={formData.directTeamSkills}
                  onChange={(e) => setFormData({...formData, directTeamSkills: e.target.value})}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 shadow-sm placeholder-zinc-400 dark:placeholder-zinc-600"
                  placeholder="核心技能配置 (如: 设计, 前端, 客服)"
                />
              </div>
            </div>

            {/* Collab Team */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800/50">
              <div className="flex justify-between mb-3">
                 <label className="text-xs font-bold text-zinc-900 dark:text-zinc-300">协作/调用团队</label>
                 <span className="text-xs text-zinc-500">跨部门或外包资源</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-4">
                 <input 
                  type="number" 
                  value={formData.collabTeamSize}
                  onChange={(e) => setFormData({...formData, collabTeamSize: Number(e.target.value)})}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white text-center focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 shadow-sm placeholder-zinc-400 dark:placeholder-zinc-600"
                  placeholder="人数"
                />
                <input 
                  type="text" 
                  value={formData.collabTeamSkills}
                  onChange={(e) => setFormData({...formData, collabTeamSkills: e.target.value})}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 shadow-sm placeholder-zinc-400 dark:placeholder-zinc-600"
                  placeholder="可用技能 (如: 法务, 运维, 财务)"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
          <button 
            onClick={onCancel} 
            className="px-5 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            取消
          </button>
          <button 
            onClick={() => onSave(formData)} 
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-500/20 dark:shadow-emerald-900/20 transition-all hover:scale-105"
          >
            <Save size={16} /> 保存配置
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContextEditor;