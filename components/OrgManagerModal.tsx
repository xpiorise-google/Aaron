import React, { useState } from 'react';
import { UserProfile, Organization } from '../types';
import { addOrgUser, removeOrgUser, updateOrgUser, getOrganization, updateOrganizationName } from '../services/databaseService';
import { X, Users, UserPlus, Trash2, Shield, KeyRound, Save, Crown, AlertTriangle, Pencil, Building, Lock } from 'lucide-react';

interface OrgManagerModalProps {
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUser: string;
}

const AVATAR_COLORS = [
  'bg-slate-500', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 
  'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500',
  'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500',
  'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
];

const OrgManagerModal: React.FC<OrgManagerModalProps> = ({ orgId, isOpen, onClose, currentUser }) => {
  const [org, setOrg] = useState<Organization | null>(getOrganization(orgId));
  const [view, setView] = useState<'LIST' | 'ADD' | 'EDIT' | 'PAY'>('LIST');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  
  // Org Name Edit State
  const [isEditingOrgName, setIsEditingOrgName] = useState(false);
  const [tempOrgName, setTempOrgName] = useState('');

  // Form State
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formPass, setFormPass] = useState('');

  if (!isOpen || !org) return null;

  const refresh = () => {
    setOrg(getOrganization(orgId));
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Plan Limit Check
    if (org.users.length >= 3) {
      setView('PAY');
      return;
    }

    const newUser: UserProfile = {
      id: formName.toLowerCase().replace(/\s+/g, ''),
      name: formName,
      role: formRole || 'Team Member',
      password: formPass,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
    };

    const success = addOrgUser(org.id, newUser);
    if (success) {
      refresh();
      setView('LIST');
      resetForm();
    } else {
      alert("User ID already exists or failed to create.");
    }
  };

  const handleDelete = (userId: string) => {
    if (window.confirm('Are you sure you want to remove this user? Their data will be lost.')) {
      removeOrgUser(org.id, userId);
      refresh();
    }
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    updateOrgUser(org.id, {
      ...editingUser,
      password: formPass || editingUser.password, // Only update if new pass provided
      role: formRole
    });
    refresh();
    setView('LIST');
    resetForm();
  };

  const startEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormRole(user.role);
    setFormPass(''); // Empty means don't change
    setView('EDIT');
  };

  const handleOrgNameSave = () => {
    if (tempOrgName.trim()) {
       updateOrganizationName(org.id, tempOrgName.trim());
       setIsEditingOrgName(false);
       refresh();
    }
  };

  const startOrgNameEdit = () => {
    setTempOrgName(org.name);
    setIsEditingOrgName(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormRole('');
    setFormPass('');
    setEditingUser(null);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col transition-colors duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 rounded-lg border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
               <Shield size={20} />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white tracking-wide text-lg flex items-center gap-2">
                组织管理 (Admin)
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors">
            <X size={24}/>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-white dark:bg-black min-h-[300px]">
          
          {/* VIEW: USER LIST */}
          {view === 'LIST' && (
            <div className="space-y-6">
               
               {/* Organization Details Card */}
               <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Building size={12} /> Organization Details
                    </div>
                    {isEditingOrgName ? (
                      <div className="flex items-center gap-2">
                         <button onClick={() => setIsEditingOrgName(false)} className="text-xs text-zinc-500 hover:text-zinc-800">取消</button>
                         <button onClick={handleOrgNameSave} className="text-xs text-indigo-600 font-bold hover:underline">保存</button>
                      </div>
                    ) : (
                      <button onClick={startOrgNameEdit} className="text-zinc-400 hover:text-indigo-500 transition-colors" title="修改组织名称">
                        <Pencil size={12} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                       {isEditingOrgName ? (
                         <input 
                           type="text" 
                           autoFocus
                           value={tempOrgName}
                           onChange={(e) => setTempOrgName(e.target.value)}
                           className="w-full bg-white dark:bg-black border border-indigo-500 rounded px-2 py-1 text-lg font-bold text-zinc-900 dark:text-white focus:outline-none"
                         />
                       ) : (
                         <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{org.name}</h2>
                       )}
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-xs text-zinc-500">Org ID:</span>
                       <span className="text-xs font-mono bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-400 font-bold flex items-center gap-1">
                         {org.id} <Lock size={8} className="opacity-50"/>
                       </span>
                    </div>
                  </div>
               </div>

               {/* Member List */}
               <div>
                 <div className="flex justify-between items-center mb-4">
                   <h4 className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                     <Users size={16} /> 成员列表
                   </h4>
                   <button 
                     onClick={() => { resetForm(); setView('ADD'); }}
                     className="text-xs flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors font-bold shadow-sm"
                   >
                     <UserPlus size={14} /> 添加成员
                   </button>
                 </div>

                 <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                   {org.users.map(u => (
                     <div key={u.id} className="flex items-center justify-between p-3 border border-zinc-100 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${u.avatarColor} flex items-center justify-center text-white text-xs font-bold`}>
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                              {u.name}
                              {u.isAdmin && <Crown size={12} className="text-amber-500" />}
                            </div>
                            <div className="text-[10px] text-zinc-500 uppercase">{u.role}</div>
                          </div>
                        </div>
                        
                        {u.id !== currentUser && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => startEdit(u)}
                               className="p-1.5 text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded"
                               title="修改密码/信息"
                             >
                               <KeyRound size={14} />
                             </button>
                             <button 
                               onClick={() => handleDelete(u.id)}
                               className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded"
                               title="移除成员"
                             >
                               <Trash2 size={14} />
                             </button>
                          </div>
                        )}
                        {u.id === currentUser && (
                          <span className="text-[10px] text-zinc-400 italic pr-2">You</span>
                        )}
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          )}

          {/* VIEW: ADD USER */}
          {view === 'ADD' && (
            <form onSubmit={handleAddUser} className="animate-in slide-in-from-right-4 duration-300">
               <h4 className="font-bold text-zinc-700 dark:text-zinc-300 mb-4">添加新成员</h4>
               <div className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">用户名 (Display Name)</label>
                   <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2 rounded text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. Jason" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">初始密码</label>
                   <input type="text" required value={formPass} onChange={e => setFormPass(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2 rounded text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. 123456" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">职位 (Role)</label>
                   <input type="text" value={formRole} onChange={e => setFormRole(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2 rounded text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. Product Manager" />
                 </div>
               </div>
               <div className="flex justify-end gap-2 mt-6">
                 <button type="button" onClick={() => setView('LIST')} className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white">取消</button>
                 <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded flex items-center gap-2"><UserPlus size={14}/> 创建</button>
               </div>
            </form>
          )}

          {/* VIEW: EDIT USER */}
          {view === 'EDIT' && (
            <form onSubmit={handleEditSave} className="animate-in slide-in-from-right-4 duration-300">
               <h4 className="font-bold text-zinc-700 dark:text-zinc-300 mb-4">编辑成员: {editingUser?.name}</h4>
               <div className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">重置密码 (留空则不修改)</label>
                   <input type="text" value={formPass} onChange={e => setFormPass(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2 rounded text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500" placeholder="New Password" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">职位 (Role)</label>
                   <input type="text" value={formRole} onChange={e => setFormRole(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2 rounded text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                 </div>
               </div>
               <div className="flex justify-end gap-2 mt-6">
                 <button type="button" onClick={() => setView('LIST')} className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white">取消</button>
                 <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded flex items-center gap-2"><Save size={14}/> 保存</button>
               </div>
            </form>
          )}

          {/* VIEW: PAYWALL */}
          {view === 'PAY' && (
            <div className="text-center py-8 animate-in zoom-in-95 duration-300">
               <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Crown size={32} />
               </div>
               <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">升级至专业版</h3>
               <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-xs mx-auto leading-relaxed">
                 前 <span className="font-bold text-zinc-900 dark:text-white">3</span> 名成员永久免费。<br/>
                 从第 <span className="font-bold text-zinc-900 dark:text-white">4</span> 名成员开始，需付费解锁扩容权限。
               </p>
               <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg max-w-xs mx-auto mb-6">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">¥98 <span className="text-xs text-zinc-500 font-normal">/ 年 / 新增用户</span></div>
                  <div className="text-[10px] text-zinc-400 mt-1">仅对超额人员收费</div>
               </div>
               <div className="flex justify-center gap-3">
                 <button onClick={() => setView('LIST')} className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white">稍后再说</button>
                 <button onClick={() => alert("Redirecting to payment gateway...")} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded shadow-lg shadow-indigo-500/20">立即升级</button>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default OrgManagerModal;