import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const { cardId, adminKey } = body

    if (!cardId) {
      return NextResponse.json({ error: '请提供卡密ID' }, { status: 400 })
    }

    // 简单的管理员验证（实际项目中应该使用JWT或其他认证方式）
    if (adminKey !== process.env.ADMIN_UNBIND_KEY) {
      return NextResponse.json({ error: '无权限执行此操作' }, { status: 403 })
    }

    // 查找卡密
    const card = await payload.findByID({
      collection: 'cards',
      id: cardId,
    })

    if (!card.hwid) {
      return NextResponse.json({ error: '此卡密未绑定任何设备' }, { status: 400 })
    }

    // 解绑HWID（重置为未使用状态）
    const updatedCard = await payload.update({
      collection: 'cards',
      id: cardId,
      data: {
        status: 'unused',
        hwid: null,
        usedAt: null,
        bindAt: null,
        expiredAt: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: '成功解绑硬件设备',
      card: {
        id: updatedCard.id,
        key: updatedCard.key,
        status: updatedCard.status,
        description: updatedCard.description,
      },
    })
  } catch (error) {
    console.error('解绑HWID失败:', error)
    return NextResponse.json({ error: '解绑HWID失败' }, { status: 500 })
  }
}
