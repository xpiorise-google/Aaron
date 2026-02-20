
import React, { useState, useEffect, useRef } from 'react';
import { Organization, UserProfile } from '../types';
import { getOrganization, createOrganization, initDatabase } from '../services/databaseService';
import { queryDepartments, Department } from '../services/departmentApi';
import { queryUsers, ApiUser } from '../services/userApi';
import { ChevronRight, ArrowLeft, Loader2, KeyRound, Shield } from 'lucide-react';
import EntropyCube from './EntropyCube';

interface LoginProps {
  onLogin: (username: string, orgId: string, isAdmin: boolean) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

type LoginStep = 'ORG_ENTRY' | 'USER_SELECTION' | 'CREATE_ORG' | 'PASSWORD';

// --- CUSTOM INPUT COMPONENTS ---

// 1. Slot-based Input for Organization ID (4 chars)
const OrgIdInputDisplay = ({ value, onChange, error }: { value: string, onChange: (val: string) => void, error: boolean }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus the hidden input when clicking the container
  const handleClick = () => inputRef.current?.focus();

  return (
    <div className="relative mb-8 group cursor-text" onClick={handleClick}>
      {/* The Ghost Input - Captures typing but is invisible */}
      <input 
        ref={inputRef}
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        maxLength={4}
        className="absolute inset-0 w-full h-full opacity-0 cursor-text z-20"
        autoFocus
        autoComplete="off"
      />
      
      {/* The Visual Render Layer */}
      <div className="flex justify-center gap-4">
        {[0, 1, 2, 3].map((index) => {
          const char = value[index] || '';
          const isActive = index === value.length; 
          // If full, keep last one active or none? Let's hide cursor if full.
          const showCursor = isActive && value.length < 4;

          return (
            <div 
              key={index} 
              className={`
                w-12 h-16 border-2 flex items-center justify-center text-3xl font-black font-mono transition-all duration-200 relative overflow-hidden
                ${error ? 'border-rose-500 text-rose-500' : 'border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white'}
                ${isActive ? 'border-zinc-900 dark:border-white scale-110 shadow-lg' : ''}
                ${char ? 'bg-zinc-50 dark:bg-zinc-900' : 'bg-transparent'}
              `}
            >
              {/* The Character */}
              <span className="relative z-10">{char}</span>
              
              {/* The "Cool" Block Cursor */}
              {showCursor && (
                 <div className="absolute inset-0 bg-zinc-900 dark:bg-white opacity-20 animate-pulse z-0"></div>
              )}
              
              {/* Placeholder Underscore for empty slots */}
              {!char && !showCursor && (
                 <div className="w-4 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 2. Terminal Style Input (Text/Password) with Trailing Block Cursor
const TerminalInput = ({ 
  value, 
  onChange, 
  placeholder, 
  type = 'text', 
  autoFocus = false,
  className = ""
}: { 
  value: string, 
  onChange: (val: string) => void, 
  placeholder: string, 
  type?: 'text' | 'password',
  autoFocus?: boolean,
  className?: string
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(autoFocus);

  // Masking logic for password
  const displayValue = type === 'password' ? '•'.repeat(value.length) : value;

  return (
    <div 
      className={`relative group cursor-text border-b-2 transition-colors ${isFocused ? 'border-zinc-900 dark:border-white' : 'border-zinc-200 dark:border-zinc-800'} ${className}`}
      onClick={() => inputRef.current?.focus()}
    >
       {/* Ghost Input */}
       <input 
        ref={inputRef}
        type={type} // Keep type for password managers
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-text"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoFocus={autoFocus}
        autoComplete="off"
      />

      {/* Visual Render Layer */}
      <div className="py-3 flex items-center">
         {/* Render Placeholder if empty */}
         {value.length === 0 && (
           <span className="text-zinc-300 dark:text-zinc-700 font-mono text-sm tracking-widest absolute select-none pointer-events-none uppercase">
             {placeholder}
           </span>
         )}

         {/* Render Text + Cursor */}
         <div className="font-mono font-bold text-zinc-900 dark:text-white tracking-[0.2em] flex items-center h-6 overflow-hidden">
            <span className="whitespace-pre">{displayValue}</span>
            {/* The Blinking Block Cursor */}
            {isFocused && (
              <div className="w-2.5 h-5 bg-zinc-900 dark:bg-white animate-[pulse_1s_ease-in-out_infinite] ml-1"></div>
            )}
         </div>
      </div>
    </div>
  );
};


const Login: React.FC<LoginProps> = ({ onLogin, isDarkMode, toggleTheme }) => {
  const [step, setStep] = useState<LoginStep>('ORG_ENTRY');
  
  // Step 1: Org Data
  const [orgIdInput, setOrgIdInput] = useState('');
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);

  // Step 2: User Data
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Step 3/4: Auth & Creation
  const [password, setPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unlocking, setUnlocking] = useState(false); // Success state trigger for animation

  useEffect(() => {
    initDatabase();
  }, []);

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const id = orgIdInput.toUpperCase().trim();
    
    if (id.length < 1 || id.length > 4) {
      setError('ID ERROR: LENGTH 1-4');
      return;
    }

    setLoading(true);
    try {
      // 首先尝试从后端 API 查询机构
      // 1. 查询所有部门，根据 parent_id 查找匹配的机构
      const departmentsResponse = await queryDepartments();
      const departments = Array.isArray(departmentsResponse?.data) ? departmentsResponse.data : [];
      
      // 查找匹配的部门：根据 parent_id 查询（输入的 orgId 作为 parent_id）
      // parent_id 可能是字符串或数字，需要支持两种匹配方式
      let matchedDepartment: Department | undefined = undefined;
      
      // 方式1：直接字符串匹配 parent_id
      matchedDepartment = departments.find(d => {
        if (d.parent_id === null || d.parent_id === undefined) return false;
        // 支持字符串和数字类型的 parent_id
        return d.parent_id.toString().toUpperCase() === id || 
               d.parent_id.toString() === id ||
               (typeof d.parent_id === 'number' && d.parent_id.toString() === id);
      });
      
      // 方式2：如果 parent_id 是数字，尝试数字匹配
      if (!matchedDepartment) {
        const orgIdAsNumber = parseInt(id, 10);
        if (!isNaN(orgIdAsNumber)) {
          matchedDepartment = departments.find(d => 
            d.parent_id !== null && 
            d.parent_id !== undefined &&
            (d.parent_id === orgIdAsNumber || 
             (typeof d.parent_id === 'string' && parseInt(d.parent_id, 10) === orgIdAsNumber))
          );
        }
      }
      
      // 方式3：如果通过 parent_id 没找到，尝试通过 department_name 匹配（作为备用）
      if (!matchedDepartment) {
        matchedDepartment = departments.find(d => 
          d.department_name?.toUpperCase() === id
        );
      }
      
      // 如果找到匹配的部门，查询该部门的用户
      if (matchedDepartment) {
        try {
          const usersResponse = await queryUsers();
          const allUsers = Array.isArray(usersResponse?.data) ? usersResponse.data : [];
          
          // 筛选出该部门所属的用户（根据 department_id 匹配）
          const departmentUsers = allUsers.filter(user => {
            if (user.department_id === null || user.department_id === undefined) return false;
            // 支持字符串和数字类型的 department_id 匹配
            return user.department_id.toString() === matchedDepartment!.id.toString() || 
                   user.department_id === matchedDepartment!.id ||
                   (typeof user.department_id === 'string' && 
                    typeof matchedDepartment!.id === 'number' && 
                    parseInt(user.department_id, 10) === matchedDepartment!.id) ||
                   (typeof user.department_id === 'number' && 
                    typeof matchedDepartment!.id === 'string' && 
                    user.department_id === parseInt(matchedDepartment!.id, 10));
          });
          
          // 将 API 用户转换为前端的 UserProfile 格式
          const userProfiles: UserProfile[] = departmentUsers.map(user => ({
            id: user.username,
            name: user.display_name || user.username,
            role: user.role,
            password: user.password,
            avatarColor: `hsl(${(user.id * 137.508) % 360}, 70%, 50%)`, // 生成颜色
            isAdmin: false, // 可以根据需要判断
          }));
          
          // 如果找到用户，创建临时 Organization 对象用于显示
          if (userProfiles.length > 0) {
            const tempOrg: Organization = {
              id: id,
              name: matchedDepartment.department_name,
              adminId: userProfiles[0]?.id || '',
              users: userProfiles,
              createdAt: Date.now(),
            };
            
            setActiveOrg(tempOrg);
            setStep('USER_SELECTION');
            setLoading(false);
            return;
          } else {
            // 找到部门但没有用户，提示用户创建
            console.warn(`找到机构 ${matchedDepartment.department_name}，但没有找到用户`);
            setError('NO USERS FOUND');
            setStep('CREATE_ORG');
            setLoading(false);
            return;
          }
        } catch (userError) {
          console.error('查询用户失败:', userError);
          // 如果查询用户失败，仍然可以显示部门信息，但提示错误
          setError('USER_QUERY_FAILED');
          setLoading(false);
          // 继续执行，回退到本地数据库查询
        }
      }
      
      // 如果后端没有找到，尝试从本地数据库查找
      const org = getOrganization(id);
      if (org) {
        setActiveOrg(org);
        setStep('USER_SELECTION');
      } else {
        setStep('CREATE_ORG');
      }
      setLoading(false);
    } catch (error) {
      console.error('查询机构失败:', error);
      // 如果 API 调用失败，回退到本地数据库查询
      const org = getOrganization(id);
      if (org) {
        setActiveOrg(org);
        setStep('USER_SELECTION');
      } else {
        setStep('CREATE_ORG');
      }
      setLoading(false);
    }
  };

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName || !password) {
      setError('INPUT REQUIRED');
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      const newOrg = createOrganization(orgIdInput.toUpperCase(), newAdminName, password);
      setActiveOrg(newOrg);
      
      // Trigger Success Animation
      setUnlocking(true);
      setTimeout(() => {
          onLogin(newAdminName, newOrg.id, true);
          setLoading(false);
      }, 3000); 
    }, 800);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !activeOrg) return;

    setLoading(true);
    setTimeout(() => {
      if (password === selectedUser.password) {
         setUnlocking(true);
         // Delay login to show animation
         setTimeout(() => {
             onLogin(selectedUser.id, activeOrg.id, !!selectedUser.isAdmin);
         }, 3000); 
      } else {
        setError('INVALID PASSCODE');
        setLoading(false);
      }
    }, 600);
  };

  const reset = () => {
    setStep('ORG_ENTRY');
    setOrgIdInput('');
    setPassword('');
    setError('');
    setSelectedUser(null);
    setActiveOrg(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col items-center justify-center p-6 font-mono transition-colors duration-300 relative overflow-hidden">
      
      {/* Background Dot Grid */}
      <div className="absolute inset-0 pointer-events-none z-0" 
           style={{ 
             backgroundImage: `radial-gradient(${isDarkMode ? '#222' : '#e4e4e7'} 1px, transparent 1px)`, 
             backgroundSize: '40px 40px',
             opacity: 0.8
           }}>
      </div>

      {/* The New Animation Overlay */}
      <EntropyCube unlocking={unlocking} isDarkMode={isDarkMode} />

      <div className={`w-full max-w-md relative z-10 transition-all duration-700 ease-in-out ${unlocking ? 'scale-90 opacity-0 blur-sm' : 'opacity-100 scale-100'}`}>
        
        {/* Minimalist Header (Typographic Only) */}
        <div className="mb-16 text-center select-none cursor-pointer" onClick={reset}>
          <h1 className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-white leading-none font-cool mb-4">
            THE COO
          </h1>
          <div className="h-[2px] w-12 bg-zinc-900 dark:bg-white mx-auto mb-4"></div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.4em]">Executive Decision System</p>
        </div>

        {/* STEP 1: ORG ENTRY */}
        {step === 'ORG_ENTRY' && (
          <form onSubmit={handleOrgSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-transparent">
              <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-6 text-center">Organization ID</label>
              
              {/* NEW CUSTOM COMPONENT */}
              <OrgIdInputDisplay 
                value={orgIdInput} 
                onChange={setOrgIdInput} 
                error={!!error}
              />

              {error && <div className="mb-4 text-rose-500 text-[10px] font-mono font-bold text-center tracking-widest uppercase animate-shake">{error}</div>}

              <button 
                type="submit" 
                disabled={loading || !orgIdInput}
                className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black py-4 font-bold uppercase tracking-[0.3em] hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 text-[10px] flex items-center justify-center gap-4 group"
              >
                {loading ? <Loader2 className="animate-spin" size={14}/> : (
                  <>
                    INITIALIZE_SYSTEM 
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                  </>
                )} 
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: USER SELECTION */}
        {step === 'USER_SELECTION' && activeOrg && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 shadow-2xl relative">
                {/* Decoration */}
                <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-zinc-900 dark:border-white"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-zinc-900 dark:border-white"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-zinc-900 dark:border-white"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-zinc-900 dark:border-white"></div>

                <div className="mb-8 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <button onClick={reset} className="text-[10px] text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2 mb-2 transition-colors uppercase tracking-widest">
                    <ArrowLeft size={10} /> {activeOrg.id}
                  </button>
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Select Profile</h2>
                </div>

                <div className="space-y-1">
                    {activeOrg.users.map((user, idx) => (
                      <button
                        key={user.id}
                        onClick={() => { setSelectedUser(user); setStep('PASSWORD'); }}
                        className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all group text-left border-l-2 border-transparent hover:border-zinc-900 dark:hover:border-white"
                      >
                        <div className="flex items-center gap-4 font-mono">
                          <span className="text-zinc-300 dark:text-zinc-600 text-xs">0{idx + 1}</span>
                          <div>
                              <div className="font-bold text-zinc-900 dark:text-white text-sm uppercase tracking-wider">{user.name}</div>
                              <div className="text-[9px] text-zinc-500 uppercase tracking-widest">{user.role}</div>
                          </div>
                        </div>
                        <ChevronRight className="text-zinc-300 group-hover:text-zinc-900 dark:text-zinc-700 dark:group-hover:text-white opacity-0 group-hover:opacity-100 transition-all" size={14} />
                      </button>
                    ))}
                </div>
             </div>
          </div>
        )}

        {/* STEP 3: CREATE ORG */}
        {step === 'CREATE_ORG' && (
           <form onSubmit={handleCreateOrg} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-white dark:bg-zinc-900 p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl relative">
                {/* Corner Markers */}
                <div className="absolute top-0 left-0 w-2 h-2 bg-zinc-900 dark:bg-white"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-zinc-900 dark:bg-white"></div>

                <div className="flex items-center gap-2 mb-8 text-zinc-400 text-[10px] cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors uppercase tracking-widest" onClick={() => setStep('ORG_ENTRY')}>
                  <ArrowLeft size={10} /> Abort
                </div>
                
                <div className="mb-8">
                   <h3 className="font-black text-zinc-900 dark:text-white text-xl uppercase">CLAIM SECTOR "{orgIdInput}"</h3>
                   <p className="text-[10px] text-zinc-500 mt-2 font-mono">Initialize admin protocols for new organization.</p>
                </div>

                <div className="space-y-6 mb-8">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">Admin Identity</label>
                    <TerminalInput 
                      value={newAdminName} 
                      onChange={setNewAdminName} 
                      placeholder="ENTER NAME" 
                      autoFocus 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">Security Key</label>
                    <TerminalInput 
                      value={password} 
                      onChange={setPassword} 
                      placeholder="SET PASSCODE" 
                      type="password"
                    />
                  </div>
                </div>
                
                {error && <div className="mb-6 text-rose-500 text-[10px] font-mono font-bold uppercase tracking-widest">{error}</div>}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black py-4 font-bold uppercase tracking-[0.2em] hover:opacity-90 transition-all disabled:opacity-50 text-[10px] flex items-center justify-center gap-2"
                >
                   {loading ? <Loader2 className="animate-spin" size={12}/> : <><Shield size={12} /> EXECUTE_SETUP</>}
                </button>
             </div>
           </form>
        )}

        {/* STEP 4: PASSWORD */}
        {step === 'PASSWORD' && selectedUser && (
           <form onSubmit={handlePasswordSubmit} className="animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="bg-transparent text-center">
               <div className="flex justify-center gap-2 mb-12 text-zinc-400 text-[10px] cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors uppercase tracking-[0.2em]" onClick={() => setStep('USER_SELECTION')}>
                 <ArrowLeft size={10} /> Back
               </div>

               <div className="mb-12">
                 <h2 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-2">{selectedUser.name}</h2>
                 <div className="inline-block px-2 py-1 border border-zinc-300 dark:border-zinc-700 text-[9px] font-mono text-zinc-500 uppercase">
                    {selectedUser.role}
                 </div>
               </div>

               <div className="relative mb-12 max-w-[200px] mx-auto">
                  <label className="block mb-4 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">Identity Verification</label>
                  
                  {/* NEW CUSTOM PASSWORD INPUT */}
                  <TerminalInput 
                    value={password} 
                    onChange={setPassword} 
                    placeholder="PASSCODE" 
                    type="password"
                    autoFocus
                    className="text-center justify-center"
                  />
               </div>

               {error && <div className="mb-8 text-rose-500 text-[10px] font-mono font-bold uppercase tracking-widest animate-pulse">{error}</div>}

               <button 
                type="submit" 
                disabled={loading}
                className="bg-zinc-900 dark:bg-white text-white dark:text-black px-8 py-3 font-bold uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 text-[10px] flex items-center gap-2 mx-auto"
              >
                {loading ? <Loader2 className="animate-spin inline" size={12}/> : <><KeyRound size={12} /> UNLOCK_TERMINAL</>}
              </button>
             </div>
           </form>
        )}

        {/* Footer Theme Toggle */}
        <div className="mt-16 flex justify-center opacity-50 hover:opacity-100 transition-opacity">
           <div className="flex text-[9px] font-bold font-mono border border-zinc-200 dark:border-zinc-800">
              <button 
                onClick={() => isDarkMode && toggleTheme()}
                className={`px-3 py-1 transition-all ${!isDarkMode ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                LGT
              </button>
              <div className="w-[1px] bg-zinc-200 dark:bg-zinc-800"></div>
              <button 
                onClick={() => !isDarkMode && toggleTheme()}
                className={`px-3 py-1 transition-all ${isDarkMode ? 'bg-white text-black' : 'text-zinc-400 hover:text-black'}`}
              >
                DRK
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
