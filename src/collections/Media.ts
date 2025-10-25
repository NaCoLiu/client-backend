import type { CollectionConfig } from 'payload'
import crypto from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * 计算文件的 MD5 哈希值
 * @param filePath - 文件完整路径
 * @param maxRetries - 最大重试次数
 * @returns MD5 哈希值或 null
 */
async function calculateFileMD5(filePath: string, maxRetries = 3): Promise<string | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 检查文件是否存在
      await fs.access(filePath)

      // 使用流式读取优化大文件处理
      const fileBuffer = await fs.readFile(filePath)
      const hash = crypto.createHash('md5')
      hash.update(fileBuffer)
      return hash.digest('hex')
    } catch (error) {
      if (attempt < maxRetries) {
        // 使用指数退避策略
        await new Promise((resolve) => setTimeout(resolve, 50 * Math.pow(2, attempt)))
        continue
      }
      console.error(`计算文件 MD5 失败 (${filePath}):`, error)
      return null
    }
  }
  return null
}

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
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
      async ({ data, operation }) => {
        // 在创建时，如果是文件上传，计算 MD5
        if (operation === 'create' && data.filename) {
          const filePath = path.join(process.cwd(), 'media', data.filename)
          const md5Hash = await calculateFileMD5(filePath)

          if (md5Hash) {
            console.log(`✓ 文件 MD5 计算完成 - ${data.filename}: ${md5Hash}`)
            data.md5Hash = md5Hash
          } else {
            console.warn(`⚠ 文件 MD5 计算失败 - ${data.filename}，将在 afterChange 中重试`)
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        // 如果 beforeChange 中没有成功计算 MD5，在 afterChange 中重试
        if (operation === 'create' && doc.filename && !doc.md5Hash) {
          const filePath = path.join(process.cwd(), 'media', doc.filename)
          const md5Hash = await calculateFileMD5(filePath, 5) // 增加重试次数

          if (md5Hash) {
            console.log(`✓ 补充计算文件 MD5 - ${doc.filename}: ${md5Hash}`)

            // 异步更新数据库记录，不阻塞响应
            req.payload
              .update({
                collection: 'media',
                id: doc.id,
                data: {
                  md5Hash: md5Hash,
                } as Record<string, unknown>,
                overrideAccess: true,
              })
              .catch((error: unknown) => {
                console.error(`✗ 更新 MD5 失败 (${doc.filename}):`, error)
              })
          } else {
            console.error(`✗ 无法计算文件 MD5 - ${doc.filename}`)
          }
        }

        return doc
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: '替代文字',
      required: false,
      admin: {
        description: '文件的描述文字',
      },
    },
    {
      name: 'md5Hash',
      type: 'text',
      label: 'MD5校验值',
      admin: {
        description: '自动计算的MD5校验值',
        readOnly: true,
      },
    },
  ],
  upload: {
    staticDir: 'media',
    adminThumbnail: 'thumbnail',
    allowRestrictedFileTypes: true,
    mimeTypes: [
      'image/*',
      'application/octet-stream',
      'application/x-msdownload',
      'application/x-msdos-program',
      'application/x-executable',
      'application/x-winexe',
      'application/vnd.microsoft.portable-executable',
      'application/x-apple-diskimage',
      'application/vnd.apple.installer+xml',
      'application/vnd.debian.binary-package',
      'application/x-rpm',
      'application/zip',
      'application/x-tar',
      'application/gzip',
      'application/x-7z-compressed',
      'application/vnd.rar',
      'application/pdf',
      'text/*',
    ],
  },
}
