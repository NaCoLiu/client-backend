import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    // Email added by default
    {
      name: 'role',
      type: 'select',
      label: '角色',
      required: true,
      defaultValue: 'user',
      options: [
        {
          label: '管理员',
          value: 'admin',
        },
        {
          label: '普通用户',
          value: 'user',
        },
      ],
      admin: {
        description: '用户角色，管理员可以管理卡密',
      },
    },
  ],
}
