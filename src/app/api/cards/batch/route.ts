import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { v4 as uuidv4 } from 'uuid'
import CryptoJS from 'crypto-js'
import { requireAdminAuth } from '@/lib/auth'

export const POST = requireAdminAuth(async (request: NextRequest) => {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const { count = 1, description = '', expiredAt } = body

    if (!count || count <= 0 || count > 1000) {
      return NextResponse.json({ error: '批量生成数量必须在1-1000之间' }, { status: 400 })
    }

    // 生成批次ID
    const batchId = uuidv4()

    const cards = []
    for (let i = 0; i < count; i++) {
      const uuid = uuidv4()
      const key = CryptoJS.MD5(uuid).toString()

      const cardData = {
        key,
        status: 'unused',
        description,
        batchId,
        ...(expiredAt && { expiredAt }),
      }

      cards.push(cardData)
    }

    // 批量创建卡密
    const createdCards = await Promise.all(
      cards.map((cardData) =>
        payload.create({
          collection: 'cards',
          data: cardData,
        }),
      ),
    )

    return NextResponse.json({
      success: true,
      message: `成功生成${count}张卡密`,
      batchId,
      cards: createdCards.map((card) => ({
        id: card.id,
        key: card.key,
        status: card.status,
        description: card.description,
        createdAt: card.createdAt,
      })),
    })
  } catch (error) {
    console.error('批量生成卡密失败:', error)
    return NextResponse.json({ error: '批量生成卡密失败' }, { status: 500 })
  }
})
