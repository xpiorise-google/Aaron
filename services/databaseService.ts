
import { Task, TaskStatus, UserContext, HandoverRecord, TeamMember, HandoverStatus, Organization, UserProfile } from '../types';

// STORAGE KEYS
const ORG_META_KEY = 'executive_saas_orgs_v1';
const DB_PREFIX = 'executive_db_v2_'; // Updated version for isolation
const CTX_PREFIX = 'executive_ctx_v2_';

// --- SEED DATA GENERATORS ---

const createDefaultAaron = (): Task[] => [
  {
    id: '1',
    originalInput: '2026 Q1 Process & AI Efficiency',
    title: '2026 Q1 流程重构与 AI 提效战役',
    description: '落地“售前画界面、工程细配置、研发模组化、开发标准化”的定制流程，并引入 AI 工具链以实现 500% 人效提升。',
    impactScore: 10,
    effortScore: 9.5,
    strategicAdvice: '这是实现“千人千面、后台统一”理念的关键战役。需强制推行标准化，对不适应 AI 工具的流程进行坚决切割。',
    subTasks: [
      { id: '1a', title: '输出“研发模组化”与“开发标准化”的技术白皮书', completed: false },
      { id: '1b', title: '全员 AI 工具培训与考核（目标：提效 500%）', completed: false },
      { id: '1c', title: '建立全场景自动化测试基准，确保精度 > 99%', completed: false }
    ],
    status: TaskStatus.IN_PROGRESS,
    createdAt: Date.now() - 10000000
  },
  {
    id: 'sim_collab_zula_1',
    originalInput: 'Data Engineering Handover',
    title: '数据工程组 Q1 资源需求复核',
    description: 'Zula 提交了数据工程组下一季度的算力与标注人力预算需求，请求 CEO 复核并批准。',
    impactScore: 8.5,
    effortScore: 3.0,
    strategicAdvice: '预算审批类事项。重点关注“标注人力”是否可以通过 AI 自动化进一步压缩。',
    subTasks: [
      { id: 'sc1', title: '复核 GPU 算力扩容成本', completed: true },
      { id: 'sc2', title: '审批标注团队外包编制', completed: false }
    ],
    status: TaskStatus.IN_PROGRESS, 
    createdAt: Date.now() - 5000,
    handovers: [
      {
        fromUser: 'zula',
        toUser: 'aaron',
        remark: 'Aaron, 这是Q1的最终预算版本，请确认 GPU 采购项是否符合战略预期。',
        timestamp: Date.now(),
        status: HandoverStatus.PENDING
      }
    ],
    tags: ['Urgent', 'Budget']
  }
];

const createDefaultZula = (): Task[] => [
  {
    id: 'z1',
    originalInput: 'AI Accuracy Optimization',
    title: '全场景 AI 精度攻坚战 (>99%)',
    description: '针对 AI 数据提取与标签标注场景，建立“标准答案”标杆库，并开发自适应反馈机制以修正描述偏差，确保综合精度达标。',
    impactScore: 9.8,
    effortScore: 8.5,
    strategicAdvice: '这是工程组的核心交付指标。需与研发组紧密联动，快速迭代标签生成的 Prompt 工程与校验逻辑。',
    subTasks: [
      { id: 'z1a', title: '构建全场景数据提取的“标准答案”基准测试集', completed: false },
      { id: 'z1b', title: '开发标签表述的自适应反馈(Human-in-the-loop)修正模块', completed: false },
      { id: 'z1c', title: '配合售前组完成前端交互逻辑的细化配置方案', completed: false }
    ],
    status: TaskStatus.IN_PROGRESS,
    createdAt: Date.now()
  }
];

const createDefaultYuna = (): Task[] => [
  {
    id: '101',
    originalInput: 'Q1 Survival Campaign',
    title: 'Q1 “生存战役” 现金流攻坚',
    description: '核心目标：3月前必须完成 2 单全案咨询签约，实现回款 40-50 万元，将资金跑道 (Runway) 延长至 2026 年底。',
    impactScore: 10,
    effortScore: 9,
    strategicAdvice: '生死之战，Cash is King。利用已有成功案例（杜/王同学）激活私域，CEO 需 100% 聚焦于高净值客户转介绍。',
    subTasks: [
      { id: 'y1', title: '盘点杜同学、王同学等成功案例，输出私域激活话术', completed: false },
      { id: 'y2', title: '锁定 10 个高意向高净值家庭进行深度跟进', completed: false },
      { id: 'y3', title: '暂停所有非直接产生回款的品牌投放支出', completed: true }
    ],
    status: TaskStatus.IN_PROGRESS,
    createdAt: Date.now()
  }
];

