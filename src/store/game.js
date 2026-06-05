export const defaultAgentNames = ['Agent 01', 'Agent 02', 'Agent 03', 'Agent 04', 'Agent 05']
export const defaultAgentPersonalities = ['谨慎型', '推理型', '跟票型', '混淆型', '激进型']

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
  agentNames: defaultAgentNames,
  agentPersonalities: defaultAgentPersonalities
}

export function getPlayerName () {
  return localStorage.getItem('undercover-current-user') || '你'
}

export function getCurrentRoomCode () {
  return localStorage.getItem('undercover-room-code') || ''
}

export function saveCurrentRoomCode (roomCode) {
  if (roomCode) localStorage.setItem('undercover-room-code', roomCode)
}

export function getCurrentAgentSessionId () {
  return localStorage.getItem('undercover-agent-session-id') || ''
}

export function saveCurrentAgentSessionId (sessionId) {
  if (sessionId) localStorage.setItem('undercover-agent-session-id', String(sessionId))
}

function normalizeAgentNames (names = []) {
  const source = names.length >= 6 ? names.slice(1, 6) : names
  return defaultAgentNames.map((name, index) => source[index] || name)
}

function normalizeAgentPersonalities (personalities = []) {
  return defaultAgentPersonalities.map((personality, index) => personalities[index] || personality)
}

export function getSettings () {
  const saved = localStorage.getItem('undercover-settings')
  const parsed = saved ? JSON.parse(saved) : {}
  return {
    ...defaultSettings,
    ...parsed,
    agentNames: normalizeAgentNames(parsed.agentNames),
    agentPersonalities: normalizeAgentPersonalities(parsed.agentPersonalities)
  }
}

export function saveSettings (settings) {
  localStorage.setItem('undercover-settings', JSON.stringify({
    ...settings,
    agentNames: normalizeAgentNames(settings.agentNames),
    agentPersonalities: normalizeAgentPersonalities(settings.agentPersonalities)
  }))
}

export function resetGameState () {
  localStorage.removeItem('undercover-game')
}

export function resetCurrentGamePointers () {
  localStorage.removeItem('undercover-room-code')
  localStorage.removeItem('undercover-agent-session-id')
  resetGameState()
}

function createPlayers (settings = getSettings()) {
  const names = normalizeAgentNames(settings.agentNames)
  const personalities = normalizeAgentPersonalities(settings.agentPersonalities)
  const playerName = getPlayerName()
  const firstSeat = settings.playerAsAgent
    ? { id: 1, name: `${playerName}托管`, type: 'ai', role: '平民', alive: true, speaking: true, voted: false, trait: '玩家托管' }
    : { id: 1, name: playerName, type: 'human', role: '平民', alive: true, speaking: true, voted: false, trait: '真人玩家' }

  return [
    firstSeat,
    { id: 2, name: names[0], type: 'ai', role: '卧底', alive: true, speaking: false, voted: false, trait: personalities[0] },
    { id: 3, name: names[1], type: 'ai', role: '平民', alive: true, speaking: false, voted: true, trait: personalities[1] },
    { id: 4, name: names[2], type: 'ai', role: '平民', alive: true, speaking: false, voted: false, trait: personalities[2] },
    { id: 5, name: names[3], type: 'ai', role: '白板', alive: false, speaking: false, voted: true, trait: personalities[3] },
    { id: 6, name: names[4], type: 'ai', role: '平民', alive: true, speaking: false, voted: false, trait: personalities[4] }
  ]
}

export function getSeatProfiles (settings = getSettings()) {
  return createPlayers(settings).map(player => ({
    name: player.name,
    trait: player.trait,
    type: player.type
  }))
}

// 一下是没接入后端的代码，用于测试 接入后端，数据需要从后端获取
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
    phase: humanMode ? '玩家发言阶段' : '智能体自动对局',
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

function roleText (role) {
  if (role === 'UNDERCOVER') return '卧底'
  if (role === 'CIVILIAN') return '平民'
  return role || '未知'
}

function phaseText (phase) {
  const phaseMap = {
    WAITING: '等待开始',
    WORD_REVEAL: '词牌确认',
    SPEAKING: '发言中',
    VOTING: '投票中',
    ELIMINATED: '本轮已淘汰',
    FINISHED: '游戏结束'
  }
  return phaseMap[phase] || phase || '未知阶段'
}

