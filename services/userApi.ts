/**
 * 用户管理 API 服务
 * 与后端接口交互，管理用户数据
 */

import { post } from '../utils/request';
import { API_PATHS } from '../config';

// 用户数据类型（后端返回格式）
export interface ApiUser {
  id: number;
  username: string;
  password: string;
  display_name: string;
  role: string;
  sort_code: string;
  attachment_url: string;
  department_id: string | number;
}

// API 响应类型
export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface QueryUserResponse {
  code: number;
  msg: string;
  data: ApiUser[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 添加用户请求参数
export interface AddUserParams {
  username: string;
  password: string;
  display_name: string;
  role: string;
  sort_code: string;
  department_id: string | number;
  attachment_url?: string;
}

// 更新用户请求参数
export interface UpdateUserParams {
  id: number;
  username?: string;
  password?: string;
  display_name?: string;
  role?: string;
  sort_code?: string;
  department_id?: string | number;
  attachment_url?: string;
}

// 删除用户请求参数
export interface DeleteUserParams {
  id: number;
}

/**
 * 从 API 响应中提取用户数组（兼容 data 直接为数组或 data.list 分页格式）
 */
function extractUsersFromResponse(result: any): ApiUser[] {
  if (!result || typeof result !== 'object') return [];
  const data = result.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.list)) return data.list;
  if (data && Array.isArray(data.records)) return data.records;
  return [];
}

/**
 * 查询所有用户
 */
export async function queryUsers(): Promise<QueryUserResponse> {
  try {
    const result = await post<any>(API_PATHS.USER.QUERY, {});
    // 标准化 data 为数组格式，兼容不同后端返回结构
    const users = extractUsersFromResponse(result);
    return { ...result, data: users };
  } catch (error) {
    console.error('查询用户失败:', error);
    throw error;
  }
}

// 用户查询缓存（避免重复查询同一用户）
const userQueryCache: Map<string, { data: ApiUser[]; timestamp: number }> = new Map();
const USER_QUERY_CACHE_TTL = 5000; // 5秒缓存

/**
 * 根据用户名查询单个用户详细信息
 * 带缓存机制，避免重复查询
 */
export async function queryUserByUsername(username: string, useCache: boolean = true): Promise<ApiResponse<ApiUser[]>> {
  try {
    // 检查缓存
    if (useCache) {
      const cached = userQueryCache.get(username);
      if (cached && Date.now() - cached.timestamp < USER_QUERY_CACHE_TTL) {
        return { code: 200, msg: 'success', data: cached.data };
      }
    }
    
    const result = await post<any>(API_PATHS.USER.QUERY, {
      filters: { username }
    });
    // 标准化 data 为数组格式，兼容不同后端返回结构
    const users = extractUsersFromResponse(result);
    
    // 更新缓存
    userQueryCache.set(username, { data: users, timestamp: Date.now() });
    
    return { ...result, data: users };
  } catch (error) {
    console.error(`查询用户 ${username} 失败:`, error);
    throw error;
  }
}

/**
 * 添加用户
 */
export async function addUser(params: AddUserParams): Promise<ApiResponse<ApiUser>> {
  try {
    const result = await post<ApiResponse<ApiUser>>(API_PATHS.USER.ADD, {
      username: params.username,
      password: params.password,
      display_name: params.display_name,
      role: params.role,
      sort_code: params.sort_code,
      department_id: params.department_id?.toString() || '',
      attachment_url: params.attachment_url || '',
    });
    return result;
  } catch (error) {
    console.error('添加用户失败:', error);
    throw error;
  }
}

/**
 * 更新用户
 */
export async function updateUser(params: UpdateUserParams): Promise<ApiResponse<ApiUser>> {
  try {
    const result = await post<ApiResponse<ApiUser>>(API_PATHS.USER.UPDATE, params);
    return result;
  } catch (error) {
    console.error('更新用户失败:', error);
    throw error;
  }
}

/**
 * 删除用户
 */
export async function deleteUser(params: DeleteUserParams): Promise<ApiResponse<null>> {
  try {
    const result = await post<ApiResponse<null>>(API_PATHS.USER.DELETE, params);
    return result;
  } catch (error) {
    console.error('删除用户失败:', error);
    throw error;
  }
}

