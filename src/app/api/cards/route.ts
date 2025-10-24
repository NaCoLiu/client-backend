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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // 构建查询条件
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
    })

    return NextResponse.json(
      {
        success: true,
        data: cards.docs,
        pagination: {
          page: cards.page,
          limit: cards.limit,
          totalPages: cards.totalPages,
          totalDocs: cards.totalDocs,
          hasNextPage: cards.hasNextPage,
          hasPrevPage: cards.hasPrevPage,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
    )
  } catch (error) {
    console.error('获取卡密列表失败:', error)
    return NextResponse.json({ error: '获取卡密列表失败' }, { status: 500 })
  }
})
