// 卡密系统测试脚本
// 运行方式: node test-cards.js

const API_BASE = 'http://localhost:3000/api'

// 测试批量生成卡密
async function testBatchGenerate() {
  console.log('🧪 测试批量生成卡密...')

  try {
    const response = await fetch(`${API_BASE}/cards/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        count: 5,
        description: '测试卡密批次',
      }),
    })

    const result = await response.json()

    if (response.ok) {
      console.log('✅ 批量生成成功:', result.message)
      console.log('📦 批次ID:', result.batchId)
      console.log('🎯 生成的卡密:')
      result.cards.forEach((card, index) => {
        console.log(`   ${index + 1}. ${card.key}`)
      })
      return result.cards[0].key // 返回第一张卡密用于后续测试
    } else {
      console.error('❌ 批量生成失败:', result.error)
      return null
    }
  } catch (error) {
    console.error('❌ 网络错误:', error.message)
    return null
  }
}

// 测试卡密验证
async function testVerifyCard(cardKey) {
  console.log('\n🧪 测试卡密验证（带HWID绑定）...')

  if (!cardKey) {
    console.log('⚠️  没有卡密可供测试')
    return
  }

  // 生成测试HWID（模拟MD5）
  const testHwid = 'a1b2c3d4e5f6789012345678901234ab'

  try {
    const response = await fetch(`${API_BASE}/cards/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: cardKey,
        hwid: testHwid,
      }),
    })

    const result = await response.json()

    if (response.ok) {
      console.log('✅ 卡密验证成功:', result.message)
      console.log('🎯 卡密信息:')
      console.log(`   代码: ${result.card.key}`)
      console.log(`   描述: ${result.card.description || '无'}`)
      console.log(`   绑定硬件: ${result.card.hwid}`)
      console.log(`   使用时间: ${new Date(result.card.usedAt).toLocaleString('zh-CN')}`)
      console.log(`   绑定时间: ${new Date(result.card.bindAt).toLocaleString('zh-CN')}`)
      console.log(`   过期时间: ${new Date(result.card.expiredAt).toLocaleString('zh-CN')}`)
      return testHwid // 返回HWID用于后续测试
    } else {
      console.error('❌ 卡密验证失败:', result.error)
      return null
    }
  } catch (error) {
    console.error('❌ 网络错误:', error.message)
    return null
  }
}

// 测试重复验证（应该失败）
async function testDuplicateVerify(cardKey, hwid) {
  console.log('\n🧪 测试重复验证（相同设备，应该成功）...')

  if (!cardKey || !hwid) {
    console.log('⚠️  没有卡密或HWID可供测试')
    return
  }

  try {
    const response = await fetch(`${API_BASE}/cards/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: cardKey,
        hwid: hwid,
      }),
    })

    const result = await response.json()

    if (response.ok && result.message.includes('已绑定此设备')) {
      console.log('✅ 相同设备重复验证成功:', result.message)
    } else if (!response.ok && result.error.includes('其他设备')) {
      console.log('✅ 不同设备验证正确被拒绝:', result.error)
    } else {
      console.error('❌ 重复验证结果异常:', result)
    }
  } catch (error) {
    console.error('❌ 网络错误:', error.message)
  }
}

// 测试获取卡密列表
async function testGetCards() {
  console.log('\n🧪 测试获取卡密列表...')

  try {
    const response = await fetch(`${API_BASE}/cards?limit=5`)
    const result = await response.json()

    if (response.ok) {
      console.log('✅ 获取卡密列表成功')
      console.log('📊 统计信息:')
      console.log(`   总数: ${result.pagination.totalDocs}`)
      console.log(`   当前页: ${result.pagination.page}/${result.pagination.totalPages}`)
      console.log('🎯 卡密列表:')
      result.data.forEach((card, index) => {
        console.log(
          `   ${index + 1}. ${card.key} - ${card.status} - ${card.description || '无描述'}`,
        )
      })
    } else {
      console.error('❌ 获取卡密列表失败:', result.error)
    }
  } catch (error) {
    console.error('❌ 网络错误:', error.message)
  }
}

// 测试不同设备验证（应该失败）
async function testDifferentDeviceVerify(cardKey) {
  console.log('\n🧪 测试不同设备验证（应该失败）...')

  if (!cardKey) {
    console.log('⚠️  没有卡密可供测试')
    return
  }

  // 生成不同的测试HWID
  const differentHwid = 'ffffffffffffffffffffffffffffffff'

  try {
    const response = await fetch(`${API_BASE}/cards/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: cardKey,
        hwid: differentHwid,
      }),
    })

    const result = await response.json()

    if (!response.ok && result.error.includes('其他设备')) {
      console.log('✅ 不同设备验证正确被拒绝:', result.error)
    } else {
      console.error('❌ 不同设备验证应该失败但成功了')
    }
  } catch (error) {
    console.error('❌ 网络错误:', error.message)
  }
}

