import request from './request'

export function getRandomWordPair () {
  return request.get('/aiCreateInfo')
}

export function createWordPair (civilianWord, undercoverWord) {
  return request.get('/createInfo', {
    params: { civilianWord, undercoverWord }
  })
}

export const agentBridgeReady = false
