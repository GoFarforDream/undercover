<template>
  <main class="app-shell result-page">
    <section class="result-hero">
      <span class="eyebrow">仙魔终局卷轴</span>
      <h1>{{ resultTitle }}</h1>
      <p>仙修灵契「{{ state.civilianWord || '未揭晓' }}」，魔修灵契「{{ state.undercoverWord || '未揭晓' }}」。先天之灵陈词与诛仙令由后端 Dify 灵阵生成，传讯失败时后端会启用兜底推演。</p>
      <div class="action-row">
        <button class="primary-button" type="button" @click="$router.push('/setup')">重整仙府再战</button>
        <button class="ghost-button" type="button" @click="$router.push('/home')">返回仙府首页</button>
      </div>
    </section>
    <section class="reveal-grid">
      <article v-for="player in state.players" :key="player.id" class="mode-card">
        <span>{{ player.type === 'human' ? '真人道友' : player.trait }}</span>
        <h3>{{ player.name }}</h3>
        <p>{{ player.role }} · {{ player.alive ? '仍在圆桌' : '已飞升离席' }}</p>
      </article>
    </section>
    <loading-overlay :show="loading" title="正在刷新终局卷轴" description="正在从后端同步最终灵契和仙魔胜负。" />
  </main>
</template>

<script>
import LoadingOverlay from '../components/LoadingOverlay.vue'
import { getAgentGameState, getGameStateApi } from '../api/game'
import { getCurrentAgentSessionId, getCurrentRoomCode, getGameState, normalizeAgentGameState, normalizeBackendGameState, saveGameState } from '../store/game'
import { getSessionUser } from '../store/session'

export default {
  name: 'Result',
  components: { LoadingOverlay },
  data () {
    return {
      state: getGameState(),
      sessionId: getCurrentAgentSessionId(),
      roomCode: getCurrentRoomCode(),
      loading: false
    }
  },
  mounted () {
    this.loadResult()
  },
  computed: {
    resultTitle () {
      if (!this.state.winner) return '等待终局'
      if (this.state.winner.indexOf('仙') !== -1 || this.state.winner.indexOf('平民') !== -1 || this.state.winner.indexOf('CIVILIAN') !== -1) {
        return '仙界大胜'
      }
      if (this.state.winner.indexOf('魔') !== -1 || this.state.winner.indexOf('卧底') !== -1 || this.state.winner.indexOf('UNDERCOVER') !== -1) {
        return '魔界入侵'
      }
      return `${this.state.winner} 定局`
    }
  },
  methods: {
    async loadResult () {
      if (!this.roomCode && !this.sessionId) return
      const user = getSessionUser()
      this.loading = true
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
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
