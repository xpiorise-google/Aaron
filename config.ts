/// <reference types="./vite-env.d.ts" />

/**
 * 全局配置
 * 全局配置数据写入 config.ts，接口路径注册于 config.ts
 */

// 环境配置
export const isDev = import.meta.env.DEV;
export const isProd = import.meta.env.PROD;

// API 基础路径配置
// 开发环境：固定域名调试
// 生产环境：相对路径，确保可任意部署
export const API_BASE_URL = isDev 
  ? 'https://xertest.wenshidt.com/api/main/api'
  : '/thecoo';

// 接口路径注册
export const API_PATHS = {
  // 任务相关
  TASK: {
    QUERY: '/query_coo_api_task',
    ADD: '/add_coo_api_task',
    UPDATE: '/update_coo_api_task',
    DELETE: '/delete_coo_api_task',
  },
  // 用户相关
  USER: {
    QUERY: '/query_coo_api_user',
    ADD: '/add_coo_api_user',
    UPDATE: '/update_coo_api_user',
    DELETE: '/delete_coo_api_user',
  },
  // 部门相关
  DEPARTMENT: {
    QUERY: '/query_coo_api_department',
    ADD: '/add_coo_api_department',
    UPDATE: '/update_coo_api_department',
    DELETE: '/delete_coo_api_department',
  },
  // 附件相关
  ATTACHMENT: {
    QUERY: '/query_coo_api_attachment',
    ADD: '/add_coo_api_attachment',
    UPDATE: '/update_coo_api_attachment',
    DELETE: '/delete_coo_api_attachment',
  },
  // 任务标签相关
  TASK_TAG: {
    QUERY: '/query_coo_api_task_tag',
    ADD: '/add_coo_api_task_tag',
    UPDATE: '/update_coo_api_task_tag',
    DELETE: '/delete_coo_api_task_tag',
  },
  // 标签相关
  TAG: {
    QUERY: '/query_coo_api_tag',
    ADD: '/add_coo_api_tag',
    UPDATE: '/update_coo_api_tag',
    DELETE: '/delete_coo_api_tag',
  },
  // 任务流转相关
  TASK_TRANSFER: {
    QUERY: '/query_coo_api_task_transfer',
    ADD: '/add_coo_api_task_transfer',
    UPDATE: '/update_coo_api_task_transfer',
    DELETE: '/delete_coo_api_task_transfer',
  },
  // 步骤相关
  STEP: {
    QUERY: '/query_coo_api_step',
    ADD: '/add_coo_api_step',
    UPDATE: '/update_coo_api_step',
    DELETE: '/delete_coo_api_step',
  },
  // 待办事项相关
  TODO: {
    GENERATE: '/crud/generate',
    QUERY: '/query_coo_api_todo_item',
    ADD: '/add_coo_api_todo_item',
    UPDATE: '/update_coo_api_todo_item',
    DELETE: '/delete_coo_api_todo_item',
  },
  // AI 基座相关
  AI: {
    CHAT_COMPLETIONS: '/ai/v1/chat/completions',
  },
} as const;

// 存储键名常量
export const STORAGE_KEYS = {
  // 鉴权相关
  TOKEN: 'xer_token',
  TOKEN_TIMESTAMP: 'xer_token_timestamp',
  TOKEN_EXPIRES: 'xer_token_expires',
  
  // 会话相关
  SESSION_USER: 'executive_session_user',
  SESSION_ORG_ID: 'executive_session_org_id',
  SESSION_IS_ADMIN: 'executive_session_is_admin',
  
  // 其他
  THEME: 'theme',
  COLLAB_LAST_SEEN: (orgId: string, username: string) => `executive_collab_last_seen_${orgId}_${username}`,
} as const;

// 应用配置
export const APP_CONFIG = {
  // 项目标识
  PROJECT_NAME: 'TheCoo',
  PROJECT_DISPLAY_NAME: 'The COO',
  
  // 超时配置（毫秒）
  REQUEST_TIMEOUT: 30000,
  
  // 会话过期时间（毫秒）- 默认 24 小时
  SESSION_EXPIRES: 24 * 60 * 60 * 1000,
  
  // 登录页路径
  LOGIN_PATH: '/login',
} as const;

// 导出 LOGIN_PATH 供 request.ts 使用
export const LOGIN_PATH = APP_CONFIG.LOGIN_PATH;

// AI 基座配置
// 开发环境：通过 Vite 代理直接调用（路径与示例一致）
// 生产环境：通过后端代理调用
export const AI_BASE_URL = isDev 
  ? '/v1/chat/completions'  // 开发环境：使用 Vite 代理路径
  : API_PATHS.AI.CHAT_COMPLETIONS; // 生产环境：通过后端代理
export const AI_API_KEY = import.meta.env.VITE_AI_API_KEY || 'xer-7tmbvp94snka4p45sexgdh6wta8z1cmb';
export const AI_MODEL = import.meta.env.VITE_AI_MODEL || 'qwen3-max';

