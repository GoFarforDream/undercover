export const defaultAgentNames = ['Agent 01', 'Agent 02', 'Agent 03', 'Agent 04', 'Agent 05']

const defaultSettings = {
  sound: true,
  speech: true,
  darkMode: true,
  autoNext: false,
  playerAsAgent: false,
  undercoverCount: 1,
  blankCount: 1,
  roundSeconds: 60,
  agentLevel: '标准',
  agentNames: defaultAgentNames
}

export function getPlayerName () {
  return localStorage.getItem('undercover-current-user') || '你'
}

function normalizeAgentNames (names = []) {
  const source = names.length >= 6 ? names.slice(1, 6) : names
  return defaultAgentNames.map((name, index) => source[index] || name)
}

export function getSettings () {
  const saved = localStorage.getItem('undercover-settings')
  const parsed = saved ? JSON.parse(saved) : {}
  return {
    ...defaultSettings,
    ...parsed,
    agentNames: normalizeAgentNames(parsed.agentNames)
  }
}

export function saveSettings (settings) {
  localStorage.setItem('undercover-settings', JSON.stringify({
    ...settings,
    agentNames: normalizeAgentNames(settings.agentNames)
  }))
}

export function resetGameState () {
  localStorage.removeItem('undercover-game')
}

function createPlayers (settings = getSettings()) {
  const names = normalizeAgentNames(settings.agentNames)
  const playerName = getPlayerName()
  const firstSeat = settings.playerAsAgent
    ? { id: 1, name: `${playerName}托管`, type: 'ai', role: '平民', alive: true, speaking: true, voted: false, trait: '玩家托管' }
    : { id: 1, name: playerName, type: 'human', role: '平民', alive: true, speaking: true, voted: false, trait: '真人玩家' }

  return [
    firstSeat,
    { id: 2, name: names[0], type: 'ai', role: '卧底', alive: true, speaking: false, voted: false, trait: '谨慎型' },
    { id: 3, name: names[1], type: 'ai', role: '平民', alive: true, speaking: false, voted: true, trait: '推理型' },
    { id: 4, name: names[2], type: 'ai', role: '平民', alive: true, speaking: false, voted: false, trait: '跟票型' },
    { id: 5, name: names[3], type: 'ai', role: '白板', alive: false, speaking: false, voted: true, trait: '混淆型' },
    { id: 6, name: names[4], type: 'ai', role: '平民', alive: true, speaking: false, voted: false, trait: '激进型' }
  ]
}

export function getSeatProfiles (settings = getSettings()) {
  return createPlayers(settings).map(player => ({
    name: player.name,
    trait: player.trait,
    type: player.type
  }))
}

export function getGameState () {
  const saved = localStorage.getItem('undercover-game')
  if (saved) return JSON.parse(saved)

  const settings = getSettings()
  const players = createPlayers(settings)
  const firstSeatName = players[0].name
  const humanMode = !settings.playerAsAgent

  return {
    matchId: 'AI-0529',
    round: 2,
    phase: humanMode ? '人类发言阶段' : '智能体自动对局',
    civilianWord: '咖啡',
    undercoverWord: '奶茶',
    myWord: humanMode ? '咖啡' : '托管中',
    myRole: humanMode ? '平民' : '旁观托管',
    speakerIndex: 0,
    players,
    logs: [
      `${firstSeatName}：我这个东西早上经常会喝。`,
      `${players[2].name}：它可以热的，也可以冰的。`,
      `${players[5].name}：${players[1].name} 的描述有点像在避开核心特征。`
    ],
    votes: [
      { name: players[1].name, count: 3 },
      { name: players[3].name, count: 1 },
      { name: firstSeatName, count: 1 }
    ],
    winner: '平民阵营',
    mvp: players[2].name
  }
}

export function saveGameState (state) {
  localStorage.setItem('undercover-game', JSON.stringify(state))
}
