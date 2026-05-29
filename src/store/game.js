const defaultPlayers = [
  { id: 1, name: '玩家 1', role: '平民', alive: true, speaking: true, voted: false },
  { id: 2, name: '玩家 2', role: '卧底', alive: true, speaking: false, voted: false },
  { id: 3, name: '玩家 3', role: '平民', alive: true, speaking: false, voted: true },
  { id: 4, name: '玩家 4', role: '平民', alive: true, speaking: false, voted: false },
  { id: 5, name: '玩家 5', role: '白板', alive: false, speaking: false, voted: true },
  { id: 6, name: '玩家 6', role: '平民', alive: true, speaking: false, voted: false }
]

const defaultSettings = {
  sound: true,
  speech: true,
  darkMode: true,
  autoNext: false,
  playerCount: 6,
  undercoverCount: 1,
  blankCount: 1,
  roundSeconds: 60
}

export function getSettings () {
  const saved = localStorage.getItem('undercover-settings')
  return saved ? { ...defaultSettings, ...JSON.parse(saved) } : { ...defaultSettings }
}

export function saveSettings (settings) {
  localStorage.setItem('undercover-settings', JSON.stringify(settings))
}

export function getGameState () {
  const saved = localStorage.getItem('undercover-game')
  if (saved) return JSON.parse(saved)

  return {
    roomCode: 'UC-0529',
    round: 2,
    phase: '发言阶段',
    civilianWord: '咖啡',
    undercoverWord: '奶茶',
    myWord: '咖啡',
    myRole: '平民',
    speakerIndex: 0,
    players: defaultPlayers,
    logs: [
      '玩家 1：我这个东西早上经常会喝。',
      '玩家 3：它可以热的，也可以冰的。',
      '玩家 6：我觉得 2 号描述有点绕。'
    ],
    votes: [
      { name: '玩家 2', count: 3 },
      { name: '玩家 4', count: 1 },
      { name: '玩家 6', count: 1 }
    ],
    winner: '平民阵营',
    mvp: '玩家 3'
  }
}

export function saveGameState (state) {
  localStorage.setItem('undercover-game', JSON.stringify(state))
}
