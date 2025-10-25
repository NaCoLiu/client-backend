import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireAdminAuth } from '@/lib/auth'
import { successResponse, errorResponse, logger } from '@/lib/api-utils'
import { DEFAULT_CONFIG, HTTP_STATUS } from '@/lib/constants'

/**
 * 获取卡密列表接口
 * GET /api/cards
 */
export const GET = requireAdminAuth(async (request: NextRequest): Promise<NextResponse> => {
  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)

    // 解析查询参数
    const status = searchParams.get('status')
    const batchId = searchParams.get('batchId')
    const page = parseInt(searchParams.get('page') || String(DEFAULT_CONFIG.DEFAULT_PAGE))
    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(DEFAULT_CONFIG.DEFAULT_LIMIT)),
      DEFAULT_CONFIG.MAX_LIMIT,
    )

    // 构建查询条件
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (status) {
      where.status = { equals: status }
    }
    if (batchId) {
      where.batchId = { equals: batchId }
    }

    // 获取卡密列表
    const cards = await payload.find({
      collection: 'cards',
      where,
      page,
      limit,
      sort: '-createdAt',
      depth: 0, // 不加载关联数据
    })

    logger.info(`查询卡密列表 - 页码: ${page}, 限制: ${limit}, 状态: ${status || '全部'}`)

    return successResponse({
      cards: cards.docs,
      pagination: {
        page: cards.page,
        limit: cards.limit,
        totalPages: cards.totalPages,
        totalDocs: cards.totalDocs,
        hasNextPage: cards.hasNextPage,
        hasPrevPage: cards.hasPrevPage,
      },
    })
  } catch (error) {
    logger.error('获取卡密列表失败', error)
    return errorResponse('获取卡密列表失败', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
})
