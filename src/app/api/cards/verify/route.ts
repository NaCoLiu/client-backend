import { NextRequest, NextResponse } from 'next/server'
import { getPayload, Payload } from 'payload'
import config from '@payload-config'
import {
  successResponse,
  errorResponse,
  parseRequestBody,
  validate,
  logger,
  ApiError,
} from '@/lib/api-utils'
import { ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS } from '@/lib/constants'
import type { VerifyCardParams, Card } from '@/lib/types'

// 缓存 Payload 实例以避免重复初始化
let payloadInstance: Payload | null = null

async function getPayloadInstance(): Promise<Payload> {
  if (!payloadInstance) {
    payloadInstance = await getPayload({ config })
  }
  return payloadInstance
}

/**
 * 卡密验证接口
 * POST /api/cards/verify
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const serverTime = Date.now()

  try {
    const payload = await getPayloadInstance()

    // 解析请求体
    const body = await parseRequestBody<VerifyCardParams>(request)
    const { key, hwid } = body

    // 参数验证
    validate.cardKey(key)
    validate.hwid(hwid)

    // 查询卡密 - 优化：只返回必要字段
    const cards = await payload.find({
      collection: 'cards',
      where: { key: { equals: key } },
      limit: 1,
      depth: 0,
      select: {
        id: true,
        key: true,
        status: true,
        description: true,
        usedAt: true,
        expiredAt: true,
        hwid: true,
        bindAt: true,
      },
      overrideAccess: true,
    })

    if (cards.docs.length === 0) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.CARD_NOT_FOUND)
    }

    const card = cards.docs[0] as unknown as Card
    const currentTime = new Date()

    // 检查过期时间
    if (card.expiredAt && new Date(card.expiredAt) < currentTime) {
      // 异步更新状态，不阻塞响应
      payload
        .update({
          collection: 'cards',
          id: card.id,
          data: { status: 'expired' },
          overrideAccess: true,
        })
        .catch((error) => logger.error('更新过期状态失败', error))

      throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.CARD_EXPIRED, {
        expiredAt: card.expiredAt,
      })
    }

    // 检查卡密状态
    if (card.status === 'used') {
      // 检查是否是同一个HWID
      if (card.hwid && card.hwid !== hwid) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.CARD_BOUND_TO_OTHER_DEVICE, {
          usedAt: card.usedAt,
          bindAt: card.bindAt,
        })
      } else if (card.hwid === hwid) {
        // 同一设备重复验证，返回成功
        return successResponse(
          {
            server_time: serverTime,
            card: {
              id: card.id,
              key: card.key,
              status: card.status,
              description: card.description,
              usedAt: card.usedAt,
              expiredAt: card.expiredAt,
              hwid: card.hwid,
              bindAt: card.bindAt,
            },
          },
          '卡密验证成功（已绑定此设备）',
        )
      } else {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.CARD_ALREADY_USED, {
          usedAt: card.usedAt,
        })
      }
    }

    if (card.status === 'expired') {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.CARD_EXPIRED, {
        expiredAt: card.expiredAt,
      })
    }

    // 使用卡密并绑定HWID
    const now = new Date()
    const expiredDate = new Date()
    expiredDate.setDate(expiredDate.getDate() + 30)

    const nowISO = now.toISOString()
    const expiredISO = expiredDate.toISOString()

    // 异步更新卡密状态
    payload
      .update({
        collection: 'cards',
        id: card.id,
        data: {
          status: 'used',
          usedAt: nowISO,
          expiredAt: expiredISO,
          hwid: hwid,
          bindAt: nowISO,
        },
        overrideAccess: true,
        depth: 0,
      })
      .catch((error) => logger.error('卡密状态更新失败', error))

    logger.success(`卡密验证成功 - Key: ${key}, HWID: ${hwid}`)

    // 立即返回响应
    return successResponse(
      {
        server_time: serverTime,
        card: {
          id: card.id,
          key: card.key,
          status: 'used',
          description: card.description,
          usedAt: nowISO,
          expiredAt: expiredISO,
          hwid: hwid,
          bindAt: nowISO,
        },
      },
      SUCCESS_MESSAGES.CARD_VERIFIED,
    )
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error)
    }
    logger.error('卡密验证失败', error)
    return errorResponse('卡密验证失败', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
