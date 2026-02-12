/**
 * Mock 数据服务
 * 后端未启动时，使用本地模拟数据跑通前端流程
 */

function delay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const mockDB: {
  validCodes: string[]
  usedCodes: string[]
  profiles: Record<string, any>
  userCodes: Record<string, any[]>
} = {
  validCodes: ['ABC123', 'TEST01', 'DEMO88', 'RAIN66', 'MOCK01', 'MOCK02'],
  usedCodes: [],
  profiles: {},
  userCodes: {},
}

export async function autoLogin(_wxCode: string) {
  await delay(300)
  const registered = wx.getStorageSync('mock_registered')
  if (registered) {
    const openid = registered.openid || ('mock_openid_' + Date.now())
    if (!mockDB.profiles[openid]) {
      mockDB.profiles[openid] = {
        id: Date.now(), serial_number: registered.serial_number || '000',
        status: registered.status || 'pending', rejection_reason: registered.rejection_reason || '',
        create_time: registered.create_time || _now(), published_at: registered.published_at || null,
        invitation_quota: registered.invitation_quota || 0, name: registered.name || '测试用户', photos: [],
      }
    }
    console.log('[Mock] 自动登录成功，老用户:', openid)
    return { success: true, message: '自动登录成功', openid, has_profile: true }
  }
  throw new Error('非注册用户')
}

export async function verifyInvitation(invitationCode: string, _wxCode: string) {
  await delay(500)
  const code = invitationCode.toUpperCase()
  if (mockDB.usedCodes.indexOf(code) >= 0) throw new Error('邀请码已被使用')
  if (mockDB.validCodes.indexOf(code) < 0) throw new Error('邀请码不存在')
  mockDB.usedCodes.push(code)
  const openid = 'mock_openid_' + Date.now()
  console.log('[Mock] 验证邀请码成功:', code, '-> openid:', openid)
  return { success: true, message: '验证成功', openid, has_profile: false }
}

export async function getMyCodes() {
  await delay(300)
  const openid = wx.getStorageSync('openid') || ''
  let codes = mockDB.userCodes[openid] || []
  if (codes.length === 0) {
    const profile = mockDB.profiles[openid]
    if (profile && (profile.status === 'approved' || profile.status === 'published')) {
      codes = [
        { code: 'INV' + Math.random().toString(36).substring(2, 5).toUpperCase(), is_used: false, created_at: _now() },
        { code: 'INV' + Math.random().toString(36).substring(2, 5).toUpperCase(), is_used: true, created_at: _now() },
      ]
      mockDB.userCodes[openid] = codes
    }
  }
  const usedCount = codes.filter((c: any) => c.is_used).length
  return { success: true, message: '获取成功', data: { codes, total: codes.length, used: usedCount, remaining: codes.length - usedCount } }
}

export async function submitProfile(data: any) {
  await delay(800)
  const openid = wx.getStorageSync('openid') || ''
  if (mockDB.profiles[openid]) throw new Error('您已经提交过资料，请使用更新接口')
  const serialNumber = String(Math.floor(Math.random() * 900) + 100)
  const profile = {
    id: Date.now(), serial_number: serialNumber, status: 'pending',
    rejection_reason: '', create_time: _now(), published_at: null,
    invitation_quota: 0, name: data.name, photos: data.photos || [],
  }
  mockDB.profiles[openid] = profile
  wx.setStorageSync('mock_registered', { openid, serial_number: serialNumber, status: 'pending', name: data.name, create_time: _now() })
  console.log('[Mock] 提交资料成功:', serialNumber, data.name)
  return { success: true, message: '提交成功，等待审核', data: { profile_id: profile.id, serial_number: serialNumber } }
}

export async function getMyProfile() {
  await delay(300)
  const openid = wx.getStorageSync('openid') || ''
  const profile = mockDB.profiles[openid]
  if (!profile) throw new Error('资料不存在')
  return { success: true, message: '获取成功', data: profile }
}

export async function updateProfile(data: any) {
  await delay(600)
  const openid = wx.getStorageSync('openid') || ''
  const profile = mockDB.profiles[openid]
  if (!profile) throw new Error('资料不存在')
  Object.assign(profile, data); profile.status = 'pending'; profile.rejection_reason = ''
  return { success: true, message: '更新成功', data: { profile_id: profile.id, status: 'pending' } }
}

export async function archiveProfile() {
  await delay(400)
  const openid = wx.getStorageSync('openid') || ''
  const profile = mockDB.profiles[openid]
  if (!profile) throw new Error('资料不存在')
  profile.status = 'archived'
  return { success: true, message: '已下架' }
}

export async function uploadPhoto(_filePath: string): Promise<string> {
  await delay(600)
  const mockUrl = '/uploads/photos/mock_' + Date.now() + '.jpg'
  console.log('[Mock] 照片上传成功(模拟):', mockUrl)
  return mockUrl
}

function _syncStorage(updates: Record<string, any>) {
  const reg = wx.getStorageSync('mock_registered') || {}
  Object.assign(reg, updates)
  wx.setStorageSync('mock_registered', reg)
}

export function mockApprove() {
  const openid = wx.getStorageSync('openid') || ''
  const profile = mockDB.profiles[openid]
  if (profile) {
    profile.status = 'approved'; profile.invitation_quota = 2
    mockDB.userCodes[openid] = [
      { code: 'INV' + Math.random().toString(36).substring(2, 5).toUpperCase(), is_used: false, created_at: _now() },
      { code: 'INV' + Math.random().toString(36).substring(2, 5).toUpperCase(), is_used: false, created_at: _now() },
    ]
    _syncStorage({ status: 'approved', invitation_quota: 2 })
    console.log('[Mock] ✅ 已模拟审核通过')
  }
}

export function mockReject(reason?: string) {
  const openid = wx.getStorageSync('openid') || ''
  const profile = mockDB.profiles[openid]
  if (profile) {
    profile.status = 'rejected'; profile.rejection_reason = reason || '资料不完整，请补充照片'
    _syncStorage({ status: 'rejected', rejection_reason: profile.rejection_reason })
    console.log('[Mock] ❌ 已模拟审核拒绝')
  }
}

export function mockPublish() {
  const openid = wx.getStorageSync('openid') || ''
  const profile = mockDB.profiles[openid]
  if (profile) {
    profile.status = 'published'; profile.published_at = _now()
    _syncStorage({ status: 'published', published_at: profile.published_at })
    console.log('[Mock] 🎉 已模拟发布')
  }
}

export function mockReset() {
  const openid = wx.getStorageSync('openid') || ''
  delete mockDB.profiles[openid]; delete mockDB.userCodes[openid]
  mockDB.usedCodes.length = 0
  wx.removeStorageSync('mock_registered')
  console.log('[Mock] 🔄 已重置所有模拟数据')
}

function _now(): string {
  const d = new Date()
  const pad = (n: number) => n < 10 ? '0' + n : '' + n
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export { mockDB }
