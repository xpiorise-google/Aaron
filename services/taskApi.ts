/**
 * 任务管理 API 服务
 * 与后端接口 add_coo_api_task / query_coo_api_task / update_coo_api_task / delete_coo_api_task 交互
 */

import { Task, TaskStatus, SubTask, HandoverRecord } from '../types';
import { post } from '../utils/request';
import { API_PATHS } from '../config';
import { querySteps, filterStepsByTaskId, apiStepToSubTask } from './stepApi';
import { queryTaskTransfers, filterTransfersByTaskId, ApiTaskTransfer } from './taskTransferApi';

/** 后端任务数据类型（接口返回格式） */
export interface ApiTask {
  id?: number;
  task_name: string;
  proposal_name: string;
  creator_id: number;
  assignee_id: number;
  deadline: string | null; // ISO 8601
  strategy_description: string;
  influence: string;
  time_cost: number;
  roi_index: number;
  status: string; // e.g. proposed | in_progress | completed
  progress: number;
  timeline: string;
  display_order?: number | null; // 显示顺序
  is_deleted?: boolean | number;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface QueryTaskResponse {
  code: number;
  msg: string;
  data: ApiTask[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/** 创建任务请求参数（与示例一致） */
export interface AddTaskParams {
  task_name: string;
  proposal_name: string;
  creator_id: number;
  assignee_id: number;
  deadline: string | null;
  strategy_description: string;
  influence: string;
  time_cost: number;
  roi_index: number;
  status: string;
  progress: number;
  timeline: string;
  display_order?: number | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** 更新任务请求参数（必须含 id） */
export interface UpdateTaskParams {
  id: number;
  task_name?: string;
  proposal_name?: string;
  creator_id?: number;
  assignee_id?: number;
  deadline?: string | null;
  strategy_description?: string;
  influence?: string;
  time_cost?: number;
  roi_index?: number;
  status?: string;
  progress?: number;
  timeline?: string;
  display_order?: number | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** 删除任务请求参数 */
export interface DeleteTaskParams {
  id: number;
}

/** 从 API 响应中提取任务数组（兼容 data 为数组或 data.list） */
function extractTasksFromResponse(result: any): ApiTask[] {
  if (!result || typeof result !== 'object') return [];
  const data = result.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.list)) return data.list;
  if (data && Array.isArray(data.records)) return data.records;
  return [];
}

/**
 * 查询任务列表
 */
export async function queryTasks(): Promise<QueryTaskResponse> {
  try {
    console.log('[queryTasks] 调用接口:', API_PATHS.TASK.QUERY);
    const result = await post<any>(API_PATHS.TASK.QUERY, {});
    console.log('[queryTasks] 接口返回:', result);
    const tasks = extractTasksFromResponse(result);
    return { ...result, data: tasks };
  } catch (error) {
    console.error('查询任务失败:', error);
    throw error;
  }
}

/**
 * 创建任务
 */
export async function addTask(params: AddTaskParams): Promise<ApiResponse<ApiTask>> {
  try {
    const requestData: any = {
      task_name: params.task_name,
      proposal_name: params.proposal_name,
      creator_id: params.creator_id,
      assignee_id: params.assignee_id,
      deadline: params.deadline,
      strategy_description: params.strategy_description,
      influence: params.influence,
      time_cost: params.time_cost,
      roi_index: params.roi_index,
      status: params.status,
      progress: params.progress,
      timeline: params.timeline,
      is_deleted: params.is_deleted ?? false,
      deleted_at: params.deleted_at ?? null,
      created_at: params.created_at ?? new Date().toISOString(),
      updated_at: params.updated_at ?? new Date().toISOString(),
    };
    // 如果提供了 display_order，则添加到请求中
    if (params.display_order !== undefined && params.display_order !== null) {
      requestData.display_order = params.display_order;
    }
    console.log('[addTask] 调用接口:', API_PATHS.TASK.ADD);
    console.log('[addTask] 请求参数:', requestData);
    const result = await post<ApiResponse<ApiTask>>(API_PATHS.TASK.ADD, requestData);
    console.log('[addTask] 接口返回:', result);
    return result;
  } catch (error) {
    console.error('创建任务失败:', error);
    throw error;
  }
}

/**
 * 更新任务（请求体必须包含 id）
 */
export async function updateTask(params: UpdateTaskParams): Promise<ApiResponse<ApiTask | null>> {
  try {
    console.log('[updateTask] 调用接口:', API_PATHS.TASK.UPDATE);
    console.log('[updateTask] 请求参数（完整）:', JSON.stringify(params, null, 2));
    console.log('[updateTask] display_order 值:', params.display_order);
    const result = await post<ApiResponse<ApiTask | null>>(API_PATHS.TASK.UPDATE, params);
    console.log('[updateTask] 接口返回:', result);
    return result;
  } catch (error) {
    console.error('更新任务失败:', error);
    throw error;
  }
}

/**
 * 删除任务（请求体必须包含 id）
 */
export async function deleteTask(params: DeleteTaskParams): Promise<ApiResponse<null>> {
  try {
    const result = await post<ApiResponse<null>>(API_PATHS.TASK.DELETE, { id: params.id });
    return result;
  } catch (error) {
    console.error('删除任务失败:', error);
    throw error;
  }
}

// --- 前后端任务格式转换（与 types.Task 互转）---

/** API status 字符串 -> 前端 TaskStatus */
export function apiStatusToTaskStatus(apiStatus: string): TaskStatus {
  const s = (apiStatus || '').toLowerCase();
  if (s === 'completed' || s === 'done') return TaskStatus.COMPLETED;
  if (s === 'in_progress' || s === 'in progress') return TaskStatus.IN_PROGRESS;
  if (s === 'proposed' || s === 'pending') return TaskStatus.PROPOSED;
  if (s === 'divested' || s === 'deleted') return TaskStatus.DIVESTED;
  return TaskStatus.PROPOSED;
}

/** 前端 TaskStatus -> API status 字符串 */
export function taskStatusToApiStatus(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.COMPLETED: return 'completed';
    case TaskStatus.IN_PROGRESS: return 'in_progress';
    case TaskStatus.PROPOSED: return 'proposed';
    case TaskStatus.DIVESTED: return 'divested';
    default: return 'proposed';
  }
}

/**
 * 获取任务的步骤列表（从 API）
 */
async function getTaskSteps(taskApiId: number): Promise<SubTask[]> {
  try {
    const response = await querySteps();
    const allSteps = Array.isArray(response?.data) ? response.data : [];
    const taskSteps = filterStepsByTaskId(allSteps, taskApiId);
    
    // 按 step_number 排序
    taskSteps.sort((a, b) => {
      const numA = a.step_number ?? 999;
      const numB = b.step_number ?? 999;
      return numA - numB;
    });
    
    return taskSteps.map((step, index) => {
      const subTask = apiStepToSubTask(step, index);
      // 保存 API ID 以便后续更新
      return { ...subTask, _apiStepId: step.id } as SubTask & { _apiStepId?: number };
    });
  } catch (error) {
    console.error(`获取任务 ${taskApiId} 的步骤失败:`, error);
    return [];
  }
}

/**
 * 将 API 流转记录转换为前端 HandoverRecord
 */
function apiTransferToHandover(
  transfer: ApiTaskTransfer,
  usernameById: Map<number, string>
): HandoverRecord | null {
  if (!transfer.from_user_id || !transfer.to_user_id) {
    console.warn('流转记录缺少用户ID:', transfer);
    return null;
  }
  
  const fromUser = usernameById.get(transfer.from_user_id);
  const toUser = usernameById.get(transfer.to_user_id);
  
  if (!fromUser || !toUser) {
    console.warn(`流转记录用户映射缺失: from_user_id=${transfer.from_user_id} (${fromUser || '未找到'}), to_user_id=${transfer.to_user_id} (${toUser || '未找到'})`, {
      transfer,
      availableUsers: Array.from(usernameById.entries())
    });
    return null;
  }
  
  return {
    fromUser,
    toUser,
    remark: transfer.message || "提案流转",
    timestamp: transfer.transfer_time ? new Date(transfer.transfer_time).getTime() : Date.now()
  };
}

/**
 * 后端 ApiTask 转为前端 Task（从 API 获取步骤和流转记录）
 * @param apiTask 接口返回的单条任务
 * @param usernameById 可选：API 用户 id -> 前端 username，用于 assigneeId
 * @param allSteps 可选：所有步骤数据（用于批量转换时避免重复查询）
 * @param allTransfers 可选：所有流转记录数据（用于批量转换时避免重复查询）
 */
export async function apiTaskToTask(
  apiTask: ApiTask, 
  usernameById?: Map<number, string>,
  allSteps?: { taskId: number; steps: SubTask[] }[],
  allTransfers?: ApiTaskTransfer[]
): Promise<Task & { _apiId?: number }> {
  const status = apiStatusToTaskStatus(apiTask.status);
  const deadline = apiTask.deadline ? new Date(apiTask.deadline).getTime() : undefined;
  const assigneeId = usernameById && apiTask.assignee_id
    ? usernameById.get(apiTask.assignee_id)
    : undefined;

  // 从 API 获取步骤，或使用提供的步骤数据
  let subTasks: SubTask[] = [];
  if (allSteps) {
    const taskSteps = allSteps.find(s => s.taskId === apiTask.id);
    if (taskSteps) {
      subTasks = taskSteps.steps;
    }
  } else if (apiTask.id != null) {
    // 如果没有提供步骤数据，则查询 API
    subTasks = await getTaskSteps(apiTask.id);
  }

  // 从 API 获取流转记录，或使用提供的流转记录数据
  let handovers: HandoverRecord[] = [];
  if (apiTask.id != null) {
    if (allTransfers) {
      // 使用提供的流转记录数据
      const taskTransfers = filterTransfersByTaskId(allTransfers, apiTask.id);
      console.log(`[apiTaskToTask] 任务 ${apiTask.id} 找到 ${taskTransfers.length} 条流转记录`, taskTransfers);
      
      if (usernameById && usernameById.size > 0) {
        handovers = taskTransfers
          .map(t => apiTransferToHandover(t, usernameById))
          .filter((h): h is HandoverRecord => h !== null)
          .sort((a, b) => a.timestamp - b.timestamp);
        console.log(`[apiTaskToTask] 任务 ${apiTask.id} 转换后得到 ${handovers.length} 条流转记录`, handovers);
      } else {
        // 如果用户映射为空，尝试查询用户列表来补充映射
        console.warn(`[apiTaskToTask] 任务 ${apiTask.id} 用户映射为空，尝试查询用户列表`);
        try {
          const { queryUsers } = await import('./userApi');
          const usersResponse = await queryUsers();
          const users = Array.isArray(usersResponse?.data) ? usersResponse.data : [];
          
          // 创建临时映射
          const tempMap = new Map<number, string>();
          users.forEach(user => {
            tempMap.set(user.id, user.username);
          });
          
          handovers = taskTransfers
            .map(t => apiTransferToHandover(t, tempMap))
            .filter((h): h is HandoverRecord => h !== null)
            .sort((a, b) => a.timestamp - b.timestamp);
          console.log(`[apiTaskToTask] 任务 ${apiTask.id} 使用临时映射转换后得到 ${handovers.length} 条流转记录`, handovers);
        } catch (error) {
          console.error(`[apiTaskToTask] 任务 ${apiTask.id} 查询用户列表失败:`, error);
        }
      }
    } else {
      // 查询 API 获取流转记录
      try {
        const transfersResponse = await queryTaskTransfers();
        const allTransfersData = Array.isArray(transfersResponse?.data) ? transfersResponse.data : [];
        const taskTransfers = filterTransfersByTaskId(allTransfersData, apiTask.id);
        console.log(`[apiTaskToTask] 任务 ${apiTask.id} 从API查询到 ${taskTransfers.length} 条流转记录`, taskTransfers);
        
        if (usernameById && usernameById.size > 0) {
          handovers = taskTransfers
            .map(t => apiTransferToHandover(t, usernameById))
            .filter((h): h is HandoverRecord => h !== null)
            .sort((a, b) => a.timestamp - b.timestamp);
          console.log(`[apiTaskToTask] 任务 ${apiTask.id} 转换后得到 ${handovers.length} 条流转记录`, handovers);
        } else {
          // 如果用户映射为空，尝试查询用户列表来补充映射
          console.warn(`[apiTaskToTask] 任务 ${apiTask.id} 用户映射为空，尝试查询用户列表`);
          const { queryUsers } = await import('./userApi');
          const usersResponse = await queryUsers();
          const users = Array.isArray(usersResponse?.data) ? usersResponse.data : [];
          
          // 创建临时映射
          const tempMap = new Map<number, string>();
          users.forEach(user => {
            tempMap.set(user.id, user.username);
          });
          
          handovers = taskTransfers
            .map(t => apiTransferToHandover(t, tempMap))
            .filter((h): h is HandoverRecord => h !== null)
            .sort((a, b) => a.timestamp - b.timestamp);
          console.log(`[apiTaskToTask] 任务 ${apiTask.id} 使用临时映射转换后得到 ${handovers.length} 条流转记录`, handovers);
        }
      } catch (error) {
        console.error(`获取任务 ${apiTask.id} 的流转记录失败:`, error);
        handovers = [];
      }
    }
  }

  const result = {
    id: apiTask.id != null ? `api-task-${apiTask.id}` : `api-task-${Date.now()}`,
    originalInput: apiTask.proposal_name || apiTask.task_name,
    title: apiTask.task_name,
    description: apiTask.strategy_description || '',
    impactScore: typeof apiTask.roi_index === 'number' ? Math.min(10, Math.max(1, apiTask.roi_index)) : 5,
    effortScore: typeof apiTask.time_cost === 'number' ? Math.min(10, Math.max(1, apiTask.time_cost)) : 5,
    strategicAdvice: apiTask.strategy_description || '',
    subTasks,
    status,
    createdAt: apiTask.created_at ? new Date(apiTask.created_at).getTime() : Date.now(),
    completedAt: status === TaskStatus.COMPLETED && apiTask.updated_at ? new Date(apiTask.updated_at).getTime() : undefined,
    tags: apiTask.influence ? [apiTask.influence] : [],
    deadline,
    handovers: handovers.length > 0 ? handovers : undefined,
    _apiId: apiTask.id,
    _displayOrder: apiTask.display_order ?? undefined,
  } as Task & { _apiId?: number; _displayOrder?: number };
  
  // 调试日志：检查 display_order 是否正确传递
  if (apiTask.display_order !== undefined && apiTask.display_order !== null) {
    console.log(`[apiTaskToTask] 任务 ${apiTask.id} 的 display_order: ${apiTask.display_order} -> _displayOrder: ${result._displayOrder}`);
  }
  
  return result;
}

/**
 * 前端 Task 转为创建/更新参数
 * @param task 前端任务
 * @param creatorApiId 创建者 API 用户 id
 * @param assigneeApiId 负责人 API 用户 id（若无可与 creatorApiId 一致）
 */
export function taskToAddTaskParams(
  task: Task,
  creatorApiId: number,
  assigneeApiId: number
): AddTaskParams {
  const now = new Date().toISOString();
  return {
    task_name: task.title,
    proposal_name: task.originalInput || task.title,
    creator_id: creatorApiId,
    assignee_id: assigneeApiId,
    deadline: task.deadline ? new Date(task.deadline).toISOString() : null,
    strategy_description: task.strategicAdvice || task.description || '',
    influence: task.tags?.[0] || '中',
    time_cost: Math.min(10, Math.max(1, task.effortScore ?? 5)),
    roi_index: Math.min(10, Math.max(1, task.impactScore ?? 5)),
    status: taskStatusToApiStatus(task.status),
    progress: task.status === TaskStatus.COMPLETED ? 100 : (task.subTasks?.length
      ? Math.round((task.subTasks.filter(st => st.completed).length / Math.max(1, task.subTasks.length)) * 100)
      : task.status === TaskStatus.IN_PROGRESS ? 50 : 0),
    timeline: task.deadline
      ? `${new Date(task.deadline).toISOString().slice(0, 10)}`
      : '',
    display_order: (task as any)._displayOrder ?? null,
    is_deleted: task.status === TaskStatus.DIVESTED,
    deleted_at: task.status === TaskStatus.DIVESTED ? now : null,
    created_at: now,
    updated_at: now,
  };
}

/**
 * 前端 Task（含 _apiId）转为更新参数
 */
export function taskToUpdateTaskParams(
  task: Task & { _apiId?: number; _displayOrder?: number },
  creatorApiId: number,
  assigneeApiId: number
): UpdateTaskParams {
  const base = taskToAddTaskParams(task, creatorApiId, assigneeApiId);
  const id = task._apiId;
  if (id == null) {
    throw new Error('更新任务需要 _apiId');
  }
  const params: UpdateTaskParams = {
    id,
    ...base,
  };
  // 如果任务有 display_order，确保传递到更新参数中
  if (task._displayOrder !== undefined && task._displayOrder !== null) {
    params.display_order = task._displayOrder;
  }
  return params;
}

