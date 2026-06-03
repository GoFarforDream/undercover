import axios from 'axios'

// 创建 axios 实例
const service = axios.create({
  baseURL: '/api', // 前端代理地址，真正Dify地址在 vue.config.js 里
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 可在这里加 token
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 直接返回数据
    return response.data
  },
  error => {
    console.error('请求异常：', error)
    return Promise.reject(error)
  }
)

export default service