/**
 * API 服务层
 * 封装所有后端接口调用
 */

const BASE_URL = 'https://your-domain.com/api/v1'  // TODO: 替换为实际域名

// ========== 通用请求封装 ==========

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
}

function request<T = any>(options: {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
}): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    const openid = wx.getStorageSync('openid') || ''

    wx.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': openid,
        ...options.header,
      },
      success(res: any) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as ApiResponse<T>)
        } else if (res.statusCode === 401) {
          // 未授权，跳转到首页重新登录
          wx.removeStorageSync('openid')
          wx.reLaunch({ url: '/pages/index/index' })
          reject(new Error('未授权，请重新登录'))
        } else {
          const errMsg = res.data?.detail || res.data?.message || '请求失败'
          reject(new Error(errMsg))
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络错误'))
      },
    })
  })
}

// ========== 邀请码相关 ==========

export interface VerifyResult {
  success: boolean
  message: string
  openid?: string
  has_profile: boolean
}

/** 验证邀请码 */
export function verifyInvitation(invitationCode: string, wxCode: string): Promise<VerifyResult> {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/invitation/verify`,
      method: 'POST',
      data: {
        invitation_code: invitationCode,
        wx_code: wxCode,
      },
      header: { 'Content-Type': 'application/json' },
      success(res: any) {
        if (res.statusCode === 200) {
          resolve(res.data as VerifyResult)
        } else {
          reject(new Error(res.data?.detail || '验证失败'))
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络错误'))
      },
    })
  })
}

/** 获取我的邀请码 */
export function getMyCodes(): Promise<ApiResponse> {
  return request({ url: '/invitation/my-codes' })
}

// ========== 用户资料相关 ==========

export interface ProfileData {
  name: string
  gender: string
  age: number
  height: number
  weight: number
  marital_status?: string
  body_type?: string
  hometown?: string
  work_location?: string
  industry?: string
  constellation?: string
  mbti?: string
  health_condition?: string
  housing_status?: string
  hobbies: string[]
  lifestyle?: string
  coming_out_status?: string
  expectation?: {
    relationship?: string
    body_type?: string
    appearance?: string
    age_range?: string
    habits?: string
    personality?: string
    location?: string
    children?: string
    other?: string
  }
  special_requirements?: string
  photos: string[]
}

/** 提交资料 */
export function submitProfile(data: ProfileData): Promise<ApiResponse> {
  return request({
    url: '/profile/submit',
    method: 'POST',
    data,
  })
}

/** 获取我的资料 */
export function getMyProfile(): Promise<ApiResponse> {
  return request({ url: '/profile/my' })
}

/** 更新资料 */
export function updateProfile(data: ProfileData): Promise<ApiResponse> {
  return request({
    url: '/profile/update',
    method: 'PUT',
    data,
  })
}

/** 下架资料 */
export function archiveProfile(): Promise<ApiResponse> {
  return request({
    url: '/profile/archive',
    method: 'POST',
  })
}

// ========== 文件上传 ==========

/** 上传照片 */
export function uploadPhoto(filePath: string): Promise<ApiResponse> {
  return new Promise((resolve, reject) => {
    const openid = wx.getStorageSync('openid') || ''

    wx.uploadFile({
      url: `${BASE_URL}/upload/photo`,
      filePath,
      name: 'file',
      header: {
        Authorization: openid,
      },
      success(res) {
        if (res.statusCode === 200) {
          const data = JSON.parse(res.data)
          resolve(data)
        } else {
          reject(new Error('上传失败'))
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '上传失败'))
      },
    })
  })
}

export default {
  verifyInvitation,
  getMyCodes,
  submitProfile,
  getMyProfile,
  updateProfile,
  archiveProfile,
  uploadPhoto,
}