export function normalizeBackendGameState (backendState, currentUserId) {
  if (!backendState) return getGameState()
  const players = (backendState.players || []).map((player, index) => ({
    id: player.userId,
    name: player.nickname || `玩家 ${index + 1}`,
    type: player.userId === currentUserId ? 'human' : 'ai',
    role: roleText(player.role),
    rawRole: player.role,
    word: player.word,
    alive: player.alive,
    speaking: backendState.phase === 'SPEAKING' && index === 0,
    voted: Object.prototype.hasOwnProperty.call(backendState.votes || {}, String(player.userId)),
    trait: player.userId === currentUserId ? '真人玩家' : 'Agent 占位'
  }))
  const currentPlayer = players.find(player => player.id === currentUserId) || players[0] || {}
  const voteCounts = {}
  Object.values(backendState.votes || {}).forEach(targetId => {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1
  })
  const votes = Object.keys(voteCounts).map(targetId => {
    const player = players.find(item => String(item.id) === String(targetId))
    return {
      name: player ? player.name : `玩家 ${targetId}`,
      count: voteCounts[targetId]
    }
  })
  const logs = []
  ;(backendState.players || []).forEach(player => {
    ;(player.speeches || []).forEach(speech => {
      logs.unshift(`${player.nickname}：${speech}`)
    })
  })
  if (backendState.lastEliminated) {
    logs.unshift(`${backendState.lastEliminated.nickname} 被投票淘汰。`)
  }

  return {
    raw: backendState,
    matchId: backendState.roomCode || '未开局',
    roomCode: backendState.roomCode,
    round: backendState.roundNo || 1,
    phase: phaseText(backendState.phase),
    rawPhase: backendState.phase,
    civilianWord: backendState.wordPair?.civilianWord || '',
    undercoverWord: backendState.wordPair?.undercoverWord || '',
    myWord: currentPlayer.word || '',
    myRole: currentPlayer.role || '',
    speakerIndex: 0,
    players,
    logs,
    votes,
    winner: roleText(backendState.winner) || '',
    mvp: backendState.lastEliminated?.nickname || currentPlayer.name || ''
  }
}

function truthy (value) {
  return value === true || value === 1 || value === '1' || value === 'true'
}

function cleanAgentText (text) {
  return String(text || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/\/+\s*$/g, '')
    .trim()
}

function stripSpeakerName (text, speakerName) {
  const content = cleanAgentText(text)
  if (!speakerName) return content
  return content
    .replace(new RegExp(`^${escapeRegExp(speakerName)}\\s*[:：]\\s*`), '')
    .trim()
}

function escapeRegExp (text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function normalizeAgentGameState (backendState, currentUserId) {
  if (!backendState) return getGameState()
  const session = backendState.session || {}
  const speeches = backendState.speeches || []
  const rawVotes = backendState.votes || []
  const currentRoundSpeeches = speeches.filter(speech => String(speech.round_no) === String(session.round_no))
  const latestSpeech = currentRoundSpeeches[currentRoundSpeeches.length - 1]
  const speechByPlayer = {}
  currentRoundSpeeches.forEach(speech => {
    speechByPlayer[String(speech.player_id)] = speech
  })
  const players = (backendState.players || []).map((player, index) => ({
    id: player.id,
    userId: player.user_id,
    name: player.nickname || `玩家 ${index + 1}`,
    type: player.player_type === 'HUMAN' || player.user_id === currentUserId ? 'human' : 'ai',
    role: roleText(player.role),
    rawRole: player.role,
    word: player.word,
    alive: truthy(player.alive),
    speaking: latestSpeech ? String(latestSpeech.player_id) === String(player.id) : (session.phase === 'SPEAKING' && index === 0),
    voted: rawVotes.some(vote => String(vote.voter_player_id) === String(player.id) && String(vote.round_no) === String(session.round_no)),
    trait: player.player_type === 'HUMAN' ? '真人玩家' : (player.personality || '智能体玩家'),
    speechBubble: speechByPlayer[String(player.id)]
      ? stripSpeakerName(speechByPlayer[String(player.id)].content, player.nickname)
      : ''
  }))
  const currentPlayer = players.find(player => player.userId === currentUserId || player.type === 'human') || players[0] || {}
  const voteCounts = {}
  rawVotes
    .filter(vote => String(vote.round_no) === String(session.round_no))
    .forEach(vote => {
      const targetId = vote.target_player_id
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1
    })
  const votes = Object.keys(voteCounts).map(targetId => {
    const player = players.find(item => String(item.id) === String(targetId))
    return {
      name: player ? player.name : `玩家 ${targetId}`,
      count: voteCounts[targetId]
    }
  })
  const logs = speeches
    .slice()
    .reverse()
    .map(speech => {
      const content = cleanAgentText(speech.content)
      if (speech.generated_by === 'HUMAN') {
        const speaker = players.find(player => String(player.id) === String(speech.player_id))
        const speakerName = speaker ? speaker.name : '玩家'
        return content.startsWith(`${speakerName}：`) || content.startsWith(`${speakerName}:`)
          ? content
          : `${speakerName}：${content}`
      }
      return content
    })

  return {
    raw: backendState,
    mode: 'agent',
    matchId: session.id ? `AGENT-${session.id}` : '未开局',
    sessionId: session.id,
    round: session.round_no || 1,
    phase: phaseText(session.phase),
    rawPhase: session.phase,
    civilianWord: session.civilian_word || '',
    undercoverWord: session.undercover_word || '',
    myWord: currentPlayer.word || '',
    myRole: currentPlayer.role || '',
    humanPlayerId: currentPlayer.id,
    speakerIndex: 0,
    players,
    logs,
    votes,
    winner: roleText(session.winner) || '',
    mvp: currentPlayer.name || ''
  }
}
