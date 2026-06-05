import request from './request'

export function startGame (payload) {
  return request.post('/game/start', payload)
}

export function getGameStateApi (roomCode) {
  return request.get(`/game/state/${roomCode}`)
}

export function submitSpeech (payload) {
  return request.post('/game/speech', payload)
}

export function submitVote (payload) {
  return request.post('/game/vote', payload)
}

export function nextRound (roomCode) {
  return request.post(`/game/next-round/${roomCode}`)
}

export function startAgentGame (payload) {
  return request.post('/agent-game/start', payload, { timeout: 120000 })
}

export function getAgentGameState (sessionId) {
  return request.get(`/agent-game/state/${sessionId}`)
}

export function submitAgentSpeech (payload) {
  return request.post('/agent-game/speech', payload)
}

export function runAgentSpeech (sessionId) {
  return request.post(`/agent-game/agent-speech/${sessionId}`, null, { timeout: 120000 })
}

export function runAgentSpeechForPlayer (sessionId, playerId) {
  return request.post(`/agent-game/agent-speech/${sessionId}/${playerId}`, null, { timeout: 120000 })
}

export function submitAgentVote (payload) {
  return request.post('/agent-game/vote', payload)
}

export function runAgentVote (sessionId) {
  return request.post(`/agent-game/agent-vote/${sessionId}`, null, { timeout: 120000 })
}

export function resolveAgentRound (sessionId) {
  return request.post(`/agent-game/resolve/${sessionId}`, null, { timeout: 120000 })
}

export function nextAgentRound (sessionId) {
  return request.post(`/agent-game/next-round/${sessionId}`)
}
