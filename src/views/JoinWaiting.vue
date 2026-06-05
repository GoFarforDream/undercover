<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <span class="eyebrow">仙府 {{ roomCode || '入府中' }}</span>
        <h1>等待仙友开局</h1>
      </div>
      <button class="ghost-button" type="button" @click="$router.push('/home')">返回仙府首页</button>
    </header>

    <section class="waiting-stage join-waiting-stage">
      <div class="waiting-portal join-waiting-portal">
        <div class="waiting-hero">
          <span class="eyebrow">Joined immortal mansion</span>
          <h2>{{ ownerName ? `已匹配府主：${ownerName}` : '正在匹配府主' }}</h2>
          <p>你已进入同一座仙府。请等待府主开启仙缘；开局后会自动进入同一场仙魔圆桌局。</p>
        </div>

        <div class="join-waiting-status">
          <strong>等待仙友开局</strong>
          <span>{{ playerCountText }}</span>
        </div>

        <div v-if="roomCode" class="copy-box">
          <span>仙府令：{{ roomCode }}</span>
          <button type="button" @click="copyRoomCode">复制</button>
        </div>
        <p v-if="message" class="form-message">{{ message }}</p>
      </div>

      <aside class="waiting-side">
        <div class="room-card">
          <h2>当前仙府</h2>
          <p class="modal-copy">府主开启仙缘后，所有已入府真人道友会进入同一局；剩余席位由先天之灵补齐。</p>
          <div class="room-count-grid">
            <article>
              <span>当前人数</span>
              <strong>{{ currentPlayers }}</strong>
            </article>
            <article>
              <span>仙府上限</span>
              <strong>{{ maxPlayers }}</strong>
            </article>
          </div>
        </div>

        <div class="waiting-list">
          <article v-for="seat in roomSeats" :key="seat.key">
            {{ seat.name }}
            <span>{{ seat.trait }}</span>
          </article>
        </div>
      </aside>
    </section>

    <loading-overlay
      :show="loading"
      title="正在进入仙府"
      description="正在同步府主、席位和开局状态。"
    />
  </main>
</template>

<script>
import LoadingOverlay from '../components/LoadingOverlay.vue'
import { getRoom, joinRoom } from '../api/room'
import { getAgentGameState } from '../api/game'
import { getSeatProfiles, getSettings, normalizeAgentGameState, resetGameState, saveCurrentAgentSessionId, saveCurrentRoomCode, saveGameState } from '../store/game'
import { getSessionUser } from '../store/session'

export default {
  name: 'JoinWaiting',
  components: { LoadingOverlay },
  data () {
    return {
      settings: getSettings(),
      room: null,
      roomCode: this.$route.query.roomCode || this.$route.params.roomCode || '',
      loading: false,
      message: '',
      timer: null
    }
  },
  computed: {
    currentPlayers () {
      return this.room?.players?.length || 0
    },
    maxPlayers () {
      return this.room?.settings?.maxPlayers || 6
    },
    playerCountText () {
      return `${this.currentPlayers} / ${this.maxPlayers} 位仙友已入府`
    },
    ownerName () {
      return (this.room?.players || []).find(player => player.owner)?.nickname || ''
    },
    roomSeats () {
      const humanSeats = (this.room?.players || []).map(player => ({
        key: `human-${player.userId}`,
        name: player.nickname,
        trait: `${player.owner ? '府主' : '真人道友'} · 第 ${player.seatNo} 仙位`
      }))
      const rest = Math.max(0, this.maxPlayers - humanSeats.length)
      const agentSeats = getSeatProfiles(this.settings).slice(0, rest).map((seat, index) => ({
        key: `agent-${index}`,
        name: seat.name,
        trait: `${seat.trait} · 待补位`
      }))
      return humanSeats.concat(agentSeats)
    }
  },
  mounted () {
    this.enterRoom()
    this.timer = window.setInterval(() => this.loadRoom(), 2000)
  },
  beforeDestroy () {
    if (this.timer) window.clearInterval(this.timer)
  },
  methods: {
    async enterRoom () {
      const user = getSessionUser()
      if (!user?.id) {
        this.message = '仙籍已失效，请重新入仙府。'
        return
      }
      if (!this.roomCode) {
        this.message = '缺少仙府令。'
        return
      }
      this.loading = true
      try {
        this.room = await joinRoom({ roomCode: this.roomCode, userId: user.id })
        this.roomCode = this.room.roomCode
        saveCurrentRoomCode(this.roomCode)
        resetGameState()
        await this.enterStartedRoom()
      } catch (error) {
        this.message = error.message || '进入仙府失败。'
      } finally {
        this.loading = false
      }
    },
    async loadRoom () {
      if (!this.roomCode) return
      try {
        this.room = await getRoom(this.roomCode)
        await this.enterStartedRoom()
      } catch (error) {
        this.message = error.message || '仙府同步失败。'
      }
    },
    async enterStartedRoom () {
      const user = getSessionUser()
      const sessionId = this.room?.sessionId
      if (!user?.id || !sessionId || this.room.status !== 'PLAYING') return
      const gameState = await getAgentGameState(sessionId)
      const normalized = normalizeAgentGameState(gameState, user.id)
      saveCurrentAgentSessionId(normalized.sessionId)
      saveGameState(normalized)
      this.$router.push('/game')
    },
    async copyRoomCode () {
      try {
        await navigator.clipboard.writeText(this.roomCode)
        this.message = '仙府令已复制。'
      } catch (error) {
        this.message = `仙府令：${this.roomCode}`
      }
    }
  }
}
</script>
