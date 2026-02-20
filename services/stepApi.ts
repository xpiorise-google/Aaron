/**
 * 步骤管理 API 服务
 * 与后端接口 add_coo_api_step / query_coo_api_step / update_coo_api_step / delete_coo_api_step 交互
 */

import type { SubTask } from '../types';
import { post } from '../utils/request';
import { API_PATHS } from '../config';

/** 后端步骤数据类型（查询返回格式） */
export interface ApiStep {
  id: number;
  task_id: number | null;
  step_number: number | null;
  description: string | null;
  is_completed: boolean | number | null;
  deadline: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface QueryStepResponse {
  code: number;
  msg: string;
  data: ApiStep[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/** 创建步骤请求参数 */
export interface AddStepParams {
  task_id?: number | null;
  step_number?: number | null;
  description?: string | null;
  is_completed?: boolean | null;
  deadline?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** 更新步骤请求参数（必须含 id） */
export interface UpdateStepParams {
  id: number;
  task_id?: number | null;
  step_number?: number | null;
  description?: string | null;
  is_completed?: boolean | null;
  deadline?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** 删除步骤请求参数 */
export interface DeleteStepParams {
  id: number;
}

function extractStepsFromResponse(result: any): ApiStep[] {
  if (!result || typeof result !== 'object') return [];
  const data = result.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.list)) return data.list;
  if (data && Array.isArray(data.records)) return data.records;
  return [];
}

/**
 * 查询步骤列表
 * @param filters 可选的筛选参数
 */
export interface QueryStepFilters {
  deadline?: string | null; // ISO 日期字符串，用于筛选特定日期的步骤
  deadline_before?: string | null; // ISO 日期字符串，筛选 deadline 早于该日期的步骤
  deadline_after?: string | null; // ISO 日期字符串，筛选 deadline 晚于该日期的步骤
  task_id?: number | null; // 按任务 ID 筛选
}

export async function querySteps(filters?: QueryStepFilters): Promise<QueryStepResponse> {
  try {
    const queryParams: any = {};
    if (filters) {
      if (filters.deadline !== undefined) queryParams.deadline = filters.deadline;
      if (filters.deadline_before !== undefined) queryParams.deadline_before = filters.deadline_before;
      if (filters.deadline_after !== undefined) queryParams.deadline_after = filters.deadline_after;
      if (filters.task_id !== undefined) queryParams.task_id = filters.task_id;
    }
    const result = await post<any>(API_PATHS.STEP.QUERY, queryParams);
    const steps = extractStepsFromResponse(result);
    return { ...result, data: steps };
  } catch (error) {
    console.error('查询步骤失败:', error);
    throw error;
  }
}

/**
 * 创建步骤
 */
export async function addStep(params: AddStepParams = {}): Promise<ApiResponse<ApiStep | Record<string, never>>> {
  try {
    const result = await post<ApiResponse<ApiStep | Record<string, never>>>(API_PATHS.STEP.ADD, {
      task_id: params.task_id ?? null,
      step_number: params.step_number ?? null,
      description: params.description ?? null,
      is_completed: params.is_completed ?? null,
      deadline: params.deadline ?? null,
      created_at: params.created_at ?? new Date().toISOString(),
      updated_at: params.updated_at ?? new Date().toISOString(),
    });
    return result;
  } catch (error) {
    console.error('创建步骤失败:', error);
    throw error;
  }
}

/**
 * 更新步骤（请求体必须包含 id）
 */
export async function updateStep(params: UpdateStepParams): Promise<ApiResponse<ApiStep | null>> {
  try {
    const result = await post<ApiResponse<ApiStep | null>>(API_PATHS.STEP.UPDATE, params);
    return result;
  } catch (error) {
    console.error('更新步骤失败:', error);
    throw error;
  }
}

/**
 * 删除步骤（请求体必须包含 id）
 */
export async function deleteStep(params: DeleteStepParams): Promise<ApiResponse<null>> {
  try {
    const result = await post<ApiResponse<null>>(API_PATHS.STEP.DELETE, { id: params.id });
    return result;
  } catch (error) {
    console.error('删除步骤失败:', error);
    throw error;
  }
}

// --- 与前端 SubTask (types) 互转 ---

/** 按 task_id 筛选步骤 */
export function filterStepsByTaskId(steps: ApiStep[], taskId: number): ApiStep[] {
  return steps.filter(s => s.task_id === taskId);
}

/** ApiStep -> 前端 SubTask */
export function apiStepToSubTask(step: ApiStep, index: number): SubTask {
  // 将 ISO 日期字符串转换为时间戳
  let deadline: number | undefined = undefined;
  if (step.deadline) {
    const date = new Date(step.deadline);
    if (!isNaN(date.getTime())) {
      deadline = date.getTime();
    }
  }
  
  return {
    id: step.id != null ? `api-step-${step.id}` : `api-step-${index}-${Date.now()}`,
    title: step.description ?? `步骤 ${(step.step_number ?? index) + 1}`,
    completed: !!step.is_completed,
    deadline: deadline,
  };
}

/** 前端 SubTask -> 创建步骤参数（需传入 task_id） */
export function subTaskToAddStepParams(subTask: SubTask, taskId: number, stepNumber: number): AddStepParams {
  // 将时间戳转换为 ISO 日期字符串（仅日期部分，YYYY-MM-DD）
  let deadline: string | null = null;
  if (subTask.deadline) {
    const date = new Date(subTask.deadline);
    if (!isNaN(date.getTime())) {
      // 转换为 YYYY-MM-DD 格式
      deadline = date.toISOString().split('T')[0];
    }
  }
  
  return {
    task_id: taskId,
    step_number: stepNumber,
    description: subTask.title,
    is_completed: subTask.completed,
    deadline: deadline,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/** 前端 SubTask（含 _apiStepId）-> 更新步骤参数 */
export function subTaskToUpdateStepParams(
  subTask: SubTask & { _apiStepId?: number },
  taskId: number,
  stepNumber: number
): UpdateStepParams {
  const id = subTask._apiStepId;
  if (id == null) throw new Error('更新步骤需要 _apiStepId');
  
  // 将时间戳转换为 ISO 日期字符串（仅日期部分，YYYY-MM-DD）
  let deadline: string | null = null;
  if (subTask.deadline) {
    const date = new Date(subTask.deadline);
    if (!isNaN(date.getTime())) {
      // 转换为 YYYY-MM-DD 格式
      deadline = date.toISOString().split('T')[0];
    }
  }
  
  return {
    id,
    task_id: taskId,
    step_number: stepNumber,
    description: subTask.title,
    is_completed: subTask.completed,
    deadline: deadline,
    updated_at: new Date().toISOString(),
  };
}

