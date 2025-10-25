import { NextResponse } from 'next/server'

/**
 * API 响应类型
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  [key: string]: unknown
}

/**
 * API 错误类型
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * 标准响应头配置
 */
export const RESPONSE_HEADERS = {
  NO_CACHE: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  },
  SECURITY: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  },
} as const

/**
 * 创建成功响应
 */
export function successResponse<T>(
  data: T,
  message?: string,
  statusCode = 200,
  additionalHeaders?: HeadersInit,
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  }

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      ...RESPONSE_HEADERS.NO_CACHE,
      ...RESPONSE_HEADERS.SECURITY,
      ...additionalHeaders,
    },
  })
}

/**
 * 创建错误响应
 */
export function errorResponse(
  error: string | Error | ApiError,
  statusCode = 500,
  additionalData?: Record<string, unknown>,
): NextResponse {
  let message: string
  let code = statusCode
  let details: unknown

  if (error instanceof ApiError) {
    message = error.message
    code = error.statusCode
    details = error.details
  } else if (error instanceof Error) {
    message = error.message
  } else {
    message = error
  }

  const response: ApiResponse = {
    success: false,
    error: message,
    ...additionalData,
  }

  if (details !== undefined) {
    response.details = details
  }

  return NextResponse.json(response, {
    status: code,
    headers: {
      ...RESPONSE_HEADERS.NO_CACHE,
      ...RESPONSE_HEADERS.SECURITY,
    },
  })
}

/**
 * 异步错误处理包装器
 */
export function asyncHandler<T>(handler: () => Promise<T>, errorMessage = '操作失败'): Promise<T> {
  return handler().catch((error: unknown) => {
    console.error(`${errorMessage}:`, error)
    throw error instanceof ApiError ? error : new ApiError(500, errorMessage, error)
  })
}

/**
 * 输入验证辅助函数
 */
export const validate = {
  /**
   * 验证必需字段
   */
  required: (value: unknown, fieldName: string): void => {
    if (value === null || value === undefined || value === '') {
      throw new ApiError(400, `${fieldName}是必需的`)
    }
  },

  /**
   * 验证字符串长度
   */
  stringLength: (value: string, fieldName: string, min?: number, max?: number): void => {
    if (typeof value !== 'string') {
      throw new ApiError(400, `${fieldName}必须是字符串`)
    }
    if (min !== undefined && value.length < min) {
      throw new ApiError(400, `${fieldName}长度不能小于${min}`)
    }
    if (max !== undefined && value.length > max) {
      throw new ApiError(400, `${fieldName}长度不能大于${max}`)
    }
  },

  /**
   * 验证数字范围
   */
  numberRange: (value: number, fieldName: string, min?: number, max?: number): void => {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ApiError(400, `${fieldName}必须是有效数字`)
    }
    if (min !== undefined && value < min) {
      throw new ApiError(400, `${fieldName}不能小于${min}`)
    }
    if (max !== undefined && value > max) {
      throw new ApiError(400, `${fieldName}不能大于${max}`)
    }
  },

  /**
   * 验证正则表达式
   */
  pattern: (value: string, fieldName: string, pattern: RegExp): void => {
    if (typeof value !== 'string' || !pattern.test(value)) {
      throw new ApiError(400, `${fieldName}格式错误`)
    }
  },

  /**
   * 验证 HWID (32位 MD5)
   */
  hwid: (value: string): void => {
    validate.required(value, 'HWID')
    validate.pattern(value, 'HWID', /^[a-f0-9]{32}$/i)
  },

  /**
   * 验证卡密格式
   */
  cardKey: (value: string): void => {
    validate.required(value, '卡密代码')
    validate.stringLength(value, '卡密代码', 8, 64)
  },
}

/**
 * 日志工具
 */
export const logger = {
  info: (message: string, data?: unknown): void => {
    console.log(`ℹ [INFO] ${message}`, data ? data : '')
  },

  error: (message: string, error?: unknown): void => {
    console.error(`✗ [ERROR] ${message}`, error ? error : '')
  },

  warn: (message: string, data?: unknown): void => {
    console.warn(`⚠ [WARN] ${message}`, data ? data : '')
  },

  success: (message: string, data?: unknown): void => {
    console.log(`✓ [SUCCESS] ${message}`, data ? data : '')
  },
}

/**
 * 解析请求 JSON 主体
 */
export async function parseRequestBody<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return await request.json()
  } catch {
    throw new ApiError(400, '无效的请求格式')
  }
}
