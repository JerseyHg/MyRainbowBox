/**
 * API 服务层
 * 封装所有后端接口调用
 */

/** 获取 BASE_URL（从 globalData 读取） */
function getBaseUrl(): string {
  const app = getApp<IAppOption>()
  return app.globalData.baseUrl
}

/** 获取当前 openid */
function getOpenid(): string {
  return wx.getStorageSync('openid') || ''
}

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
    const openid = getOpenid()

    wx.request({
      url: `${getBaseUrl()}${options.url}`,
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
          // 未授权，清除登录态并跳回首页
          wx.removeStorageSync('openid')
          wx.removeStorageSync('hasProfile')
          wx.reLaunch({ url: '/pages/index/index' })
          reject(new Error('未授权，请重新登录'))
        } else {
          const errMsg = res.data?.detail || res.data?.message || '请求失败'
          reject(new Error(errMsg))
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络错误，请检查网络'))
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
      url: `${getBaseUrl()}/invitation/verify`,
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
          const errMsg = res.data?.detail || res.data?.message || '验证失败'
          reject(new Error(errMsg))
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

/** 上传单张照片，返回服务器URL */
export function uploadPhoto(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const openid = getOpenid()

    wx.uploadFile({
      url: `${getBaseUrl()}/upload/photo`,
      filePath,
      name: 'file',
      header: {
        Authorization: openid,
      },
      success(res) {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data)
            if (data.success && data.data?.url) {
              resolve(data.data.url)
            } else {
              reject(new Error(data.message || '上传失败'))
            }
          } catch (e) {
            reject(new Error('解析响应失败'))
          }
        } else {
          reject(new Error('上传失败，状态码: ' + res.statusCode))
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '上传失败'))
      },
    })
  })
}

/**
 * 批量上传照片
 * 返回已上传的服务器URL数组
 * 跳过已经是服务器路径的照片(以 /uploads 或 http 开头)
 */
export async function uploadPhotos(
  localPaths: string[],
  onProgress?: (uploaded: number, total: number) => void
): Promise<string[]> {
  const urls: string[] = []
  const total = localPaths.length

  for (let i = 0; i < total; i++) {
    const path = localPaths[i]

    // 如果已经是服务器URL则跳过
    if (path.startsWith('/uploads') || path.startsWith('http')) {
      urls.push(path)
    } else {
      const url = await uploadPhoto(path)
      urls.push(url)
    }

    if (onProgress) {
      onProgress(i + 1, total)
    }
  }

  return urls
}

export default {
  verifyInvitation,
  getMyCodes,
  submitProfile,
  getMyProfile,
  updateProfile,
  archiveProfile,
  uploadPhoto,
  uploadPhotos,
}