// 测试HWID检查功能
async function testCheckHwid(hwid) {
  console.log('\n🧪 测试HWID绑定检查...')

  if (!hwid) {
    console.log('⚠️  没有HWID可供测试')
    return
  }

  try {
    const response = await fetch(`${API_BASE}/cards/check-hwid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hwid: hwid,
      }),
    })

    const result = await response.json()

    if (response.ok) {
      console.log('✅ HWID检查成功:', result.message)
      console.log('📊 绑定信息:')
      console.log(`   是否绑定: ${result.bound ? '是' : '否'}`)
      if (result.bound) {
        console.log(`   总卡密数: ${result.totalCards}`)
        console.log(`   有效卡密数: ${result.validCards}`)
      }
    } else {
      console.error('❌ HWID检查失败:', result.error)
    }
  } catch (error) {
    console.error('❌ 网络错误:', error.message)
  }
}
async function testCheckExpired() {
  console.log('\n🧪 测试检查过期卡密...')

  try {
    const response = await fetch(`${API_BASE}/cards/check-expired`, {
      method: 'POST',
    })

    const result = await response.json()

    if (response.ok) {
      console.log('✅ 检查过期卡密成功:', result.message)
      console.log('📊 更新数量:', result.updated)
    } else {
      console.error('❌ 检查过期卡密失败:', result.error)
    }
  } catch (error) {
    console.error('❌ 网络错误:', error.message)
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始卡密系统测试（含HWID绑定功能）\n')

  // 1. 批量生成卡密
  const testCardKey = await testBatchGenerate()

  // 2. 验证卡密并绑定HWID
  const testHwid = await testVerifyCard(testCardKey)

  // 3. 重复验证（相同设备，应该成功）
  await testDuplicateVerify(testCardKey, testHwid)

  // 4. 不同设备验证（应该失败）
  await testDifferentDeviceVerify(testCardKey)

  // 5. 检查HWID绑定状态
  await testCheckHwid(testHwid)

  // 6. 获取卡密列表
  await testGetCards()

  // 7. 检查过期卡密
  await testCheckExpired()

  console.log('\n🎉 测试完成!')
  console.log('\n📋 后续操作:')
  console.log('1. 访问管理后台: http://localhost:3000/admin')
  console.log('2. 访问验证页面: http://localhost:3000/card-verify')
  console.log('3. 导出卡密: curl "http://localhost:3000/api/cards/export?format=csv" -o cards.csv')
  console.log('4. 检查HWID: POST /api/cards/check-hwid {"hwid": "your_hwid"}')
}

// 检查服务器是否运行
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/cards`)
    return response.status !== 404
  } catch (error) {
    return false
  }
}

// 启动测试
async function main() {
  const serverRunning = await checkServer()

  if (!serverRunning) {
    console.error('❌ 服务器未运行，请先启动开发服务器:')
    console.error('   pnpm run dev')
    process.exit(1)
  }

  await runTests()
}

// 如果是直接运行此脚本
if (typeof window === 'undefined') {
  main().catch(console.error)
}
