/**
 * 标签管理 API 服务
 * 与后端接口 add_coo_api_tag / query_coo_api_tag / update_coo_api_tag / delete_coo_api_tag 交互
 */

import { post } from '../utils/request';
import { API_PATHS } from '../config';

/** 后端标签数据类型（查询返回格式） */
export interface ApiTag {
  id: number;
  tag_name: string | null;
  created_at: string | null;
}

export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface QueryTagResponse {
  code: number;
  msg: string;
  data: ApiTag[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/** 创建标签请求参数 */
export interface AddTagParams {
  tag_name?: string | null;
  created_at?: string | null;
}

/** 更新标签请求参数（必须含 id） */
export interface UpdateTagParams {
  id: number;
  tag_name?: string | null;
  created_at?: string | null;
}

/** 删除标签请求参数 */
export interface DeleteTagParams {
  id: number;
}

function extractTagsFromResponse(result: any): ApiTag[] {
  if (!result || typeof result !== 'object') return [];
  const data = result.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.list)) return data.list;
  if (data && Array.isArray(data.records)) return data.records;
  return [];
}

/**
 * 查询标签列表
 */
export async function queryTags(): Promise<QueryTagResponse> {
  try {
    const result = await post<any>(API_PATHS.TAG.QUERY, {});
    const list = extractTagsFromResponse(result);
    return { ...result, data: list };
  } catch (error) {
    console.error('查询标签失败:', error);
    throw error;
  }
}

/**
 * 创建标签
 */
export async function addTag(
  params: AddTagParams = {}
): Promise<ApiResponse<ApiTag | Record<string, never>>> {
  try {
    const result = await post<ApiResponse<ApiTag | Record<string, never>>>(API_PATHS.TAG.ADD, {
      tag_name: params.tag_name ?? null,
      created_at: params.created_at ?? new Date().toISOString(),
    });
    return result;
  } catch (error) {
    console.error('创建标签失败:', error);
    throw error;
  }
}

/**
 * 更新标签（请求体必须包含 id）
 */
export async function updateTag(params: UpdateTagParams): Promise<ApiResponse<ApiTag | null>> {
  try {
    const result = await post<ApiResponse<ApiTag | null>>(API_PATHS.TAG.UPDATE, params);
    return result;
  } catch (error) {
    console.error('更新标签失败:', error);
    throw error;
  }
}

/**
 * 删除标签（请求体必须包含 id）
 */
export async function deleteTag(params: DeleteTagParams): Promise<ApiResponse<null>> {
  try {
    const result = await post<ApiResponse<null>>(API_PATHS.TAG.DELETE, { id: params.id });
    return result;
  } catch (error) {
    console.error('删除标签失败:', error);
    throw error;
  }
}

// --- 与前端 Task.tags (string[]) 互转 ---

/** ApiTag 列表 -> 前端标签名数组（去重、去空） */
export function apiTagsToTagNames(apiTags: ApiTag[]): string[] {
  const names = apiTags.map(t => t.tag_name).filter((n): n is string => !!n && n.trim() !== '');
  return [...new Set(names)];
}

/** 前端标签名 -> 创建标签参数 */
export function tagNameToAddTagParams(tagName: string): AddTagParams {
  return {
    tag_name: tagName.trim(),
    created_at: new Date().toISOString(),
  };
}

