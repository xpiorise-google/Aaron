/**
 * 任务与标签关联 API 服务
 * 与后端接口 add_coo_api_task_tag / query_coo_api_task_tag / update_coo_api_task_tag / delete_coo_api_task_tag 交互
 */

import { post } from '../utils/request';
import { API_PATHS } from '../config';

/** 后端任务-标签关联数据类型（查询返回格式） */
export interface ApiTaskTag {
  id: number;
  task_id: number | null;
  tag_id: number | null;
}

export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface QueryTaskTagResponse {
  code: number;
  msg: string;
  data: ApiTaskTag[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/** 创建任务-标签关联请求参数 */
export interface AddTaskTagParams {
  task_id?: number | null;
  tag_id?: number | null;
}

/** 更新任务-标签关联请求参数（必须含 id） */
export interface UpdateTaskTagParams {
  id: number;
  task_id?: number | null;
  tag_id?: number | null;
}

/** 删除任务-标签关联请求参数 */
export interface DeleteTaskTagParams {
  id: number;
}

function extractTaskTagsFromResponse(result: any): ApiTaskTag[] {
  if (!result || typeof result !== 'object') return [];
  const data = result.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.list)) return data.list;
  if (data && Array.isArray(data.records)) return data.records;
  return [];
}

/**
 * 查询任务-标签关联列表
 */
export async function queryTaskTags(): Promise<QueryTaskTagResponse> {
  try {
    const result = await post<any>(API_PATHS.TASK_TAG.QUERY, {});
    const list = extractTaskTagsFromResponse(result);
    return { ...result, data: list };
  } catch (error) {
    console.error('查询任务-标签关联失败:', error);
    throw error;
  }
}

/**
 * 创建任务-标签关联
 */
export async function addTaskTag(
  params: AddTaskTagParams = {}
): Promise<ApiResponse<ApiTaskTag | Record<string, never>>> {
  try {
    const result = await post<ApiResponse<ApiTaskTag | Record<string, never>>>(API_PATHS.TASK_TAG.ADD, {
      task_id: params.task_id ?? null,
      tag_id: params.tag_id ?? null,
    });
    return result;
  } catch (error) {
    console.error('创建任务-标签关联失败:', error);
    throw error;
  }
}

/**
 * 更新任务-标签关联（请求体必须包含 id）
 */
export async function updateTaskTag(
  params: UpdateTaskTagParams
): Promise<ApiResponse<ApiTaskTag | null>> {
  try {
    const result = await post<ApiResponse<ApiTaskTag | null>>(API_PATHS.TASK_TAG.UPDATE, params);
    return result;
  } catch (error) {
    console.error('更新任务-标签关联失败:', error);
    throw error;
  }
}

/**
 * 删除任务-标签关联（请求体必须包含 id）
 */
export async function deleteTaskTag(params: DeleteTaskTagParams): Promise<ApiResponse<null>> {
  try {
    const result = await post<ApiResponse<null>>(API_PATHS.TASK_TAG.DELETE, { id: params.id });
    return result;
  } catch (error) {
    console.error('删除任务-标签关联失败:', error);
    throw error;
  }
}

// --- 辅助方法 ---

/** 按 task_id 筛选关联 */
export function filterTaskTagsByTaskId(relations: ApiTaskTag[], taskId: number): ApiTaskTag[] {
  return relations.filter(r => r.task_id === taskId);
}

/** 按 tag_id 筛选关联 */
export function filterTaskTagsByTagId(relations: ApiTaskTag[], tagId: number): ApiTaskTag[] {
  return relations.filter(r => r.tag_id === tagId);
}

/** 根据任务-标签关联与标签列表，得到某任务的标签 id 列表 */
export function getTagIdsByTaskId(relations: ApiTaskTag[], taskId: number): number[] {
  return relations
    .filter(r => r.task_id === taskId && r.tag_id != null)
    .map(r => r.tag_id as number);
}

