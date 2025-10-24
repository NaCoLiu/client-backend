import { NextRequest, NextResponse } from 'next/server'
import { getPayload, Payload } from 'payload'
import config from '@payload-config'

export interface AuthResult {
  success: boolean
  user?: Record<string, unknown>
  error?: NextResponse
}

/**
 * 验证管理员权限
 * 检查请求头中的Authorization token
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: NextResponse.json({ error: '未提供认证token' }, { status: 401 }),
      }
    }

    const token = authHeader.substring(7) // 移除 "Bearer " 前缀

    if (!token) {
      return {
        success: false,
        error: NextResponse.json({ error: '认证token无效' }, { status: 401 }),
      }
    }

    const payload = await getPayload({ config })

    // 验证JWT token
    const { user } = await payload.auth({
      headers: request.headers,
    })

    if (!user) {
      return {
        success: false,
        error: NextResponse.json({ error: '认证失败' }, { status: 401 }),
      }
    }

    // 检查用户角色
    if ((user as unknown as Record<string, unknown>).role !== 'admin') {
      return {
        success: false,
        error: NextResponse.json({ error: '权限不足，需要管理员权限' }, { status: 403 }),
      }
    }

    return {
      success: true,
      user: user as unknown as Record<string, unknown>,
    }
  } catch (error) {
    console.error('权限验证失败:', error)
    return {
      success: false,
      error: NextResponse.json({ error: '权限验证失败' }, { status: 500 }),
    }
  }
}

/**
 * 权限验证装饰器
 * 用于包装需要管理员权限的API处理函数
 */
export function requireAdminAuth(
  handler: (request: NextRequest, authResult: AuthResult) => Promise<NextResponse>,
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await verifyAdminAuth(request)

    if (!authResult.success && authResult.error) {
      return authResult.error
    }

    return handler(request, authResult)
  }
}
