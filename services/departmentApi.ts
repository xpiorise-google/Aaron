/**
 * 部门管理 API 服务
 * 与后端接口交互，管理组织架构中的部门数据
 */

import { post } from '../utils/request';
import { API_PATHS } from '../config';

// 部门数据类型
export interface Department {
  id: number;
  department_name: string;
  parent_id: string | number | null;
}

// API 响应类型
export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface QueryDepartmentResponse {
  code: number;
  msg: string;
  data: Department[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 添加部门请求参数
export interface AddDepartmentParams {
  department_name: string;
  parent_id: string | number;
}

// 更新部门请求参数
export interface UpdateDepartmentParams {
  id: number;
  department_name?: string;
  parent_id?: string | number;
}

// 删除部门请求参数
export interface DeleteDepartmentParams {
  id: number;
}

/**
 * 查询所有部门
 */
export async function queryDepartments(): Promise<QueryDepartmentResponse> {
  try {
    const result = await post<QueryDepartmentResponse>(API_PATHS.DEPARTMENT.QUERY, {});
    return result;
  } catch (error) {
    console.error('查询部门失败:', error);
    throw error;
  }
}

/**
 * 添加部门
 */
export async function addDepartment(params: AddDepartmentParams): Promise<ApiResponse<Department>> {
  try {
    const result = await post<ApiResponse<Department>>(API_PATHS.DEPARTMENT.ADD, {
      department_name: params.department_name,
      parent_id: params.parent_id?.toString() || '',
    });
    return result;
  } catch (error) {
    console.error('添加部门失败:', error);
    throw error;
  }
}

/**
 * 更新部门
 */
export async function updateDepartment(params: UpdateDepartmentParams): Promise<ApiResponse<Department>> {
  try {
    const result = await post<ApiResponse<Department>>(API_PATHS.DEPARTMENT.UPDATE, params);
    return result;
  } catch (error) {
    console.error('更新部门失败:', error);
    throw error;
  }
}

/**
 * 删除部门
 */
export async function deleteDepartment(params: DeleteDepartmentParams): Promise<ApiResponse<null>> {
  try {
    const result = await post<ApiResponse<null>>(API_PATHS.DEPARTMENT.DELETE, params);
    return result;
  } catch (error) {
    console.error('删除部门失败:', error);
    throw error;
  }
}

/**
 * 将后端部门数据转换为前端树形结构
 */
export interface DeptTreeNode {
  id: number;
  name: string;
  parentId: string | number | null;
  children: DeptTreeNode[];
  memberCount: number;
}

export function buildDeptTree(departments: Department[]): DeptTreeNode[] {
  // 创建部门映射
  const deptMap = new Map<number, DeptTreeNode>();
  
  // 初始化所有节点
  departments.forEach(dept => {
    deptMap.set(dept.id, {
      id: dept.id,
      name: dept.department_name,
      parentId: dept.parent_id,
      children: [],
      memberCount: 0,
    });
  });
  
  // 构建树形结构
  const rootNodes: DeptTreeNode[] = [];
  
  departments.forEach(dept => {
    const node = deptMap.get(dept.id)!;
    const parentId = dept.parent_id;
    
    if (parentId === '' || parentId === null || parentId === undefined) {
      // 根节点
      rootNodes.push(node);
    } else {
      // 查找父节点
      const parentIdNum = typeof parentId === 'string' ? parseInt(parentId, 10) : parentId;
      const parentNode = deptMap.get(parentIdNum);
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        // 如果找不到父节点，作为根节点处理
        rootNodes.push(node);
      }
    }
  });
  
  return rootNodes;
}

/**
 * 根据部门名称查找部门ID
 */
export function findDepartmentByName(departments: Department[], name: string): Department | undefined {
  return departments.find(d => d.department_name === name);
}

/**
 * 根据部门ID查找部门
 */
export function findDepartmentById(departments: Department[], id: number): Department | undefined {
  return departments.find(d => d.id === id);
}

/**
 * 根据部门名称获取其父部门名称（用于母部门权限判断）
 */
export function getParentDepartmentName(departments: Department[], deptName: string): string | null {
  const dept = findDepartmentByName(departments, deptName);
  if (!dept || dept.parent_id === null || dept.parent_id === '' || dept.parent_id === undefined) return null;
  const parentId = typeof dept.parent_id === 'string' ? parseInt(dept.parent_id, 10) : dept.parent_id;
  const parent = findDepartmentById(departments, parentId);
  return parent ? parent.department_name : null;
}

