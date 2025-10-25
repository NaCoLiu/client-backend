import type { GlobalConfig } from 'payload'

export const SoftwareVersion: GlobalConfig = {
  slug: 'software-version',
  label: '软件版本设置',
  access: {
    // 允许所有人读取
    read: () => {
      return true
    },
    update: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
  },
  hooks: {
    beforeChange: [
      async ({ data }) => {
        // 验证版本号格式 (语义化版本 x.y.z)
        if (data.version) {
          const semverRegex =
            /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*)?(\+[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*)?$/
          if (!semverRegex.test(data.version)) {
            throw new Error('版本号必须遵循语义化版本规范 (例如: 1.0.0, 1.0.0-beta.1)')
          }
        }

        // 自动设置更新时间
        data.updatedAt = new Date().toISOString()

        return data
      },
    ],
    afterChange: [
      async ({ doc }) => {
        console.log(`软件版本 ${doc.version} 配置已更新`)
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'version',
      type: 'text',
      label: '当前软件版本号',
      required: true,
      admin: {
        description: '请使用语义化版本格式，例如: 1.0.0, 1.2.3-beta.1',
        placeholder: '1.0.0',
      },
    },
    {
      name: 'appStatus',
      type: 'checkbox',
      label: '应用状态',
      defaultValue: true,
      admin: {
        description: '应用是否可用 (启用/禁用)',
      },
    },
    {
      name: 'softwarePackage',
      type: 'upload',
      label: '软件包文件',
      relationTo: 'media',
      required: false,
      admin: {
        description: '上传软件安装包文件 (支持 .exe, .msi, .dmg, .pkg, .deb, .rpm, .zip 等格式)',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: '版本描述',
      admin: {
        description: '描述此版本的主要功能和变更',
        rows: 4,
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: '发布时间',
      defaultValue: () => new Date(),
      admin: {
        description: '版本发布时间',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'updatedAt',
      type: 'date',
      label: '最后更新时间',
      admin: {
        description: '配置最后更新时间',
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
}
