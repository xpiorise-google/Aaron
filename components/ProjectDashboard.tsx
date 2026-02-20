import React, { useState, useMemo } from 'react';
import { Project, ProjectType, Task } from '../types';
import { Plus, Pencil, Trash2, Search, BarChart3, Target, Briefcase, Settings, X, Calendar, User, LayoutGrid, List } from 'lucide-react';

interface ProjectDashboardProps {
  projects: Project[];
  sharedTasks: Task[]; // New Prop
  isAdmin: boolean;
  onSaveProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ 
  projects, 
  sharedTasks,
  isAdmin,
  onSaveProject,
  onDeleteProject
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Project>>({
    type: ProjectType.PRODUCT,
    impactScore: 5,
    effortScore: 5
  });

  const handleOpenModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData(project);
    } else {
      setEditingProject(null);
      setFormData({
        type: ProjectType.PRODUCT,
        impactScore: 5,
        effortScore: 5,
        subType: '',
        name: '',
        description: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description) return;

    const project: Project = {
      id: editingProject?.id || crypto.randomUUID(),
      name: formData.name,
      description: formData.description,
      type: formData.type || ProjectType.PRODUCT,
      subType: formData.subType || '',
      impactScore: Number(formData.impactScore),
      effortScore: Number(formData.effortScore),
      creatorId: 'admin', // In real app, use current user
      createdAt: editingProject?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    onSaveProject(project);
    setShowModal(false);
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setShowTaskModal(true);
  };

  const projectTasks = useMemo(() => {
    if (!selectedProject) return [];
    // Filter sharedTasks to find those associated with this project
    // Note: sharedTasks contains ALL shared tasks from the org.
    // We need to ensure we are matching by projectId.
    // Also, per requirement, these must be "public" tasks (which sharedTasks are).
    return sharedTasks.filter(t => t.projectId === selectedProject.id);
  }, [selectedProject, sharedTasks]);

  const sortedProjects = useMemo(() => {
    let result = [...projects];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.subType.toLowerCase().includes(q)
      );
    }

    // Sort by I/E Ratio
    result.sort((a, b) => {
      const ratioA = a.effortScore > 0 ? a.impactScore / a.effortScore : 0;
      const ratioB = b.effortScore > 0 ? b.impactScore / b.effortScore : 0;
      return ratioB - ratioA;
    });

    return result;
  }, [projects, searchQuery]);

  const getTypeColor = (type: ProjectType) => {
    switch (type) {
      case ProjectType.PRODUCT: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case ProjectType.MARKETING: return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
      case ProjectType.SALES: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case ProjectType.OPERATIONS: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      default: return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
    }
  };

  const [viewMode, setViewMode] = useState<'BOARD' | 'LIST'>('BOARD');

  // ... (existing code)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="搜索项目..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800/50 p-1 rounded-xl border border-zinc-100 dark:border-zinc-800">
             <button 
               onClick={() => setViewMode('BOARD')}
               className={`p-2 rounded-lg transition-all ${viewMode === 'BOARD' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
               title="看板视图"
             >
               <LayoutGrid size={16} />
             </button>
             <button 
               onClick={() => setViewMode('LIST')}
               className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
               title="列表视图"
             >
               <List size={16} />
             </button>
           </div>

           {isAdmin && (
             <button 
               onClick={() => handleOpenModal()}
               className="px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg"
             >
               <Plus size={16} /> 新建项目
             </button>
           )}
        </div>
      </div>

      {/* Project Grid / List */}
      {viewMode === 'BOARD' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedProjects.length === 0 ? (
            <div className="col-span-full py-20 text-center text-zinc-500 dark:text-zinc-600">
              <Briefcase size={48} className="mx-auto mb-4 opacity-20" />
              <p>暂无进行中的项目。</p>
            </div>
          ) : (
            sortedProjects.map((project, index) => {
              const ratio = project.effortScore > 0 ? (project.impactScore / project.effortScore).toFixed(1) : '∞';
              return (
                <div 
                  key={project.id} 
                  onClick={() => handleProjectClick(project)}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 relative group hover:shadow-md transition-all cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700"
                >
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                     <div className="text-xs font-mono font-bold text-zinc-400">#{index + 1}</div>
                     {isAdmin && (
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                         <button onClick={() => handleOpenModal(project)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-indigo-500"><Pencil size={12} /></button>
                         <button onClick={() => { if(confirm('确定删除?')) onDeleteProject(project.id); }} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-rose-500"><Trash2 size={12} /></button>
                       </div>
                     )}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getTypeColor(project.type)}`}>
                        {project.type}
                      </span>
                      {project.subType && (
                        <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                          {project.subType}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight mb-1">{project.name}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 h-10">{project.description}</p>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                     <div className="flex-1">
                       <div className="flex items-end gap-1 mb-1">
                         <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{ratio}</span>
                         <span className="text-[10px] text-zinc-400 font-medium uppercase mb-1">ROI Ratio</span>
                       </div>
                       <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                         <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(Number(ratio) * 10, 100)}%` }}></div>
                       </div>
                     </div>
                     
                     <div className="flex gap-3 text-xs font-mono text-zinc-500">
                       <div className="flex flex-col items-center">
                         <span className="font-bold text-zinc-900 dark:text-zinc-300">{project.impactScore}</span>
                         <span className="text-[9px] uppercase">Impact</span>
                       </div>
                       <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800"></div>
                       <div className="flex flex-col items-center">
                         <span className="font-bold text-zinc-900 dark:text-zinc-300">{project.effortScore}</span>
                         <span className="text-[9px] uppercase">Effort</span>
                       </div>
                     </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 backdrop-blur-sm shadow-sm transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wider text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50">
                  <th className="p-4 font-medium w-16 text-center">序号</th>
                  <th className="p-4 font-medium w-32">类型</th>
                  <th className="p-4 font-medium w-1/3">项目名称</th>
                  <th className="p-4 font-medium text-center">ROI Ratio</th>
                  <th className="p-4 font-medium text-center w-28">Impact</th>
                  <th className="p-4 font-medium text-center w-28">Effort</th>
                  {isAdmin && <th className="p-4 font-medium text-right w-24">操作</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {sortedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="p-8 text-center text-zinc-500">暂无项目</td>
                  </tr>
                ) : (
                  sortedProjects.map((project, index) => {
                    const ratio = project.effortScore > 0 ? (project.impactScore / project.effortScore).toFixed(1) : '∞';
                    return (
                      <tr 
                        key={project.id} 
                        onClick={() => handleProjectClick(project)}
                        className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                      >
                        <td className="p-4 text-center">
                          <span className="font-mono text-sm font-bold text-zinc-400">#{index + 1}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider w-fit ${getTypeColor(project.type)}`}>
                              {project.type}
                            </span>
                            {project.subType && (
                              <span className="text-[10px] font-medium text-zinc-500">
                                {project.subType}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-zinc-900 dark:text-white mb-0.5">{project.name}</div>
                          <div className="text-xs text-zinc-500 line-clamp-1">{project.description}</div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{ratio}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-zinc-900 dark:text-zinc-300">{project.impactScore}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-zinc-900 dark:text-zinc-300">{project.effortScore}</span>
                        </td>
                        {isAdmin && (
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => handleOpenModal(project)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-indigo-500 rounded-md transition-colors" title="编辑">
                                <Pencil size={16} />
                              </button>
                              <button onClick={() => { if(confirm('确定删除?')) onDeleteProject(project.id); }} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-zinc-400 hover:text-rose-500 rounded-md transition-colors" title="删除">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task List Modal */}
      {showTaskModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowTaskModal(false)}>
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Briefcase size={18} className="text-indigo-500" />
                  {selectedProject.name}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">关联的公开任务清单</p>
              </div>
              <button onClick={() => setShowTaskModal(false)} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {projectTasks.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <p>暂无关联的公开任务。</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projectTasks.map(task => (
                    <div key={task.id} className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-zinc-900 dark:text-white">{task.title}</h4>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          {task.status}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">{task.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          <span className="font-medium text-zinc-700 dark:text-zinc-300 uppercase">{task.creatorId || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>{task.deadline ? new Date(task.deadline).toLocaleDateString() : '无 DDL'}</span>
                        </div>
                        <div className="flex items-center gap-1 ml-auto">
                          <span className="font-bold text-indigo-600">ROI: {(task.effortScore > 0 ? task.impactScore / task.effortScore : 0).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                {editingProject ? '编辑项目' : '新建项目'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600"><Settings size={18} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">类型</label>
                  <select 
                    value={formData.type} 
                    onChange={(e) => setFormData({...formData, type: e.target.value as ProjectType})}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm"
                  >
                    {Object.values(ProjectType).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">子类型</label>
                  <input 
                    type="text" 
                    value={formData.subType}
                    onChange={(e) => setFormData({...formData, subType: e.target.value})}
                    placeholder="e.g. Q1 Campaign"
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">项目名称</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">项目介绍</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 flex justify-between">
                    Impact (I) <span className="text-indigo-600">{formData.impactScore}</span>
                  </label>
                  <input 
                    type="range" 
                    min="1" max="10" step="0.1"
                    value={formData.impactScore}
                    onChange={(e) => setFormData({...formData, impactScore: Number(e.target.value)})}
                    className="w-full accent-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 flex justify-between">
                    Effort (E) <span className="text-rose-600">{formData.effortScore}</span>
                  </label>
                  <input 
                    type="range" 
                    min="1" max="10" step="0.1"
                    value={formData.effortScore}
                    onChange={(e) => setFormData({...formData, effortScore: Number(e.target.value)})}
                    className="w-full accent-rose-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">取消</button>
                <button type="submit" className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black text-sm font-bold rounded-lg hover:opacity-90">保存项目</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDashboard;
