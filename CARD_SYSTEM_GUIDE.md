# 卡密管理系统使用说明

## 系统概述

本系统基于PayloadCMS开发，实现了完整的卡密管理功能，包括卡密的创建、验证、过期处理和导出等功能。

## 功能特性

### 1. 卡密字段
- **卡密代码(key)**: UUID生成后MD5加密的唯一标识符
- **卡密状态(status)**: 未使用/已使用/已过期
- **硬件ID(hwid)**: MD5格式的硬件设备标识符，用于设备绑定
- **创建时间(createdAt)**: 自动记录
- **使用时间(usedAt)**: 验证使用时自动记录
- **绑定时间(bindAt)**: 硬件绑定时自动记录
- **过期时间(expiredAt)**: 使用后30天自动设置
- **描述(description)**: 卡密用途说明
- **批次ID(batchId)**: 批量生成时的批次标识

### 2. HWID绑定机制
- **一卡一机**: 每张卡密只能绑定一个硬件设备
- **防重复使用**: 已绑定的卡密不能在其他设备上使用
- **设备验证**: 相同设备可以重复验证已绑定的卡密
- **格式要求**: HWID必须是32位MD5格式

### 2. 管理功能
- 批量生成卡密
- 查看和筛选卡密列表
- 卡密验证和使用
- 自动过期处理
- 导出卡密数据

## 访问地址

- **管理后台**: http://localhost:3000/admin
- **卡密验证页面**: http://localhost:3000/card-verify

## API接口

### 1. 批量生成卡密
```http
POST /api/cards/batch
Content-Type: application/json

{
  "count": 10,
  "description": "测试卡密",
  "expiredAt": "2025-12-31T23:59:59.000Z"
}
```

### 2. 验证卡密（带HWID绑定）
```http
POST /api/cards/verify
Content-Type: application/json

{
  "key": "卡密代码",
  "hwid": "a1b2c3d4e5f6789012345678901234ab"
}
```

### 3. 检查HWID绑定状态
```http
POST /api/cards/check-hwid
Content-Type: application/json

{
  "hwid": "a1b2c3d4e5f6789012345678901234ab"
}
```

### 4. 解绑HWID（管理员功能）
```http
POST /api/cards/unbind-hwid
Content-Type: application/json

{
  "cardId": "卡密ID",
  "adminKey": "管理员密钥"
}
```

### 5. 获取卡密列表
```http
GET /api/cards?status=unused&page=1&limit=10
```

### 6. 导出卡密
```http
GET /api/cards/export?format=csv&status=unused
```

### 7. 检查过期卡密
```http
POST /api/cards/check-expired
```

## 使用步骤

### 1. 首次设置
1. 访问管理后台: http://localhost:3000/admin
2. 创建管理员账户
3. 登录后台管理系统

### 2. 批量生成卡密
```bash
# 使用curl命令生成10张卡密
curl -X POST http://localhost:3000/api/cards/batch \
  -H "Content-Type: application/json" \
  -d '{"count": 10, "description": "测试卡密"}'
```

### 3. 在管理后台查看卡密
1. 登录管理后台
2. 点击左侧菜单"Cards"
3. 查看生成的卡密列表

### 4. 验证卡密（带HWID绑定）
1. 访问验证页面: http://localhost:3000/card-verify
2. 输入卡密代码和32位MD5格式的HWID
3. 查看验证结果和绑定信息

### 5. 检查设备绑定状态
```bash
# 检查某个HWID绑定了哪些卡密
curl -X POST http://localhost:3000/api/cards/check-hwid \
  -H "Content-Type: application/json" \
  -d '{"hwid": "a1b2c3d4e5f6789012345678901234ab"}'
```

### 6. 导出卡密数据
```bash
# 导出包含HWID信息的卡密为CSV文件
curl "http://localhost:3000/api/cards/export?status=unused&format=csv" -o cards.csv
```

### 7. 管理员解绑HWID
```bash
# 解绑指定卡密的硬件绑定（需要管理员密钥）
curl -X POST http://localhost:3000/api/cards/unbind-hwid \
  -H "Content-Type: application/json" \
  -d '{"cardId": "卡密ID", "adminKey": "管理员密钥"}'
```

## 定时任务设置

建议设置定时任务定期检查过期卡密：

```bash
# 每天执行一次检查过期卡密
curl -X POST http://localhost:3000/api/cards/check-expired
```

## 安全考虑

1. **访问控制**: 卡密管理功能仅限管理员访问
2. **唯一性**: 卡密代码通过UUID+MD5确保唯一性
3. **设备绑定**: HWID绑定机制防止卡密在多设备间滥用
4. **状态管理**: 自动防止重复使用和过期卡密验证
5. **格式验证**: HWID必须符合32位MD5格式要求
6. **数据完整性**: 所有操作都有完整的日志记录

## 扩展功能

系统支持以下扩展：
- 自定义过期时间
- 卡密分类管理
- HWID设备管理和监控
- 使用统计报表
- 批量操作日志
- 邮件通知功能
- 设备绑定历史记录

## 故障排除

### 常见问题
1. **数据库索引冲突**: 删除数据库文件重新启动
2. **卡密验证失败**: 检查卡密状态和过期时间
3. **批量生成失败**: 检查数量限制(1-1000张)

### 日志查看
- 服务器日志在终端输出
- 数据库操作日志在PayloadCMS后台
- API错误信息通过响应返回

## 开发环境

- Node.js 18+
- PayloadCMS 3.61.0
- SQLite数据库
- TypeScript支持

## 部署建议

1. 使用环境变量配置数据库连接
2. 设置HTTPS证书保护管理后台
3. 配置定时任务自动检查过期卡密
4. 定期备份数据库文件