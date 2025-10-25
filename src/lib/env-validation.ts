/**
 * 环境变量验证模块
 * 确保所有必需的环境变量都已正确配置
 */

interface EnvironmentConfig {
  PAYLOAD_SECRET: string
  DATABASE_URI: string
  ADMIN_UNBIND_KEY?: string
  NODE_ENV: 'development' | 'production' | 'test'
}

/**
 * 验证必需的环境变量
 */
function validateRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`环境变量 ${key} 未设置，请检查 .env 文件`)
  }
  return value
}

/**
 * 验证可选的环境变量
 */
function validateOptionalEnv(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue
}

/**
 * 验证所有环境变量
 */
export function validateEnvironment(): EnvironmentConfig {
  const config: EnvironmentConfig = {
    PAYLOAD_SECRET: validateRequiredEnv('PAYLOAD_SECRET'),
    DATABASE_URI: validateRequiredEnv('DATABASE_URI'),
    ADMIN_UNBIND_KEY: validateOptionalEnv('ADMIN_UNBIND_KEY'),
    NODE_ENV: validateOptionalEnv('NODE_ENV', 'development') as EnvironmentConfig['NODE_ENV'],
  }

  // 验证 PAYLOAD_SECRET 长度
  if (config.PAYLOAD_SECRET.length < 32) {
    throw new Error('PAYLOAD_SECRET 必须至少包含 32 个字符')
  }

  // 验证 DATABASE_URI 格式
  if (!config.DATABASE_URI.startsWith('file:') && !config.DATABASE_URI.startsWith('sqlite:')) {
    console.warn('⚠ DATABASE_URI 格式可能不正确，应以 file: 或 sqlite: 开头')
  }

  // 验证 NODE_ENV
  if (!['development', 'production', 'test'].includes(config.NODE_ENV)) {
    throw new Error('NODE_ENV 必须是 development、production 或 test 之一')
  }

  console.log('✓ 环境变量验证通过')
  console.log(`  - NODE_ENV: ${config.NODE_ENV}`)
  console.log(`  - DATABASE_URI: ${config.DATABASE_URI}`)
  console.log(`  - PAYLOAD_SECRET: [已设置]`)
  if (config.ADMIN_UNBIND_KEY) {
    console.log(`  - ADMIN_UNBIND_KEY: [已设置]`)
  }

  return config
}

/**
 * 获取环境配置
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  return {
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET || '',
    DATABASE_URI: process.env.DATABASE_URI || '',
    ADMIN_UNBIND_KEY: process.env.ADMIN_UNBIND_KEY,
    NODE_ENV: (process.env.NODE_ENV as EnvironmentConfig['NODE_ENV']) || 'development',
  }
}

/**
 * 检查是否为生产环境
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * 检查是否为开发环境
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * 检查是否为测试环境
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test'
}
