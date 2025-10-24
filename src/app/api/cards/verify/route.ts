import { NextRequest, NextResponse } from 'next/server'
import { getPayload, Payload } from 'payload'
import config from '@payload-config'

// 缓存 Payload 实例以避免重复初始化
let payloadInstance: Payload | null = null

async function getPayloadInstance(): Promise<Payload> {
  if (!payloadInstance) {
    payloadInstance = await getPayload({ config })
  }
  return payloadInstance
}

export async function POST(request: NextRequest) {
  // 获取请求时的时间戳
  const serverTime = Date.now()

  // 设置响应头，优化缓存和性能
  const responseHeaders = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  }

  try {
    const payload = await getPayloadInstance()

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: '无效的请求格式' },
        { status: 400, headers: responseHeaders },
      )
    }

    const { key, hwid } = body

    // 快速参数验证
    if (!key || typeof key !== 'string' || key.length < 8 || key.length > 64) {
      return NextResponse.json(
        { error: '卡密代码格式错误' },
        { status: 400, headers: responseHeaders },
      )
    }

    if (!hwid || typeof hwid !== 'string') {
      return NextResponse.json(
        { error: '请提供硬件ID (HWID)' },
        { status: 400, headers: responseHeaders },
      )
    }

    // 验证HWID格式（MD5）- 使用预编译正则表达式
    const hwidRegex = /^[a-f0-9]{32}$/i
    if (!hwidRegex.test(hwid)) {
      return NextResponse.json(
        { error: 'HWID格式错误，必须是32位MD5格式' },
        { status: 400, headers: responseHeaders },
      )
    }

    // 优化查询：只返回需要的字段，减少数据传输
    const cards = await payload.find({
      collection: 'cards',
      where: {
        key: {
          equals: key,
        },
      },
      limit: 1,
      depth: 0, // 不加载关联数据
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
      return NextResponse.json({ error: '卡密不存在' }, { status: 404, headers: responseHeaders })
    }

    const card = cards.docs[0]
    const currentTime = new Date()

    // 预先检查过期时间，避免不必要的状态更新
    if (card.expiredAt && new Date(card.expiredAt) < currentTime) {
      // 异步更新状态，不等待结果，提升响应速度
      payload
        .update({
          collection: 'cards',
          id: card.id,
          data: { status: 'expired' },
          overrideAccess: true,
        })
        .catch((error: unknown) => {
          console.error('更新过期状态失败:', error)
        })

      return NextResponse.json(
        { error: '卡密已过期', expiredAt: card.expiredAt },
        { status: 400, headers: responseHeaders },
      )
    }

    // 检查卡密状态
    if (card.status === 'used') {
      // 如果已使用，检查是否是同一个HWID
      if (card.hwid && card.hwid !== hwid) {
        return NextResponse.json(
          {
            error: '卡密已被其他设备使用',
            usedAt: card.usedAt,
            bindAt: card.bindAt,
          },
          { status: 400, headers: responseHeaders },
        )
      } else if (card.hwid === hwid) {
        // 同一设备重复验证，返回成功状态
        return NextResponse.json(
          {
            success: true,
            message: '卡密验证成功（已绑定此设备）',
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
          { headers: responseHeaders },
        )
      } else {
        return NextResponse.json(
          { error: '卡密已使用', usedAt: card.usedAt },
          { status: 400, headers: responseHeaders },
        )
      }
    }

    if (card.status === 'expired') {
      return NextResponse.json(
        { error: '卡密已过期', expiredAt: card.expiredAt },
        { status: 400, headers: responseHeaders },
      )
    }

    // 检查是否过期
    if (card.expiredAt && new Date(card.expiredAt) < new Date()) {
      // 更新状态为已过期
      await payload.update({
        collection: 'cards',
        id: card.id,
        data: {
          status: 'expired',
        },
        overrideAccess: true, // 绕过访问控制
      })

      return NextResponse.json({ error: '卡密已过期', expiredAt: card.expiredAt }, { status: 400 })
    }

    // 使用卡密并绑定HWID
    const now = new Date()
    const expiredDate = new Date()
    expiredDate.setDate(expiredDate.getDate() + 30) // 30天后过期

    const nowISO = now.toISOString()
    const expiredISO = expiredDate.toISOString()

    // 异步更新卡密状态，不等待结果
    const updatePromise = payload
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
        overrideAccess: true, // 绕过访问控制
        depth: 0, // 优化性能，不查询关联数据
      })
      .catch((error: unknown) => {
        // 后台记录错误，不影响响应
        console.error('Card update failed:', error)
      })

    // 立即返回响应，不等待数据库更新完成
    return NextResponse.json(
      {
        success: true,
        message: '卡密使用成功，已绑定硬件设备',
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
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      },
    )
  } catch (error) {
    console.error('卡密验证失败:', error)
    return NextResponse.json({ error: '卡密验证失败' }, { status: 500 })
  }
}