const getContextDefaults = (username: string, role: string): UserContext => {
  if (username === 'aaron') return {
    jobTitle: 'AI事业线CEO',
    reportingTo: '德勤风驭CEO',
    quarterlyGoal: '实现“售前画界面-工程细配置-研发模组化-开发标准化”流程；系统全场景精度>99%',
    annualGoal: '构建“千人千面、后台高度统一”的智能平台；实现Xer与先见AI两个产品线1000万ARR的营收',
    directTeamSize: 15,
    directTeamSkills: '助理，开发团队，产品团队，数据工程团队',
    collabTeamSize: 30,
    collabTeamSkills: '销售团队，外包开发团队，市场团队'
  };
  
  if (username === 'zula') return {
    jobTitle: '数据工程组组长',
    reportingTo: 'AI事业线CEO',
    quarterlyGoal: '1.落实“四组联动”定制流程；2.系统全场景综合精度>99%',
    annualGoal: '达成“SDD” (Demo即交付) 水平',
    directTeamSize: 4,
    directTeamSkills: '前端、数据科学、大数据分析',
    collabTeamSize: 5,
    collabTeamSkills: 'AI研发、后端工程化'
  };

  if (username === 'yuna') return {
    jobTitle: '坚果教育CEO',
    reportingTo: '董事会 / 投资人',
    quarterlyGoal: '生存战役 (Cash is King)：3月前签2单全案，回款40-50w',
    annualGoal: '验证“双轮驱动”模式：左轮稳高端咨询，右轮拓AI ToB业务',
    directTeamSize: 1,
    directTeamSkills: 'CEO助理',
    collabTeamSize: 10,
    collabTeamSkills: '兼职名师, 辅导员'
  };

  return {
    jobTitle: role,
    reportingTo: 'Manager',
    quarterlyGoal: 'Execute core projects',
    annualGoal: 'Business Growth',
    directTeamSize: 0,
    directTeamSkills: 'N/A',
    collabTeamSize: 0,
    collabTeamSkills: 'N/A'
  };
};

// --- ORGANIZATION MANAGEMENT ---

