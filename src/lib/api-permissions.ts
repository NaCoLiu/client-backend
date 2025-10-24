// 权限配置测试
// 此文件用于验证API端点的权限配置

/**
 * API端点权限配置总结：
 *
 * 🔓 无需权限（公开访问）：
 * - POST /api/cards/verify - 卡密验证（高流量接口）
 * - POST /api/cards/unbind-hwid - 解绑HWID（使用adminKey验证）
 *
 * 🔒 需要管理员权限：
 * - GET /api/cards - 获取卡密列表
 * - POST /api/cards/batch - 批量生成卡密
 * - POST /api/cards/check-expired - 检查过期卡密
 * - POST /api/cards/check-hwid - 检查HWID绑定
 * - GET /api/cards/export - 导出卡密数据
 *
 * 权限验证方式：
 * - 管理员权限：使用JWT token在Authorization header中
 * - HWID解绑：使用ADMIN_UNBIND_KEY环境变量
 */

export const API_ENDPOINTS = {
  // 公开接口
  PUBLIC: ['/api/cards/verify', '/api/cards/unbind-hwid'],

  // 需要管理员权限的接口
  ADMIN_REQUIRED: [
    '/api/cards',
    '/api/cards/batch',
    '/api/cards/check-expired',
    '/api/cards/check-hwid',
    '/api/cards/export',
  ],
} as const

export const AUTH_HEADERS = {
  // 管理员权限示例
  ADMIN: {
    Authorization: 'Bearer your-jwt-token-here',
    'Content-Type': 'application/json',
  },

  // HWID解绑示例
  UNBIND: {
    'Content-Type': 'application/json',
    // Body应包含: { cardId: 'xxx', adminKey: process.env.ADMIN_UNBIND_KEY }
  },
} as const
