import type { CollectionConfig } from 'payload'
import { v4 as uuidv4 } from 'uuid'
import CryptoJS from 'crypto-js'

/**
 * 验证 HWID 格式 (32位 MD5)
 */
const validateHWID = (value: string | string[] | null | undefined): string | true => {
  if (!value) return true
  // 处理数组情况
  if (Array.isArray(value)) {
    return 'HWID不能是数组'
  }
  if (typeof value !== 'string' || !/^[a-f0-9]{32}$/i.test(value)) {
    return 'HWID必须是32位MD5格式'
  }
  return true
}

/**
 * 生成唯一卡密
 */
const generateUniqueKey = (): string => {
  const uuid = uuidv4()
  return CryptoJS.MD5(uuid).toString()
}

/**
 * 计算过期时间 (默认30天后)
 */
const calculateExpiredDate = (days = 30): Date => {
  const expiredDate = new Date()
  expiredDate.setDate(expiredDate.getDate() + days)
  return expiredDate
}

export const Cards: CollectionConfig = {
  slug: 'cards',
  admin: {
    useAsTitle: 'key',
    defaultColumns: ['key', 'status', 'hwid', 'description', 'createdAt', 'usedAt', 'bindAt'],
    listSearchableFields: ['key', 'description', 'hwid'],
  },
  access: {
    // 只有管理员可以通过管理界面访问
    read: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
    create: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
    update: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
    delete: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // 创建新卡密时自动生成key
        if (operation === 'create' && !data.key) {
          data.key = generateUniqueKey()
        }

        // 如果状态改为已使用，设置使用时间和过期时间
        if (data.status === 'used' && operation === 'update') {
          if (!data.usedAt) {
            data.usedAt = new Date().toISOString()
          }
          if (!data.expiredAt) {
            data.expiredAt = calculateExpiredDate().toISOString()
          }
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'key',
      type: 'text',
      label: '卡密代码',
      required: true,
      unique: true,
      index: true, // 添加索引优化查询性能
      admin: {
        readOnly: true,
        description: 'UUID生成后MD5加密的唯一标识符',
      },
    },
    {
      name: 'status',
      type: 'select',
      label: '卡密状态',
      required: true,
      defaultValue: 'unused',
      index: true, // 添加索引优化按状态查询
      options: [
        {
          label: '未使用',
          value: 'unused',
        },
        {
          label: '已使用',
          value: 'used',
        },
        {
          label: '已过期',
          value: 'expired',
        },
      ],
      admin: {
        description: '卡密的当前状态',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: '描述',
      admin: {
        description: '卡密的用途或其他相关信息',
      },
    },
    {
      name: 'usedAt',
      type: 'date',
      label: '使用时间',
      admin: {
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: '卡密的使用时间（如果已使用）',
      },
    },
    {
      name: 'expiredAt',
      type: 'date',
      label: '过期时间',
      index: true, // 添加索引优化过期查询
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: '卡密的过期时间，使用后默认30天过期',
      },
    },
    {
      name: 'hwid',
      type: 'text',
      label: '硬件ID (HWID)',
      index: true, // 添加索引优化 HWID 查询
      admin: {
        readOnly: true,
        description: '绑定的硬件ID，MD5格式，验证时自动绑定',
      },
      validate: validateHWID,
    },
    {
      name: 'bindAt',
      type: 'date',
      label: '绑定时间',
      admin: {
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: '硬件绑定的时间',
      },
    },
    {
      name: 'batchId',
      type: 'text',
      label: '批次ID',
      admin: {
        description: '批量生成时的批次标识',
      },
      index: true, // 已有索引，保持
    },
  ],
  timestamps: true, // 自动添加createdAt和updatedAt字段
}
