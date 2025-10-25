/**
 * 通用类型定义
 */

/**
 * 卡密数据类型
 */
export interface Card {
  id: string
  key: string
  status: 'unused' | 'used' | 'expired'
  description?: string
  usedAt?: string
  expiredAt?: string
  hwid?: string
  bindAt?: string
  batchId?: string
  createdAt: string
  updatedAt: string
}

/**
 * 用户数据类型
 */
export interface User {
  id: string
  email: string
  role: 'admin' | 'user'
  createdAt: string
  updatedAt: string
}

/**
 * 软件版本配置类型
 */
export interface SoftwareVersion {
  version: string
  appStatus: boolean
  softwarePackage?: string | { id: string; url: string }
  description?: string
  publishedAt?: string
  updatedAt?: string
}

/**
 * 分页参数类型
 */
export interface PaginationParams {
  page?: number
  limit?: number
}

/**
 * 分页响应类型
 */
export interface PaginationResponse {
  page: number
  limit: number
  totalPages: number
  totalDocs: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

/**
 * 卡密查询参数类型
 */
export interface CardQueryParams extends PaginationParams {
  status?: 'unused' | 'used' | 'expired'
  batchId?: string
}

/**
 * 批量创建卡密参数类型
 */
export interface BatchCreateCardsParams {
  count: number
  description?: string
  expiredAt?: string
}

/**
 * 卡密验证参数类型
 */
export interface VerifyCardParams {
  key: string
  hwid: string
}

/**
 * HWID 检查参数类型
 */
export interface CheckHwidParams {
  hwid: string
}

/**
 * 解绑 HWID 参数类型
 */
export interface UnbindHwidParams {
  cardId: string
  adminKey: string
}

/**
 * Payload 查询结果类型
 */
export interface PayloadFindResult<T> {
  docs: T[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

/**
 * 环境变量类型
 */
export interface EnvironmentVariables {
  PAYLOAD_SECRET: string
  DATABASE_URI: string
  ADMIN_UNBIND_KEY?: string
  NODE_ENV?: 'development' | 'production' | 'test'
}
