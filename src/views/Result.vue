<template>
  <main class="app-shell result-page">
    <section class="result-hero">
      <span class="eyebrow">人机局结算</span>
      <h1>{{ state.winner || '等待结算' }}{{ state.winner ? ' 获胜' : '' }}</h1>
      <p>平民词「{{ state.civilianWord || '未揭晓' }}」，卧底词「{{ state.undercoverWord || '未揭晓' }}」。智能体发言与投票由后端 Agent 接口生成，失败时后端会使用兜底策略。</p>
      <div class="action-row">
        <button class="primary-button" type="button" @click="$router.push('/setup')">调整智能体再来</button>
        <button class="ghost-button" type="button" @click="$router.push('/home')">返回首页</button>
      </div>
    </section>
    <section class="reveal-grid">
      <article v-for="player in state.players" :key="player.id" class="mode-card">
        <span>{{ player.type === 'human' ? '真人玩家' : player.trait }}</span>
        <h3>{{ player.name }}</h3>
        <p>{{ player.role }} · {{ player.alive ? '存活' : '出局' }}</p>
      </article>
    </section>
  </main>
</template>

<script>
import { getAgentGameState, getGameStateApi } from '../api/game'
import { getCurrentAgentSessionId, getCurrentRoomCode, getGameState, normalizeAgentGameState, normalizeBackendGameState, saveGameState } from '../store/game'
import { getSessionUser } from '../store/session'

export default {
  name: 'Result',
  data () {
    return {
      state: getGameState(),
      sessionId: getCurrentAgentSessionId(),
      roomCode: getCurrentRoomCode()
    }
  },
  mounted () {
    this.loadResult()
  },
  methods: {
    async loadResult () {
      if (!this.roomCode && !this.sessionId) return
      const user = getSessionUser()
      try {
        if (this.sessionId) {
          const backendState = await getAgentGameState(this.sessionId)
          this.state = normalizeAgentGameState(backendState, user?.id)
        } else {
          const backendState = await getGameStateApi(this.roomCode)
          this.state = normalizeBackendGameState(backendState, user?.id)
        }
        saveGameState(this.state)
      } catch (error) {
        console.warn(error.message)
      }
    }
  }
}
</script>
