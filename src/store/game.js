export const defaultAgentNames = ['青霄灵', '玄烬灵', '扶摇灵', '赤冥灵', '归墟灵']
export const defaultAgentPersonalities = ['谨慎观星', '推演天机', '顺势执令', '迷雾藏锋', '锋芒斩魔']

const defaultSettings = {
  sound: true,
  speech: true,
  darkMode: true,
  autoNext: false,
  playerAsAgent: false,
  undercoverCount: 1,
  blankCount: 1,
  roundSeconds: 60,
  agentLevel: '问道',
  difficulty: '炼气',
  civilianWord: '',
  undercoverWord: '',
  agentNames: defaultAgentNames,
  agentPersonalities: defaultAgentPersonalities
}

export function getPlayerName () {
  return localStorage.getItem('undercover-current-user') || '道友'
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
  if (parsed.agentLevel === '轻松') parsed.agentLevel = '清修'
  if (parsed.agentLevel === '标准') parsed.agentLevel = '问道'
  if (parsed.agentLevel === '高压') parsed.agentLevel = '斩魔'
  if (parsed.difficulty === '洞虚') parsed.difficulty = '渡劫'
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
    ? { id: 1, name: `${playerName}托管灵`, type: 'ai', role: '仙修', alive: true, speaking: true, voted: false, trait: '道友托管仙位' }
    : { id: 1, name: playerName, type: 'human', role: '仙修', alive: true, speaking: true, voted: false, trait: '真人道友' }

  return [
    firstSeat,
    { id: 2, name: names[0], type: 'ai', role: '魔修', alive: true, speaking: false, voted: false, trait: personalities[0] },
    { id: 3, name: names[1], type: 'ai', role: '仙修', alive: true, speaking: false, voted: true, trait: personalities[1] },
    { id: 4, name: names[2], type: 'ai', role: '仙修', alive: true, speaking: false, voted: false, trait: personalities[2] },
    { id: 5, name: names[3], type: 'ai', role: '散修', alive: false, speaking: false, voted: true, trait: personalities[3] },
    { id: 6, name: names[4], type: 'ai', role: '仙修', alive: true, speaking: false, voted: false, trait: personalities[4] }
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
  if (saved) return immortalizeSavedState(JSON.parse(saved))

  const settings = getSettings()
  const players = createPlayers(settings)
  const firstSeatName = players[0].name
  const humanMode = !settings.playerAsAgent

  return {
    matchId: '仙府-0529',
    round: 2,
    phase: humanMode ? '道友陈词阶段' : '先天之灵自动圆桌局',
    civilianWord: '灵泉',
    undercoverWord: '魔泉',
    myWord: humanMode ? '灵泉' : '托管灵入定中',
    myRole: humanMode ? '仙修' : '托管仙位',
    speakerIndex: 0,
    players,
    logs: [
      `${firstSeatName}：此物常在晨修时入口，能醒神聚气。`,
      `${players[2].name}：它可温可凉，入口之后灵台会清明一些。`,
      `${players[5].name}：${players[1].name} 的说法像是在避开本源气息。`
    ],
    votes: [
      { name: players[1].name, count: 3 },
      { name: players[3].name, count: 1 },
      { name: firstSeatName, count: 1 }
    ],
    winner: '仙界大胜',
    mvp: players[2].name
  }
}

function immortalizeSavedState (state) {
  if (!state) return state
  const next = { ...state }
  next.phase = immortalizeText(next.phase)
  next.myRole = roleText(next.myRole)
  next.winner = immortalizeText(roleText(next.winner))
  next.players = (next.players || []).map(player => ({
    ...player,
    role: roleText(player.role),
    trait: immortalizeText(player.trait)
  }))
  next.logs = (next.logs || []).map(log => immortalizeText(log))
  return next
}

function immortalizeText (text) {
  return String(text || '')
    .replace(/谁是卧底/g, '仙魔圆桌局')
    .replace(/玩家发言阶段/g, '道友陈词阶段')
    .replace(/智能体自动对局/g, '先天之灵自动圆桌局')
    .replace(/平民阵营/g, '仙界大胜')
    .replace(/卧底阵营/g, '魔界入侵')
    .replace(/平民词/g, '仙修词')
    .replace(/卧底词/g, '魔修词')
    .replace(/平民/g, '仙修')
    .replace(/卧底/g, '魔修')
    .replace(/玩家/g, '道友')
    .replace(/投票/g, '诛仙令')
    .replace(/淘汰/g, '斩魔')
    .replace(/发言/g, '陈词')
    .replace(/词牌/g, '灵契')
    .replace(/游戏/g, '仙魔局')
    .replace(/智能体/g, '先天之灵')
}

export function saveGameState (state) {
  localStorage.setItem('undercover-game', JSON.stringify(state))
}

function roleText (role) {
  if (role === 'UNDERCOVER') return '魔修'
  if (role === 'CIVILIAN') return '仙修'
  if (role === '魔') return '天魔'
  if (role === '仙') return '仙修'
  return role || '未知'
}

function phaseText (phase) {
  const phaseMap = {
    WAITING: '仙府候场',
    WORD_REVEAL: '灵契显现',
    SPEAKING: '道友陈词',
    VOTING: '诛仙令',
    ELIMINATED: '本轮已斩魔',
    FINISHED: '仙魔终局'
  }
  return phaseMap[phase] || phase || '未知阶段'
}

export function normalizeBackendGameState (backendState, currentUserId) {
  if (!backendState) return getGameState()
  const players = (backendState.players || []).map((player, index) => ({
    id: player.userId,
    name: player.nickname || `道友 ${index + 1}`,
    type: player.userId === currentUserId ? 'human' : 'ai',
    role: roleText(player.role),
    rawRole: player.role,
    word: player.word,
    alive: player.alive,
    speaking: backendState.phase === 'SPEAKING' && index === 0,
    voted: Object.prototype.hasOwnProperty.call(backendState.votes || {}, String(player.userId)),
    trait: player.userId === currentUserId ? '真人道友' : '先天之灵'
  }))
  const currentPlayer = players.find(player => player.id === currentUserId) || players[0] || {}
  const voteCounts = {}
  Object.values(backendState.votes || {}).forEach(targetId => {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1
  })
  const votes = Object.keys(voteCounts).map(targetId => {
    const player = players.find(item => String(item.id) === String(targetId))
    return {
      name: player ? player.name : `道友 ${targetId}`,
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
    logs.unshift(`${backendState.lastEliminated.nickname} 被诛仙令斩出圆桌。`)
  }

  return {
    raw: backendState,
    matchId: backendState.roomCode || '未开仙府',
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
  const speechByPlayer = {}
  currentRoundSpeeches.forEach(speech => {
    speechByPlayer[String(speech.player_id)] = speech
  })
  const players = (backendState.players || []).map((player, index) => ({
    id: player.id,
    userId: player.user_id,
    name: player.nickname || `道友 ${index + 1}`,
    type: player.player_type === 'HUMAN' || player.user_id === currentUserId ? 'human' : 'ai',
    isMe: player.user_id === currentUserId,
    role: roleText(player.role),
    rawRole: player.role,
    word: player.word,
    alive: truthy(player.alive),
    speaking: String(backendState.pendingSpeakerId || backendState.pendingVoterId || '') === String(player.id),
    voted: rawVotes.some(vote => String(vote.voter_player_id) === String(player.id) && String(vote.round_no) === String(session.round_no)),
    trait: player.player_type === 'HUMAN' ? '真人道友' : (player.personality || '先天之灵'),
    speechBubble: speechByPlayer[String(player.id)]
      ? stripSpeakerName(speechByPlayer[String(player.id)].content, player.nickname)
      : ''
  }))
  const currentPlayer = players.find(player => player.userId === currentUserId) || players.find(player => player.type === 'human') || players[0] || {}
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
      name: player ? player.name : `道友 ${targetId}`,
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
        const speakerName = speaker ? speaker.name : '道友'
        return content.startsWith(`${speakerName}：`) || content.startsWith(`${speakerName}:`)
          ? content
          : `${speakerName}：${content}`
      }
      return content
    })

  return {
    raw: backendState,
    mode: 'agent',
    matchId: session.id ? `仙府-${session.id}` : '未开仙府',
    sessionId: session.id,
    pendingSpeakerId: backendState.pendingSpeakerId,
    pendingSpeakerType: backendState.pendingSpeakerType,
    pendingVoterId: backendState.pendingVoterId,
    pendingVoterType: backendState.pendingVoterType,
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
