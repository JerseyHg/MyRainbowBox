/**
 * API 服务层
 * 封装所有后端接口调用
 */

/** 获取 BASE_URL */
function getBaseUrl() {
  var app = getApp()
  return app.globalData.baseUrl
}

/** 获取当前 openid */
function getOpenid() {
  return wx.getStorageSync('openid') || ''
}

// ========== 通用请求封装 ==========

function request(options) {
  return new Promise(function (resolve, reject) {
    var openid = getOpenid()

    wx.request({
      url: getBaseUrl() + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: Object.assign({
        'Content-Type': 'application/json',
        'Authorization': openid,
      }, options.header || {}),
      success: function (res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          wx.removeStorageSync('openid')
          wx.removeStorageSync('hasProfile')
          wx.reLaunch({ url: '/pages/index/index' })
          reject(new Error('未授权，请重新登录'))
        } else {
          var errMsg = (res.data && (res.data.detail || res.data.message)) || '请求失败'
          reject(new Error(errMsg))
        }
      },
      fail: function (err) {
        reject(new Error(err.errMsg || '网络错误，请检查网络'))
      },
    })
  })
}

// ========== 邀请码相关 ==========

/** 验证邀请码 */
function verifyInvitation(invitationCode, wxCode) {
  return new Promise(function (resolve, reject) {
    wx.request({
      url: getBaseUrl() + '/invitation/verify',
      method: 'POST',
      data: {
        invitation_code: invitationCode,
        wx_code: wxCode,
      },
      header: { 'Content-Type': 'application/json' },
      success: function (res) {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          var errMsg = (res.data && (res.data.detail || res.data.message)) || '验证失败'
          reject(new Error(errMsg))
        }
      },
      fail: function (err) {
        reject(new Error(err.errMsg || '网络错误'))
      },
    })
  })
}

/** 获取我的邀请码 */
function getMyCodes() {
  return request({ url: '/invitation/my-codes' })
}

// ========== 用户资料相关 ==========

/** 提交资料 */
function submitProfile(data) {
  return request({
    url: '/profile/submit',
    method: 'POST',
    data: data,
  })
}

/** 获取我的资料 */
function getMyProfile() {
  return request({ url: '/profile/my' })
}

/** 更新资料 */
function updateProfile(data) {
  return request({
    url: '/profile/update',
    method: 'PUT',
    data: data,
  })
}

/** 下架资料 */
function archiveProfile() {
  return request({
    url: '/profile/archive',
    method: 'POST',
  })
}

// ========== 文件上传 ==========

/** 上传单张照片，返回服务器URL */
function uploadPhoto(filePath) {
  return new Promise(function (resolve, reject) {
    var openid = getOpenid()

    wx.uploadFile({
      url: getBaseUrl() + '/upload/photo',
      filePath: filePath,
      name: 'file',
      header: {
        Authorization: openid,
      },
      success: function (res) {
        if (res.statusCode === 200) {
          try {
            var data = JSON.parse(res.data)
            if (data.success && data.data && data.data.url) {
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
      fail: function (err) {
        reject(new Error(err.errMsg || '上传失败'))
      },
    })
  })
}

// ========== 导出 ==========

module.exports = {
  verifyInvitation: verifyInvitation,
  getMyCodes: getMyCodes,
  submitProfile: submitProfile,
  getMyProfile: getMyProfile,
  updateProfile: updateProfile,
  archiveProfile: archiveProfile,
  uploadPhoto: uploadPhoto,
}
