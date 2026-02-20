/**
 * 待完成项 API 服务
 * 与后端接口交互，管理任务清单数据
 */

import { post } from '../utils/request';
import { API_PATHS } from '../config';

/**
 * 初始化待完成项表（如果不存在则创建）
 * 调用 CRUD 生成接口创建表结构
 */
export async function initTodoTable(): Promise<boolean> {
  try {
    const result = await post<any>(API_PATHS.TODO.GENERATE, {
      name: 'coo_api_todo_item',
      description: 'COO-待完成项',
      json_example: {
        id: 1,
        title: '待完成项标题',
        category: '提案与战略',
        responsible_person: '人员姓名或ID',
        roi_index: 85,
        timeline: '2023-12-01',
        progress: 50,
        action: '操作说明或链接',
        status: 'pending'
      }
    });
    console.log('待完成项表初始化结果:', result);
    return result.success || false;
  } catch (error) {
    console.warn('表初始化失败（表可能已存在）:', error);
    return false;
  }
}

// 待完成项数据类型（后端返回格式）
export interface ApiTodoItem {
  id: number;
  title: string;
  category: string;
  responsible_person: string;
  roi_index: number;
  timeline: string;
  progress: number;
  action: string;
  status: string; // 'pending' | 'in_progress' | 'completed' | 'overdue'
}

// API 响应类型
export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface QueryTodoResponse {
  code: number;
  msg: string;
  data: ApiTodoItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 添加待完成项请求参数
export interface AddTodoParams {
  title: string;
  category: string;
  responsible_person: string;
  roi_index: number;
  timeline: string;
  progress: number;
  action: string;
  status: string;
}

// 更新待完成项请求参数
export interface UpdateTodoParams {
  id: number;
  title?: string;
  category?: string;
  responsible_person?: string;
  roi_index?: number;
  timeline?: string;
  progress?: number;
  action?: string;
  status?: string;
}

// 删除待完成项请求参数
export interface DeleteTodoParams {
  id: number;
}

/**
 * 查询所有待完成项
 */
export async function queryTodoItems(): Promise<QueryTodoResponse> {
  try {
    const result = await post<QueryTodoResponse>(API_PATHS.TODO.QUERY, {});
    return result;
  } catch (error) {
    console.error('查询待完成项失败:', error);
    throw error;
  }
}

/**
 * 添加待完成项
 */
export async function addTodoItem(params: AddTodoParams): Promise<ApiResponse<ApiTodoItem>> {
  try {
    const result = await post<ApiResponse<ApiTodoItem>>(API_PATHS.TODO.ADD, params);
    return result;
  } catch (error) {
    console.error('添加待完成项失败:', error);
    throw error;
  }
}

/**
 * 更新待完成项
 */
export async function updateTodoItem(params: UpdateTodoParams): Promise<ApiResponse<ApiTodoItem>> {
  try {
    const result = await post<ApiResponse<ApiTodoItem>>(API_PATHS.TODO.UPDATE, params);
    return result;
  } catch (error) {
    console.error('更新待完成项失败:', error);
    throw error;
  }
}

/**
 * 删除待完成项
 */
export async function deleteTodoItem(params: DeleteTodoParams): Promise<ApiResponse<null>> {
  try {
    const result = await post<ApiResponse<null>>(API_PATHS.TODO.DELETE, params);
    return result;
  } catch (error) {
    console.error('删除待完成项失败:', error);
    throw error;
  }
}

