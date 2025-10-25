/**
 * 通用常量定义
 */

/**
 * 卡密状态
 */
export const CARD_STATUS = {
  UNUSED: 'unused',
  USED: 'used',
  EXPIRED: 'expired',
} as const

export type CardStatus = (typeof CARD_STATUS)[keyof typeof CARD_STATUS]

/**
 * 用户角色
 */
export const USER_ROLE = {
  ADMIN: 'admin',
  USER: 'user',
} as const

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE]

/**
 * 默认配置
 */
export const DEFAULT_CONFIG = {
  // 卡密默认有效期（天数）
  CARD_EXPIRY_DAYS: 30,

  // 批量生成卡密的最大数量
  MAX_BATCH_SIZE: 1000,

  // 分页默认参数
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,

  // 文件 MD5 计算最大重试次数
  MD5_MAX_RETRIES: 5,

  // API 请求超时时间（毫秒）
  API_TIMEOUT: 30000,
} as const

/**
 * 正则表达式模式
 */
export const PATTERNS = {
  // MD5 格式 (32位十六进制)
  MD5: /^[a-f0-9]{32}$/i,

  // 语义化版本号
  SEMVER: /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*)?(\+[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*)?$/,

  // UUID v4
  UUID_V4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const

/**
 * HTTP 状态码
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const

/**
 * 错误消息
 */
export const ERROR_MESSAGES = {
  INVALID_REQUEST: '无效的请求格式',
  UNAUTHORIZED: '未授权访问',
  FORBIDDEN: '权限不足',
  NOT_FOUND: '资源不存在',
  CARD_NOT_FOUND: '卡密不存在',
  CARD_ALREADY_USED: '卡密已被使用',
  CARD_EXPIRED: '卡密已过期',
  CARD_BOUND_TO_OTHER_DEVICE: '卡密已被其他设备使用',
  INVALID_HWID: 'HWID格式错误，必须是32位MD5格式',
  INVALID_CARD_KEY: '卡密代码格式错误',
  BATCH_SIZE_EXCEEDED: `批量生成数量不能超过${DEFAULT_CONFIG.MAX_BATCH_SIZE}`,
  OPERATION_FAILED: '操作失败',
} as const

/**
 * 成功消息
 */
export const SUCCESS_MESSAGES = {
  CARD_VERIFIED: '卡密验证成功',
  CARD_CREATED: '卡密创建成功',
  CARD_UPDATED: '卡密更新成功',
  CARD_DELETED: '卡密删除成功',
  HWID_UNBOUND: '成功解绑硬件设备',
  BATCH_CREATED: '批量生成成功',
  EXPIRED_CARDS_UPDATED: '过期卡密状态更新成功',
} as const

/**
 * 集合名称
 */
export const COLLECTIONS = {
  USERS: 'users',
  CARDS: 'cards',
  MEDIA: 'media',
} as const

/**
 * 全局配置
 */
export const GLOBALS = {
  SOFTWARE_VERSION: 'software-version',
} as const
