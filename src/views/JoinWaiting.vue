<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <span class="eyebrow">房间 {{ roomCode || '加入中' }}</span>
        <h1>等待房主开局</h1>
      </div>
      <button class="ghost-button" type="button" @click="$router.push('/home')">返回房间首页</button>
    </header>

    <section class="waiting-stage join-waiting-stage">
      <div class="waiting-portal join-waiting-portal">
        <div class="waiting-hero">
          <span class="eyebrow">Joined room</span>
          <h2>{{ ownerName ? `已加入房主：${ownerName}` : '正在匹配房主' }}</h2>
          <p>你已进入同一房间。请等待房主开启游戏，开局后会自动进入同一场谁是卧底对局。</p>
        </div>

        <div class="join-waiting-status">
          <strong>等待房主开局</strong>
          <span>{{ playerCountText }}</span>
        </div>

        <div v-if="roomCode" class="copy-box">
          <span>房间码：{{ roomCode }}</span>
          <button type="button" @click="copyRoomCode">复制</button>
        </div>
        <p v-if="message" class="form-message">{{ message }}</p>
      </div>

      <aside class="waiting-side">
        <div class="room-card">
          <h2>当前房间</h2>
          <p class="modal-copy">房主开启游戏后，所有已加入的真人玩家会进入同一局，剩余席位由 Agent 补齐。</p>
          <div class="room-count-grid">
            <article>
              <span>当前人数</span>
              <strong>{{ currentPlayers }}</strong>
            </article>
            <article>
              <span>房间上限</span>
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
      title="正在进入房间"
      description="正在同步房主、席位和开局状态。"
    />
  </main>
</template>

<script>
import LoadingOverlay from '../components/LoadingOverlay.vue'
import { getRoom, joinRoom } from '../api/room'
import { getAgentGameState } from '../api/game'
import {
  getSeatProfiles,
  getSettings,
  normalizeAgentGameState,
  resetGameState,
  saveCurrentAgentSessionId,
  saveCurrentRoomCode,
  saveGameState
} from '../store/game'
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
      return `${this.currentPlayers} / ${this.maxPlayers} 位玩家已加入`
    },
    ownerName () {
      return (this.room?.players || []).find(player => player.owner)?.nickname || ''
    },
    roomSeats () {
      const humanSeats = (this.room?.players || []).map(player => ({
        key: `human-${player.userId}`,
        name: player.nickname,
        trait: `${player.owner ? '房主' : '真人玩家'} · 第 ${player.seatNo} 位`
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
        this.message = '登录状态已失效，请重新登录后加入房间。'
        return
      }
      if (!this.roomCode) {
        this.message = '缺少房间码。'
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
        this.message = error.message || '进入房间失败。'
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
        this.message = error.message || '房间状态同步失败。'
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
      this.goGame()
    },
    goGame () {
      if (this.timer) {
        window.clearInterval(this.timer)
        this.timer = null
      }
      if (this.$route.path !== '/game') {
        this.$router.push('/game')
      }
    },
    async copyRoomCode () {
      try {
        await navigator.clipboard.writeText(this.roomCode)
        this.message = '房间码已复制。'
      } catch (error) {
        this.message = `房间码：${this.roomCode}`
      }
    }
  }
}
</script>