const getOrgs = (): Record<string, Organization> => {
  const stored = localStorage.getItem(ORG_META_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch(e) { return {}; }
};

const saveOrgs = (orgs: Record<string, Organization>) => {
  localStorage.setItem(ORG_META_KEY, JSON.stringify(orgs));
};

export const initDatabase = () => {
  const orgs = getOrgs();
  
  // Seed XER Organization if not exists
  if (!orgs['XER']) {
    orgs['XER'] = {
      id: 'XER',
      name: 'XER AI Division',
      adminId: 'aaron',
      createdAt: Date.now(),
      users: [
        { id: 'aaron', name: 'Aaron', role: 'AI事业线CEO', password: '123', avatarColor: 'bg-indigo-500', isAdmin: true },
        { id: 'zula', name: 'Zula', role: '数据组长', password: '123', avatarColor: 'bg-emerald-500' },
        { id: 'meitong', name: 'Meitong', role: 'CEO助理', password: '123', avatarColor: 'bg-purple-500' }
      ]
    };
    // Initialize their tasks
    localStorage.setItem(`${DB_PREFIX}XER_aaron`, JSON.stringify(createDefaultAaron()));
    localStorage.setItem(`${CTX_PREFIX}XER_aaron`, JSON.stringify(getContextDefaults('aaron', 'AI事业线CEO')));
    
    localStorage.setItem(`${DB_PREFIX}XER_zula`, JSON.stringify(createDefaultZula()));
    localStorage.setItem(`${CTX_PREFIX}XER_zula`, JSON.stringify(getContextDefaults('zula', '数据组长')));
  }

  // Seed NUT Organization
  if (!orgs['NUT']) {
    orgs['NUT'] = {
      id: 'NUT',
      name: 'Nut Education',
      adminId: 'yuna',
      createdAt: Date.now(),
      users: [
        { id: 'yuna', name: 'Yuna', role: '坚果CEO', password: '123', avatarColor: 'bg-rose-500', isAdmin: true },
        { id: 'mohan', name: 'Mohan', role: 'CEO助理', password: '123', avatarColor: 'bg-amber-500' }
      ]
    };
    localStorage.setItem(`${DB_PREFIX}NUT_yuna`, JSON.stringify(createDefaultYuna()));
    localStorage.setItem(`${CTX_PREFIX}NUT_yuna`, JSON.stringify(getContextDefaults('yuna', '坚果CEO')));
  }

  saveOrgs(orgs);
};

export const getOrganization = (orgId: string): Organization | null => {
  const orgs = getOrgs();
  return orgs[orgId.toUpperCase()] || null;
};

export const createOrganization = (orgId: string, adminId: string, adminPassword: string): Organization => {
  const orgs = getOrgs();
  const id = orgId.toUpperCase();
  
  const newOrg: Organization = {
    id,
    name: `${id} Organization`,
    adminId,
    createdAt: Date.now(),
    users: [
      { id: adminId, name: adminId, role: 'Admin', password: adminPassword, avatarColor: 'bg-zinc-800', isAdmin: true }
    ]
  };
  
  orgs[id] = newOrg;
  saveOrgs(orgs);
  return newOrg;
};

export const updateOrganizationName = (orgId: string, newName: string): boolean => {
  const orgs = getOrgs();
  const id = orgId.toUpperCase();
  if (!orgs[id]) return false;
  
  orgs[id].name = newName;
  saveOrgs(orgs);
  return true;
};

export const addOrgUser = (orgId: string, user: UserProfile): boolean => {
  const orgs = getOrgs();
  const org = orgs[orgId.toUpperCase()];
  if (!org) return false;

  // Check uniqueness within org
  if (org.users.some(u => u.id === user.id)) return false;

  org.users.push(user);
  saveOrgs(orgs);
  
  // Initialize default context
  saveUserContext(user.id, getContextDefaults(user.id, user.role), orgId);
  return true;
};

export const removeOrgUser = (orgId: string, userId: string) => {
  const orgs = getOrgs();
  const org = orgs[orgId.toUpperCase()];
  if (!org) return;

  org.users = org.users.filter(u => u.id !== userId);
  saveOrgs(orgs);
};

export const updateOrgUser = (orgId: string, user: UserProfile) => {
  const orgs = getOrgs();
  const org = orgs[orgId.toUpperCase()];
  if (!org) return;

  const idx = org.users.findIndex(u => u.id === user.id);
  if (idx !== -1) {
    org.users[idx] = user;
    saveOrgs(orgs);
  }
};

// --- DATA ACCESS WITH ORG SCOPING ---

const getCurrentOrgId = () => {
  // We assume the App handles the session orgId. 
  // But for simple DB access, we will rely on passed arguments or local session storage fallback
  return localStorage.getItem('executive_session_org_id') || '';
};

export const getUserTasks = (username: string, orgId?: string): Task[] => {
  const oid = orgId || getCurrentOrgId();
  if (!oid) return [];

  const key = `${DB_PREFIX}${oid}_${username}`;
  const stored = localStorage.getItem(key);
  
  if (stored) {
    try {
      return JSON.parse(stored) as Task[];
    } catch (e) { console.error(e); }
  }
  return [];
};

export const saveUserTasks = (username: string, tasks: Task[], orgId?: string): void => {
  const oid = orgId || getCurrentOrgId();
  if (!oid) return;
  const key = `${DB_PREFIX}${oid}_${username}`;
  localStorage.setItem(key, JSON.stringify(tasks));
};

export const getUserContext = (username: string, orgId?: string): UserContext => {
  const oid = orgId || getCurrentOrgId();
  if (!oid) return getContextDefaults('default', 'Manager');

  const key = `${CTX_PREFIX}${oid}_${username}`;
  const stored = localStorage.getItem(key);

  if (stored) {
    try {
      return JSON.parse(stored) as UserContext;
    } catch (e) { console.error(e); }
  }

  // If new user with no context, return defaults
  return getContextDefaults(username, 'Team Member');
};

export const saveUserContext = (username: string, context: UserContext, orgId?: string): void => {
  const oid = orgId || getCurrentOrgId();
  if (!oid) return;
  const key = `${CTX_PREFIX}${oid}_${username}`;
  localStorage.setItem(key, JSON.stringify(context));
};

// --- COLLABORATION ---

export const pushTaskToColleague = (targetUsername: string, task: Task, handover: HandoverRecord) => {
  const oid = getCurrentOrgId();
  if (!oid) return;

  const targetTasks = getUserTasks(targetUsername, oid);
  const newHandover = { ...handover, status: HandoverStatus.PENDING };
  
  const taskCopy: Task = {
    ...task,
    status: TaskStatus.IN_PROGRESS,
    handovers: [...(task.handovers || []), newHandover]
  };

  const exists = targetTasks.some(t => t.id === task.id);
  let newTargetTasks;
  if (exists) {
    newTargetTasks = targetTasks.map(t => t.id === task.id ? taskCopy : t);
  } else {
    newTargetTasks = [taskCopy, ...targetTasks];
  }

  saveUserTasks(targetUsername, newTargetTasks, oid);
};

export const respondToHandover = (
  receiverUsername: string, 
  taskId: string, 
  status: HandoverStatus, 
  responseMsg: string
) => {
  const oid = getCurrentOrgId();
  if (!oid) return [];

  const now = Date.now();
  
  // 1. Update Receiver
  const receiverTasks = getUserTasks(receiverUsername, oid);
  let senderUsername = '';

  const updatedReceiverTasks = receiverTasks.map(t => {
    if (t.id === taskId && t.handovers && t.handovers.length > 0) {
      const lastHandover = t.handovers[t.handovers.length - 1];
      senderUsername = lastHandover.fromUser;
      
      const updatedHandover = {
        ...lastHandover,
        status: status,
        response: responseMsg,
        responseTimestamp: now
      };
      
      const newHandovers = [...t.handovers];
      newHandovers[newHandovers.length - 1] = updatedHandover;
      return { ...t, handovers: newHandovers };
    }
    return t;
  });
  saveUserTasks(receiverUsername, updatedReceiverTasks, oid);

  // 2. Update Sender
  if (senderUsername) {
    const senderTasks = getUserTasks(senderUsername, oid);
    const updatedSenderTasks = senderTasks.map(t => {
      if (t.id === taskId && t.handovers && t.handovers.length > 0) {
        const newHandovers = t.handovers.map(h => {
          if (h.toUser === receiverUsername && h.fromUser === senderUsername && !h.responseTimestamp) {
            return {
              ...h,
              status: status,
              response: responseMsg,
              responseTimestamp: now
            };
          }
          return h;
        });
        return { ...t, handovers: newHandovers };
      }
      return t;
    });
    saveUserTasks(senderUsername, updatedSenderTasks, oid);
  }

  return updatedReceiverTasks;
};

// Archive for RECEIVER
export const archiveHandover = (receiverUsername: string, taskId: string) => {
  const oid = getCurrentOrgId();
  if (!oid) return [];

  const tasks = getUserTasks(receiverUsername, oid);
  const updatedTasks = tasks.map(t => {
     if (t.id === taskId && t.handovers) {
       // Find last handover directed to me
       let lastIdx = -1;
       for (let i = t.handovers.length - 1; i >= 0; i--) {
         if (t.handovers[i].toUser === receiverUsername) {
           lastIdx = i;
           break;
         }
       }
       if (lastIdx !== -1) {
         const newHandovers = [...t.handovers];
         newHandovers[lastIdx] = { ...newHandovers[lastIdx], receiverArchived: true };
         return { ...t, handovers: newHandovers };
       }
     }
     return t;
  });
  
  saveUserTasks(receiverUsername, updatedTasks, oid);
  return updatedTasks;
};

// Archive for SENDER
export const archiveSenderHandover = (senderUsername: string, taskId: string) => {
  const oid = getCurrentOrgId();
  if (!oid) return [];

  const tasks = getUserTasks(senderUsername, oid);
  const updatedTasks = tasks.map(t => {
     if (t.id === taskId && t.handovers) {
       // Find last handover FROM me
       let lastIdx = -1;
       for (let i = t.handovers.length - 1; i >= 0; i--) {
         if (t.handovers[i].fromUser === senderUsername) {
           lastIdx = i;
           break;
         }
       }
       if (lastIdx !== -1) {
         const newHandovers = [...t.handovers];
         newHandovers[lastIdx] = { ...newHandovers[lastIdx], senderArchived: true };
         return { ...t, handovers: newHandovers };
       }
     }
     return t;
  });
  
  saveUserTasks(senderUsername, updatedTasks, oid);
  return updatedTasks;
};

// Clear All Archived for RECEIVER
export const clearAllArchivedHandovers = (receiverUsername: string) => {
  const oid = getCurrentOrgId();
  if (!oid) return [];

  const tasks = getUserTasks(receiverUsername, oid);
  const updatedTasks = tasks.map(t => {
    if (t.handovers) {
      // Archive ANY handover to me that is NOT pending
      const newHandovers = t.handovers.map(h => {
        if (h.toUser === receiverUsername && h.status !== HandoverStatus.PENDING) {
          return { ...h, receiverArchived: true };
        }
        return h;
      });
      return { ...t, handovers: newHandovers };
    }
    return t;
  });

  saveUserTasks(receiverUsername, updatedTasks, oid);
  return updatedTasks;
};

// Clear All Archived for SENDER
export const clearAllSenderArchivedHandovers = (senderUsername: string) => {
  const oid = getCurrentOrgId();
  if (!oid) return [];

  const tasks = getUserTasks(senderUsername, oid);
  const updatedTasks = tasks.map(t => {
    if (t.handovers) {
      // Archive ANY handover FROM me that is NOT pending (meaning it has a response)
      const newHandovers = t.handovers.map(h => {
        if (h.fromUser === senderUsername && h.status !== HandoverStatus.PENDING) {
          return { ...h, senderArchived: true };
        }
        return h;
      });
      return { ...t, handovers: newHandovers };
    }
    return t;
  });

  saveUserTasks(senderUsername, updatedTasks, oid);
  return updatedTasks;
};

// --- SHARED TASKS (TEAM COCKPIT) ---

export const getSharedTasks = (orgId?: string): Task[] => {
  const oid = orgId || getCurrentOrgId();
  if (!oid) return [];

  const key = `${DB_PREFIX}${oid}_shared_tasks`;
  const stored = localStorage.getItem(key);
  
  if (stored) {
    try {
      return JSON.parse(stored) as Task[];
    } catch (e) { console.error(e); }
  }
  return [];
};

export const shareTaskToTeam = (task: Task, orgId?: string): void => {
  const oid = orgId || getCurrentOrgId();
  if (!oid) return;

  const currentShared = getSharedTasks(oid);
  const idx = currentShared.findIndex(t => t.id === task.id);
  
  let newShared;
  if (idx !== -1) {
    // Update existing
    newShared = [...currentShared];
    newShared[idx] = { ...task, isSharedToTeam: true };
  } else {
    // Add new
    newShared = [...currentShared, { ...task, isSharedToTeam: true }];
  }
  
  localStorage.setItem(`${DB_PREFIX}${oid}_shared_tasks`, JSON.stringify(newShared));
};

export const unshareTaskFromTeam = (taskId: string, orgId?: string): void => {
  const oid = orgId || getCurrentOrgId();
  if (!oid) return;

  const currentShared = getSharedTasks(oid);
  const newShared = currentShared.filter(t => t.id !== taskId);
  localStorage.setItem(`${DB_PREFIX}${oid}_shared_tasks`, JSON.stringify(newShared));
};

// --- PROJECTS (TEAM COCKPIT) ---

import { Project } from '../types';

export const getProjects = (orgId?: string): Project[] => {
  const oid = orgId || getCurrentOrgId();
  if (!oid) return [];

  const key = `${DB_PREFIX}${oid}_projects`;
  const stored = localStorage.getItem(key);
  
  if (stored) {
    try {
      return JSON.parse(stored) as Project[];
    } catch (e) { console.error(e); }
  }
  return [];
};

export const saveProject = (project: Project, orgId?: string): void => {
  const oid = orgId || getCurrentOrgId();
  if (!oid) return;

  const projects = getProjects(oid);
  const idx = projects.findIndex(p => p.id === project.id);
  
  let newProjects;
  if (idx !== -1) {
    newProjects = [...projects];
    newProjects[idx] = project;
  } else {
    newProjects = [project, ...projects];
  }
  
  localStorage.setItem(`${DB_PREFIX}${oid}_projects`, JSON.stringify(newProjects));
};

export const deleteProject = (projectId: string, orgId?: string): void => {
  const oid = orgId || getCurrentOrgId();
  if (!oid) return;

  const projects = getProjects(oid);
  const newProjects = projects.filter(p => p.id !== projectId);
  localStorage.setItem(`${DB_PREFIX}${oid}_projects`, JSON.stringify(newProjects));
};

// Retrieve members dynamically from the Org
export const getAllTeamMembers = (orgId?: string): TeamMember[] => {
  const oid = orgId || getCurrentOrgId();
  if (!oid) return [];

  const org = getOrganization(oid);
  if (!org) return [];

  return org.users.map(u => ({
    id: u.id,
    name: u.name || u.id,
    role: u.role,
    avatarColor: u.avatarColor
  }));
};
