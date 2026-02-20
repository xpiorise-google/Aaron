/**
 * 附件管理 API 服务
 * 与后端接口 add_coo_api_attachment / query_coo_api_attachment / update_coo_api_attachment / delete_coo_api_attachment 交互
 */

import type { Attachment } from '../types';
import { post } from '../utils/request';
import { API_PATHS } from '../config';

/** 后端附件数据类型（查询返回格式） */
export interface ApiAttachment {
  id: number;
  task_id: number | null;
  uploader_id: number | null;
  file_name: string | null;
  file_path: string | null;
  upload_time: string | null;
}

export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface QueryAttachmentResponse {
  code: number;
  msg: string;
  data: ApiAttachment[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/** 创建附件请求参数 */
export interface AddAttachmentParams {
  task_id?: number | null;
  uploader_id?: number | null;
  file_name?: string | null;
  file_path?: string | null;
  upload_time?: string | null;
}

/** 更新附件请求参数（必须含 id） */
export interface UpdateAttachmentParams {
  id: number;
  task_id?: number | null;
  uploader_id?: number | null;
  file_name?: string | null;
  file_path?: string | null;
  upload_time?: string | null;
}

/** 删除附件请求参数 */
export interface DeleteAttachmentParams {
  id: number;
}

function extractAttachmentsFromResponse(result: any): ApiAttachment[] {
  if (!result || typeof result !== 'object') return [];
  const data = result.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.list)) return data.list;
  if (data && Array.isArray(data.records)) return data.records;
  return [];
}

/**
 * 查询附件列表
 */
export async function queryAttachments(): Promise<QueryAttachmentResponse> {
  try {
    const result = await post<any>(API_PATHS.ATTACHMENT.QUERY, {});
    const list = extractAttachmentsFromResponse(result);
    return { ...result, data: list };
  } catch (error) {
    console.error('查询附件失败:', error);
    throw error;
  }
}

/**
 * 创建附件
 */
export async function addAttachment(
  params: AddAttachmentParams = {}
): Promise<ApiResponse<ApiAttachment | Record<string, never>>> {
  try {
    const result = await post<ApiResponse<ApiAttachment | Record<string, never>>>(API_PATHS.ATTACHMENT.ADD, {
      task_id: params.task_id ?? null,
      uploader_id: params.uploader_id ?? null,
      file_name: params.file_name ?? null,
      file_path: params.file_path ?? null,
      upload_time: params.upload_time ?? new Date().toISOString(),
    });
    return result;
  } catch (error) {
    console.error('创建附件失败:', error);
    throw error;
  }
}

/**
 * 更新附件（请求体必须包含 id）
 */
export async function updateAttachment(
  params: UpdateAttachmentParams
): Promise<ApiResponse<ApiAttachment | null>> {
  try {
    const result = await post<ApiResponse<ApiAttachment | null>>(API_PATHS.ATTACHMENT.UPDATE, params);
    return result;
  } catch (error) {
    console.error('更新附件失败:', error);
    throw error;
  }
}

/**
 * 删除附件（请求体必须包含 id）
 */
export async function deleteAttachment(params: DeleteAttachmentParams): Promise<ApiResponse<null>> {
  try {
    const result = await post<ApiResponse<null>>(API_PATHS.ATTACHMENT.DELETE, { id: params.id });
    return result;
  } catch (error) {
    console.error('删除附件失败:', error);
    throw error;
  }
}

// --- 与前端 Attachment (types) 互转 ---

/** 按 task_id 筛选附件 */
export function filterAttachmentsByTaskId(attachments: ApiAttachment[], taskId: number): ApiAttachment[] {
  return attachments.filter(a => a.task_id === taskId);
}

/** ApiAttachment -> 前端 Attachment（file_path 或 file_name 可映射到 data/name） */
export function apiAttachmentToAttachment(api: ApiAttachment): Attachment {
  return {
    id: api.id != null ? `api-attachment-${api.id}` : `api-attachment-${Date.now()}`,
    name: api.file_name ?? '附件',
    type: api.file_name?.split('.').pop()?.toLowerCase() === 'pdf' ? 'pdf' : 
          api.file_name?.split('.').pop()?.toLowerCase() === 'xlsx' || api.file_name?.split('.').pop()?.toLowerCase() === 'xls' ? 'excel' :
          api.file_name?.split('.').pop()?.toLowerCase() === 'docx' || api.file_name?.split('.').pop()?.toLowerCase() === 'doc' ? 'word' :
          api.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'other',
    mimeType: 'application/octet-stream',
    size: 0,
    data: api.file_path ?? '',
    createdAt: api.upload_time ? new Date(api.upload_time).getTime() : Date.now(),
  };
}

/** 前端 Attachment -> 创建附件参数（需传入 task_id、uploader_id；data 可为 base64 或 URL 存 file_path） */
export function attachmentToAddAttachmentParams(
  attachment: Attachment,
  taskId: number,
  uploaderId: number
): AddAttachmentParams {
  return {
    task_id: taskId,
    uploader_id: uploaderId,
    file_name: attachment.name,
    file_path: attachment.data,
    upload_time: new Date(attachment.createdAt).toISOString(),
  };
}

/** 前端 Attachment（含 _apiAttachmentId）-> 更新附件参数 */
export function attachmentToUpdateAttachmentParams(
  attachment: Attachment & { _apiAttachmentId?: number },
  taskId: number,
  uploaderId: number
): UpdateAttachmentParams {
  const id = attachment._apiAttachmentId;
  if (id == null) throw new Error('更新附件需要 _apiAttachmentId');
  return {
    id,
    task_id: taskId,
    uploader_id: uploaderId,
    file_name: attachment.name,
    file_path: attachment.data,
    upload_time: new Date(attachment.createdAt).toISOString(),
  };
}

