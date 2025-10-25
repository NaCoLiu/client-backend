import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { v4 as uuidv4 } from 'uuid'
import CryptoJS from 'crypto-js'
import { requireAdminAuth } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  parseRequestBody,
  validate,
  logger,
  ApiError,
} from '@/lib/api-utils'
import { DEFAULT_CONFIG, HTTP_STATUS } from '@/lib/constants'
import type { BatchCreateCardsParams } from '@/lib/types'

/**
 * 生成唯一卡密
 */
const generateCardKey = (): string => {
  const uuid = uuidv4()
  return CryptoJS.MD5(uuid).toString()
}

/**
 * 批量创建卡密接口
 * POST /api/cards/batch
 */
export const POST = requireAdminAuth(async (request: NextRequest): Promise<NextResponse> => {
  try {
    const payload = await getPayload({ config })
    const body = await parseRequestBody<BatchCreateCardsParams>(request)

    const { count = 1, description = '', expiredAt } = body

    // 验证批量创建数量
    validate.numberRange(count, '生成数量', 1, DEFAULT_CONFIG.MAX_BATCH_SIZE)

    // 生成批次ID
    const batchId = uuidv4()

    logger.info(`开始批量生成${count}张卡密，批次ID: ${batchId}`)

    // 准备卡密数据
    const cardsData = Array.from({ length: count }, () => ({
      key: generateCardKey(),
      status: 'unused' as const,
      description,
      batchId,
      ...(expiredAt && { expiredAt }),
    }))

    // 批量创建卡密 - 使用 Promise.all 并发创建提升性能
    const createdCards = await Promise.all(
      cardsData.map((cardData) =>
        payload.create({
          collection: 'cards',
          data: cardData,
          depth: 0, // 不加载关联数据，提升性能
        }),
      ),
    )

    logger.success(`成功生成${count}张卡密，批次ID: ${batchId}`)

    return successResponse(
      {
        batchId,
        count: createdCards.length,
        cards: createdCards.map((card) => ({
          id: card.id,
          key: card.key,
          status: card.status,
          description: card.description,
          createdAt: card.createdAt,
        })),
      },
      `成功生成${count}张卡密`,
      HTTP_STATUS.CREATED,
    )
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error)
    }
    logger.error('批量生成卡密失败', error)
    return errorResponse('批量生成卡密失败', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
})
