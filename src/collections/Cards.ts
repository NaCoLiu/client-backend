import type { CollectionConfig } from 'payload'
import { v4 as uuidv4 } from 'uuid'
import CryptoJS from 'crypto-js'

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
          const uuid = uuidv4()
          data.key = CryptoJS.MD5(uuid).toString()
        }

        // 如果状态改为已使用，设置使用时间和过期时间
        if (data.status === 'used' && operation === 'update') {
          if (!data.usedAt) {
            data.usedAt = new Date().toISOString()
          }
          if (!data.expiredAt) {
            // 使用后30天过期
            const expiredDate = new Date()
            expiredDate.setDate(expiredDate.getDate() + 30)
            data.expiredAt = expiredDate.toISOString()
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
      admin: {
        readOnly: true,
        description: '绑定的硬件ID，MD5格式，验证时自动绑定',
      },
      validate: (value: string | null | undefined) => {
        if (value && typeof value === 'string' && !/^[a-f0-9]{32}$/i.test(value)) {
          return 'HWID必须是32位MD5格式'
        }
        return true
      },
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
      index: true,
    },
  ],
  timestamps: true, // 自动添加createdAt和updatedAt字段
}
