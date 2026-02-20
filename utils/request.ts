/**
 * 通用请求工具
 * 包含鉴权机制、会话管理、401处理等
 */

import { API_BASE_URL, STORAGE_KEYS, LOGIN_PATH } from '../config';

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean; // 是否跳过鉴权（用于登录等接口）
}

export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

/**
 * 检查是否有有效的 token
 */
function hasValidToken(): boolean {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const timestamp = localStorage.getItem(STORAGE_KEYS.TOKEN_TIMESTAMP);
  const expires = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES);
  
  // 如果没有 token，返回 false（不触发登出，只是不添加 Authorization header）
  if (!token || !timestamp || !expires) {
    return false;
  }
  
  const now = Date.now();
  const tokenTime = parseInt(timestamp, 10);
  const expiresTime = parseInt(expires, 10);
  
  // 检查是否过期（毫秒级）
  const isExpired = now - tokenTime >= expiresTime;
  return !isExpired;
}

/**
 * 检查用户是否已登录（基于应用的用户状态）
 */
function isUserLoggedIn(): boolean {
  return !!localStorage.getItem(STORAGE_KEYS.SESSION_USER);
}

/**
 * 重定向到登录页
 * 对于单页应用，通过清除用户状态来触发登录页面显示
 */
function redirectToLogin(): void {
  // 清除 token 相关数据
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_TIMESTAMP);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES);
  
  // 清除用户会话状态（App.tsx 会检测并显示登录页面）
  localStorage.removeItem(STORAGE_KEYS.SESSION_USER);
  localStorage.removeItem(STORAGE_KEYS.SESSION_ORG_ID);
  localStorage.removeItem(STORAGE_KEYS.SESSION_IS_ADMIN);
  
  // 触发自定义事件通知应用更新状态
  window.dispatchEvent(new CustomEvent('auth:logout'));
  
  // 对于单页应用，跳转到 TheCoo.html，让 App.tsx 自动显示登录页面
  // 避免跳转到不存在的 /login 路径
  const currentPath = window.location.pathname;
  const thecooHtmlPath = '/TheCoo.html';
  if (currentPath !== thecooHtmlPath && currentPath !== '/') {
    window.location.href = thecooHtmlPath;
  } else if (currentPath === '/') {
    // 如果在根路径，也跳转到 TheCoo.html
    window.location.href = thecooHtmlPath;
  }
}

/**
 * 获取请求头（自动注入 token）
 */
function getHeaders(options?: RequestOptions): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'accept': 'application/json',
    ...options?.headers,
  };
  
  // 如果不是跳过鉴权的请求，自动注入 token
  if (!options?.skipAuth) {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      // 也可以使用其他 header 名称，根据后端要求调整
      // (headers as Record<string, string>)['X-Token'] = token;
    }
  }
  
  return headers;
}

/**
 * 通用请求函数
 */
export async function request<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  // 请求前检查 token 是否有效（非跳过鉴权的请求）
  // 只有当用户已登录但没有有效 token 时，才触发登出
  // 注意：如果用户根本没有设置 token（开发环境），不会触发登出
  if (!options.skipAuth && isUserLoggedIn() && !hasValidToken()) {
    // 检查是否确实有 token（只是过期了）
    const hasToken = !!localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (hasToken) {
      // 有 token 但过期了，触发登出
      redirectToLogin();
      throw new Error('Token expired');
    }
    // 没有 token，不触发登出（可能是开发环境，后端还未实现 token 认证）
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: getHeaders(options),
    });
    
    // 处理 401 未授权
    if (response.status === 401) {
      redirectToLogin();
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

/**
 * GET 请求
 */
export async function get<T = any>(
  path: string,
  options?: RequestOptions
): Promise<T> {
  return request<T>(`${API_BASE_URL}${path}`, {
    ...options,
    method: 'GET',
  });
}

/**
 * POST 请求
 */
export async function post<T = any>(
  path: string,
  data?: any,
  options?: RequestOptions
): Promise<T> {
  const fullUrl = `${API_BASE_URL}${path}`;
  console.log('[POST] 请求 URL:', fullUrl);
  console.log('[POST] 请求数据:', data);
  return request<T>(fullUrl, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT 请求
 */
export async function put<T = any>(
  path: string,
  data?: any,
  options?: RequestOptions
): Promise<T> {
  return request<T>(`${API_BASE_URL}${path}`, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE 请求
 */
export async function del<T = any>(
  path: string,
  options?: RequestOptions
): Promise<T> {
  return request<T>(`${API_BASE_URL}${path}`, {
    ...options,
    method: 'DELETE',
  });
}

