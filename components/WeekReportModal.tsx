import React, { useState, useMemo } from 'react';
import { Task } from '../types';
import { X, FileText, CheckSquare, Square, Download, Sparkles, ChevronRight, ArrowLeft } from 'lucide-react';

interface WeekReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekLabel: string;
  dateRangeLabel: string;
  tasks: Task[];
  currentUser: string;
  userTitle?: string;
}

const WeekReportModal: React.FC<WeekReportModalProps> = ({ 
  isOpen, 
  onClose, 
  weekLabel, 
  dateRangeLabel, 
  tasks,
  currentUser,
  userTitle
}) => {
  const [step, setStep] = useState<'SELECT' | 'PREVIEW'>('SELECT');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(tasks.map(t => t.id)));

  if (!isOpen) return null;

  const toggleTask = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectedTasks = tasks.filter(t => selectedIds.has(t.id));

  // --- HTML Generation for Word Export ---
  const generateReportHTML = () => {
    const totalImpact = selectedTasks.reduce((acc, t) => acc + t.impactScore, 0);
    const avgROI = selectedTasks.length > 0 ? (totalImpact / selectedTasks.length).toFixed(1) : '0';
    
    // Sort by Impact (High Value first)
    const sortedTasks = [...selectedTasks].sort((a, b) => b.impactScore - a.impactScore);

    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Weekly Report</title>
        <style>
          body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #1f2937; }
          h1 { font-size: 18pt; color: #111827; border-bottom: 2px solid #4f46e5; padding-bottom: 8px; margin-bottom: 20px; }
          h2 { font-size: 14pt; color: #3730a3; margin-top: 24px; margin-bottom: 12px; font-weight: bold; background-color: #eef2ff; padding: 5px 10px; }
          h3 { font-size: 12pt; color: #111827; margin-top: 16px; margin-bottom: 4px; font-weight: bold; }
          p { margin: 4px 0; }
          .meta { color: #6b7280; font-size: 10pt; margin-bottom: 30px; }
          .summary-box { border: 1px solid #e5e7eb; padding: 15px; background-color: #f9fafb; margin-bottom: 20px; }
          .metric { font-weight: bold; color: #4f46e5; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #f3f4f6; text-align: left; padding: 8px; border: 1px solid #d1d5db; font-size: 10pt; }
          td { padding: 8px; border: 1px solid #d1d5db; vertical-align: top; font-size: 10pt; }
          .tag { font-size: 9pt; color: #fff; background-color: #6b7280; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-right: 4px; }
          .tag-p0 { background-color: #dc2626; }
          .subtask { color: #4b5563; font-style: italic; font-size: 10pt; margin-left: 15px; }
          .completed-task { color: #059669; }
          .footer { margin-top: 40px; font-size: 9pt; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 10px; }
          ul { margin: 0; padding-left: 20px; }
          li { margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <h1>周工作汇报 (Weekly Report)</h1>
        
        <div class="meta">
          <p><strong>汇报人：</strong>${currentUser} ${userTitle ? `(${userTitle})` : ''}</p>
          <p><strong>汇报周期：</strong>${dateRangeLabel} (${weekLabel})</p>
          <p><strong>生成时间：</strong>${new Date().toLocaleDateString()}</p>
        </div>

        <div class="summary-box">
          <p><strong>本周核心摘要 (Executive Summary)：</strong></p>
          <p>本周共完成 <strong>${selectedTasks.length}</strong> 项关键任务，累计产出影响力指数 (Total Impact) 为 <span class="metric">${totalImpact.toFixed(1)}</span>，平均单项 ROI 为 <span class="metric">${avgROI}</span>。</p>
        </div>

        <h2>一、 重点交付与成果 (Key Deliverables)</h2>
        <p>以下为本周完成的高优先级事项，按影响力排序：</p>
        
        <table>
          <thead>
            <tr>
              <th style="width: 25%">任务名称</th>
              <th style="width: 10%">标签</th>
              <th style="width: 50%">执行细节 (Execution Details)</th>
              <th style="width: 15%">ROI 指数</th>
            </tr>
          </thead>
          <tbody>
            ${sortedTasks.map(t => `
              <tr>
                <td><strong>${t.title}</strong></td>
                <td>${(t.tags || []).map(tag => `<span class="tag ${tag.toLowerCase().includes('p0') ? 'tag-p0' : ''}">${tag}</span>`).join(' ')}</td>
                <td>
                  ${t.subTasks.length > 0 ? 
                    `<ul>
                      ${t.subTasks.map(st => `
                        <li class="${st.completed ? 'completed-task' : ''}">
                          ${st.title} ${st.completed ? '(已完成)' : ''}
                        </li>
                      `).join('')}
                    </ul>` 
                    : '<p style="color: #9ca3af; font-style: italic;">无具体执行步骤记录</p>'
                  }
                </td>
                <td style="text-align: center;">${t.impactScore}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>二、 下周规划建议 (Next Steps)</h2>
        <p>基于本周产出，建议下周重点关注以下方向（请在此处补充下周计划）：</p>
        <ul>
          <li>[待补充]</li>
          <li>[待补充]</li>
        </ul>

        <h2>三、 风险与支持 (Risks & Support)</h2>
        <p>当前项目是否存在阻碍或需要协调的资源：</p>
        <ul>
          <li>暂无重大风险。</li>
        </ul>

        <div class="footer">Generated by The Executive ROI System</div>
      </body>
      </html>
    `;
  };

  const handleDownload = () => {
    const html = generateReportHTML();
    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword'
    });
    
    // Format Filename: User_Name_StartDate.doc
    // Extract start date from "YYYY年MM月DD日 - ..."
    const startDate = dateRangeLabel.split(' - ')[0] || dateRangeLabel;
    // Capitalize username to simulate "Name" if not available elsewhere, or use it as is.
    const nameLabel = currentUser.charAt(0).toUpperCase() + currentUser.slice(1);
    const fileName = `${currentUser}_${nameLabel}_${startDate}.doc`;
    
    // Create download link
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col h-[85vh] transition-colors duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 rounded-lg border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
               <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white tracking-wide text-lg">周报生成器</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">选择关键成果，生成专业汇报文档 ({weekLabel})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X size={24}/>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* STEP 1: SELECT */}
          {step === 'SELECT' && (
             <div className="w-full h-full flex flex-col p-6 animate-in slide-in-from-left-4 fade-in duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <CheckSquare size={16} /> 勾选本周高价值产出 ({selectedIds.size}/{tasks.length})
                  </h4>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedIds(new Set(tasks.map(t => t.id)))}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      全选
                    </button>
                    <span className="text-slate-300">|</span>
                    <button 
                      onClick={() => setSelectedIds(new Set())}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:underline"
                    >
                      清空
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-lg">
                  {tasks.map(task => (
                    <div 
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`p-4 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer transition-colors flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 ${selectedIds.has(task.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                    >
                      <div className={`mt-1 ${selectedIds.has(task.id) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600'}`}>
                        {selectedIds.has(task.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className={`font-medium text-sm ${selectedIds.has(task.id) ? 'text-slate-900 dark:text-slate-200' : 'text-slate-500 dark:text-slate-500'}`}>{task.title}</span>
                          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">I:{task.impactScore}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{task.strategicAdvice}</p>
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {task.tags.map(tag => (
                              <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          )}

          {/* STEP 2: PREVIEW */}
          {step === 'PREVIEW' && (
             <div className="w-full h-full flex flex-col p-6 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Sparkles size={16} /> 文档预览 (Word 格式)
                  </h4>
                </div>
                
                {/* Simulated Word Preview */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-100 dark:bg-slate-950 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-inner">
                  <div className="max-w-[210mm] mx-auto bg-white text-slate-900 p-[20mm] shadow-lg min-h-full">
                    {/* Render minimal HTML preview here matching the logic above */}
                    <h1 className="text-xl font-bold border-b-2 border-indigo-600 pb-2 mb-4">周工作汇报 (Weekly Report)</h1>
                    <div className="text-xs text-slate-500 mb-6 grid grid-cols-2 gap-2">
                       <p>汇报人：{currentUser}</p>
                       <p>周期：{dateRangeLabel}</p>
                    </div>

                    <div className="bg-slate-50 p-4 mb-6 border border-slate-200 text-sm">
                       <p className="font-bold mb-1">本周核心摘要：</p>
                       <p>完成 {selectedTasks.length} 项任务，总影响力 {selectedTasks.reduce((a,b)=>a+b.impactScore,0).toFixed(1)}。</p>
                    </div>

                    <h2 className="text-lg font-bold text-indigo-800 bg-indigo-50 px-2 py-1 mb-2 mt-4">一、 重点交付与成果</h2>
                    <table className="w-full text-xs border-collapse border border-slate-300 mt-2">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="border p-2 text-left">任务</th>
                          <th className="border p-2 text-left">执行细节</th>
                          <th className="border p-2 text-center">ROI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTasks.sort((a,b) => b.impactScore - a.impactScore).map(t => (
                          <tr key={t.id}>
                            <td className="border p-2 font-medium align-top">{t.title}</td>
                            <td className="border p-2 text-slate-600 align-top">
                               {t.subTasks.length > 0 ? (
                                 <ul className="list-disc list-inside">
                                   {t.subTasks.map(st => (
                                     <li key={st.id} className={st.completed ? "text-emerald-600" : ""}>
                                       {st.title} {st.completed && "(已完成)"}
                                     </li>
                                   ))}
                                 </ul>
                               ) : (
                                 <span className="italic text-slate-400">无具体执行步骤</span>
                               )}
                            </td>
                            <td className="border p-2 text-center align-top">{t.impactScore}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <h2 className="text-lg font-bold text-indigo-800 bg-indigo-50 px-2 py-1 mb-2 mt-6">二、 下周规划建议</h2>
                    <p className="text-xs text-slate-400 italic">[此处内容将在 Word 下载后由您补充]</p>
                  </div>
                </div>
             </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-between items-center shrink-0">
          
          {step === 'SELECT' ? (
             <div className="text-xs text-slate-500">
                已选 {selectedIds.size} 项 / 共 {tasks.length} 项
             </div>
          ) : (
            <button 
              onClick={() => setStep('SELECT')} 
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={14} /> 返回修改
            </button>
          )}

          <div className="flex gap-3 ml-auto">
             {step === 'SELECT' ? (
               <button 
                onClick={() => setStep('PREVIEW')}
                disabled={selectedIds.size === 0}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 下一步：预览 <ChevronRight size={16} />
               </button>
             ) : (
               <button 
                onClick={handleDownload}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-500/20"
               >
                 <Download size={16} /> 导出 Word (.doc)
               </button>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default WeekReportModal;