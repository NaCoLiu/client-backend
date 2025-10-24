import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireAdminAuth } from '@/lib/auth'

export const GET = requireAdminAuth(async (request: NextRequest) => {
  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const batchId = searchParams.get('batchId')
    const format = searchParams.get('format') || 'csv'

    // 构建查询条件
    const where: any = {}
    if (status) {
      where.status = { equals: status }
    }
    if (batchId) {
      where.batchId = { equals: batchId }
    }

    // 获取卡密数据
    const cards = await payload.find({
      collection: 'cards',
      where,
      limit: 10000, // 限制导出数量
      sort: '-createdAt',
    })

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: cards.docs,
        total: cards.totalDocs,
      })
    }

    // 生成CSV格式
    const csvHeaders = [
      '卡密代码',
      '状态',
      '描述',
      '硬件ID',
      '创建时间',
      '使用时间',
      '绑定时间',
      '过期时间',
      '批次ID',
    ]

    const csvRows = cards.docs.map((card) => [
      card.key,
      card.status === 'unused' ? '未使用' : card.status === 'used' ? '已使用' : '已过期',
      card.description || '',
      card.hwid || '',
      new Date(card.createdAt).toLocaleString('zh-CN'),
      card.usedAt ? new Date(card.usedAt).toLocaleString('zh-CN') : '',
      card.bindAt ? new Date(card.bindAt).toLocaleString('zh-CN') : '',
      card.expiredAt ? new Date(card.expiredAt).toLocaleString('zh-CN') : '',
      card.batchId || '',
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    // 添加BOM以支持中文显示
    const bom = '\uFEFF'
    const csvWithBom = bom + csvContent

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="cards_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('导出卡密失败:', error)
    return NextResponse.json({ error: '导出卡密失败' }, { status: 500 })
  }
})
