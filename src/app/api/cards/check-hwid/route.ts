import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireAdminAuth } from '@/lib/auth'

export const POST = requireAdminAuth(async (request: NextRequest) => {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const { hwid } = body

    if (!hwid) {
      return NextResponse.json({ error: '请提供硬件ID (HWID)' }, { status: 400 })
    }

    // 验证HWID格式（MD5）
    if (!/^[a-f0-9]{32}$/i.test(hwid)) {
      return NextResponse.json({ error: 'HWID格式错误，必须是32位MD5格式' }, { status: 400 })
    }

    // 查找绑定到此HWID的卡密
    const cards = await payload.find({
      collection: 'cards',
      where: {
        hwid: {
          equals: hwid,
        },
      },
      sort: '-usedAt',
    })

    if (cards.docs.length === 0) {
      return NextResponse.json({
        success: true,
        message: '此设备未绑定任何卡密',
        bound: false,
        cards: [],
      })
    }

    // 检查是否有有效的卡密
    const validCards = cards.docs.filter((card) => {
      if (card.status === 'expired') return false
      if (card.expiredAt && new Date(card.expiredAt) < new Date()) return false
      return true
    })

    return NextResponse.json({
      success: true,
      message: `此设备绑定了${cards.docs.length}张卡密，其中${validCards.length}张有效`,
      bound: true,
      totalCards: cards.docs.length,
      validCards: validCards.length,
      cards: cards.docs.map((card) => ({
        id: card.id,
        key: card.key,
        status: card.status,
        description: card.description,
        usedAt: card.usedAt,
        bindAt: card.bindAt,
        expiredAt: card.expiredAt,
        isValid: validCards.includes(card),
      })),
    })
  } catch (error) {
    console.error('检查HWID绑定失败:', error)
    return NextResponse.json({ error: '检查HWID绑定失败' }, { status: 500 })
  }
})
