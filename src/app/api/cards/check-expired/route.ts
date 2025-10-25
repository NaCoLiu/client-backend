import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireAdminAuth } from '@/lib/auth'
import { successResponse, errorResponse, logger } from '@/lib/api-utils'
import { HTTP_STATUS } from '@/lib/constants'

/**
 * 检查并更新过期卡密接口
 * POST /api/cards/check-expired
 */
export const POST = requireAdminAuth(async (): Promise<NextResponse> => {
  try {
    const payload = await getPayload({ config })
    const now = new Date()

    // 查找已过期但状态未更新的卡密
    const expiredCards = await payload.find({
      collection: 'cards',
      where: {
        and: [
          {
            expiredAt: {
              less_than: now.toISOString(),
            },
          },
          {
            status: {
              not_equals: 'expired',
            },
          },
        ],
      },
      limit: 1000,
      depth: 0,
    })

    if (expiredCards.docs.length === 0) {
      logger.info('没有需要更新的过期卡密')
      return successResponse({
        updated: 0,
        message: '没有需要更新的过期卡密',
      })
    }

    // 批量更新过期卡密状态
    const updatePromises = expiredCards.docs.map((card) =>
      payload.update({
        collection: 'cards',
        id: card.id,
        data: {
          status: 'expired',
        },
        depth: 0,
      }),
    )

    await Promise.all(updatePromises)

    logger.success(`成功更新${expiredCards.docs.length}张过期卡密`)

    return successResponse({
      updated: expiredCards.docs.length,
      expiredCards: expiredCards.docs.map((card) => ({
        id: card.id,
        key: card.key,
        expiredAt: card.expiredAt,
      })),
    })
  } catch (error) {
    logger.error('检查过期卡密失败', error)
    return errorResponse('检查过期卡密失败', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
})
