import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireAdminAuth } from '@/lib/auth'

export const POST = requireAdminAuth(async (request: NextRequest) => {
  try {
    const payload = await getPayload({ config })

    // 查找已过期但状态未更新的卡密
    const now = new Date()
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
    })

    if (expiredCards.docs.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有需要更新的过期卡密',
        updated: 0,
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
      }),
    )

    await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      message: `成功更新${expiredCards.docs.length}张过期卡密`,
      updated: expiredCards.docs.length,
      expiredCards: expiredCards.docs.map((card) => ({
        id: card.id,
        key: card.key,
        expiredAt: card.expiredAt,
      })),
    })
  } catch (error) {
    console.error('检查过期卡密失败:', error)
    return NextResponse.json({ error: '检查过期卡密失败' }, { status: 500 })
  }
})
