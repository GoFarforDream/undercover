import request from './request'

export function login (payload) {
  return request.post('/user/login', payload)
}

export function register (payload) {
  return request.post('/user/register', payload)
}

export function getProfile (userId) {
  return request.get(`/user/profile/${userId}`)
}
