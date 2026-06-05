import request from './request'

export function createRoom (payload) {
  return request.post('/room/create', payload)
}

export function joinRoom (payload) {
  return request.post('/room/join', payload)
}

export function leaveRoom (roomCode, userId) {
  return request.post('/room/leave', null, {
    params: { roomCode, userId }
  })
}

export function updateRoomSettings (roomCode, settings) {
  return request.post(`/room/${roomCode}/settings`, settings)
}

export function listRooms () {
  return request.get('/room/list')
}

export function getRoom (roomCode) {
  return request.get(`/room/${roomCode}`)
}

export function fillPlaceholders (roomCode) {
  return request.post(`/room/${roomCode}/fill-placeholders`)
}
