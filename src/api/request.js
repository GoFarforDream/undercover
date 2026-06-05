import axios from 'axios'

const service = axios.create({
  baseURL: 'http://uc.voyagers.work:8081/api',
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json'
  }
})

service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('undercover-token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const body = response.data
    if (body && Object.prototype.hasOwnProperty.call(body, 'code')) {
      if (body.code === 200) return body.data
      return Promise.reject(new Error(immortalizeMessage(body.message || '仙府传讯失败')))
    }
    return body
  },
  error => {
    const message = error.response?.data?.message || error.message || '网络异常'
    return Promise.reject(new Error(immortalizeMessage(message)))
  }
)

function immortalizeMessage (message) {
  return String(message || '')
    .replace(/谁是卧底/g, '仙魔圆桌局')
    .replace(/平民词/g, '仙修词')
    .replace(/卧底词/g, '魔修词')
    .replace(/平民/g, '仙修')
    .replace(/卧底/g, '魔修')
    .replace(/玩家/g, '道友')
    .replace(/投票/g, '诛仙令')
    .replace(/票/g, '令')
    .replace(/淘汰/g, '斩魔')
    .replace(/房间/g, '仙府')
    .replace(/房号/g, '仙府令')
    .replace(/房主/g, '府主')
    .replace(/发言/g, '陈词')
    .replace(/词牌/g, '灵契')
    .replace(/游戏/g, '仙魔局')
    .replace(/智能体/g, '先天之灵')
    .replace(/登录/g, '入仙府')
    .replace(/用户/g, '道友')
}

export default service
