/**
 * 任务流转管理 API 服务
 * 与后端接口 add_coo_api_task_transfer / query_coo_api_task_transfer / update_coo_api_task_transfer / delete_coo_api_task_transfer 交互
 */

import { post } from '../utils/request';
import { API_PATHS } from '../config';

/** 后端任务流转数据类型（查询返回格式） */
export interface ApiTaskTransfer {
  id: number;
  task_id: number | null;
  from_user_id: number | null;
  to_user_id: number | null;
  department_id: number | null;
  message: string | null;
  transfer_time: string | null;
  status: string | null;
}

export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface QueryTaskTransferResponse {
  code: number;
  msg: string;
  data: ApiTaskTransfer[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/** 创建任务流转请求参数 */
export interface AddTaskTransferParams {
  task_id?: number | null;
  from_user_id?: number | null;
  to_user_id?: number | null;
  department_id?: number | null;
  message?: string | null;
  transfer_time?: string | null;
  status?: string | null;
}

/** 更新任务流转请求参数（必须含 id） */
export interface UpdateTaskTransferParams {
  id: number;
  task_id?: number | null;
  from_user_id?: number | null;
  to_user_id?: number | null;
  department_id?: number | null;
  message?: string | null;
  transfer_time?: string | null;
  status?: string | null;
}

/** 删除任务流转请求参数 */
export interface DeleteTaskTransferParams {
  id: number;
}

function extractTransfersFromResponse(result: any): ApiTaskTransfer[] {
  if (!result || typeof result !== 'object') {
    console.warn('[extractTransfersFromResponse] 无效的响应格式:', result);
    return [];
  }
  
  const data = result.data;
  
  // 情况1: data 直接是数组（标准格式）
  if (Array.isArray(data)) {
    console.log(`[extractTransfersFromResponse] 从 data 数组提取到 ${data.length} 条流转记录`);
    return data;
  }
  
  // 情况2: data.list 是数组
  if (data && Array.isArray(data.list)) {
    console.log(`[extractTransfersFromResponse] 从 data.list 提取到 ${data.list.length} 条流转记录`);
    return data.list;
  }
  
  // 情况3: data.records 是数组
  if (data && Array.isArray(data.records)) {
    console.log(`[extractTransfersFromResponse] 从 data.records 提取到 ${data.records.length} 条流转记录`);
    return data.records;
  }
  
  console.warn('[extractTransfersFromResponse] 无法从响应中提取流转记录，响应结构:', {
    hasData: !!data,
    dataType: typeof data,
    dataKeys: data ? Object.keys(data) : []
  });
  return [];
}

/**
 * 查询任务流转列表
 */
export async function queryTaskTransfers(): Promise<QueryTaskTransferResponse> {
  try {
    console.log('[queryTaskTransfers] 开始查询任务流转列表');
    const result = await post<any>(API_PATHS.TASK_TRANSFER.QUERY, {});
    console.log('[queryTaskTransfers] 接口返回原始数据:', result);
    
    const list = extractTransfersFromResponse(result);
    console.log(`[queryTaskTransfers] 解析后得到 ${list.length} 条流转记录`);
    
    const response: QueryTaskTransferResponse = {
      code: result.code || 200,
      msg: result.msg || '查询成功',
      data: list,
      total: result.total ?? list.length,
      page: result.page ?? 1,
      page_size: result.page_size ?? 100,
      total_pages: result.total_pages ?? 1
    };
    
    return response;
  } catch (error) {
    console.error('[queryTaskTransfers] 查询任务流转失败:', error);
    throw error;
  }
}

/**
 * 创建任务流转
 */
export async function addTaskTransfer(
  params: AddTaskTransferParams = {}
): Promise<ApiResponse<ApiTaskTransfer | Record<string, never>>> {
  try {
    const result = await post<ApiResponse<ApiTaskTransfer | Record<string, never>>>(API_PATHS.TASK_TRANSFER.ADD, {
      task_id: params.task_id ?? null,
      from_user_id: params.from_user_id ?? null,
      to_user_id: params.to_user_id ?? null,
      department_id: params.department_id ?? null,
      message: params.message ?? null,
      transfer_time: params.transfer_time ?? new Date().toISOString(),
      status: params.status ?? null,
    });
    return result;
  } catch (error) {
    console.error('创建任务流转失败:', error);
    throw error;
  }
}

/**
 * 更新任务流转（请求体必须包含 id）
 */
export async function updateTaskTransfer(
  params: UpdateTaskTransferParams
): Promise<ApiResponse<ApiTaskTransfer | null>> {
  try {
    const result = await post<ApiResponse<ApiTaskTransfer | null>>(API_PATHS.TASK_TRANSFER.UPDATE, params);
    return result;
  } catch (error) {
    console.error('更新任务流转失败:', error);
    throw error;
  }
}

/**
 * 删除任务流转（请求体必须包含 id）
 */
export async function deleteTaskTransfer(
  params: DeleteTaskTransferParams
): Promise<ApiResponse<null>> {
  try {
    const result = await post<ApiResponse<null>>(API_PATHS.TASK_TRANSFER.DELETE, { id: params.id });
    return result;
  } catch (error) {
    console.error('删除任务流转失败:', error);
    throw error;
  }
}

// --- 辅助方法 ---

/** 按 task_id 筛选流转记录 */
export function filterTransfersByTaskId(
  transfers: ApiTaskTransfer[],
  taskId: number
): ApiTaskTransfer[] {
  return transfers.filter(t => t.task_id === taskId);
}

/** 按 to_user_id 筛选（转给我的记录） */
export function filterTransfersByToUserId(
  transfers: ApiTaskTransfer[],
  toUserId: number
): ApiTaskTransfer[] {
  return transfers.filter(t => t.to_user_id === toUserId);
}

