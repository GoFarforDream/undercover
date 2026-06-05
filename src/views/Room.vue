<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <span class="eyebrow">房间 {{ roomCode || '创建中' }} · {{ countdown }}s</span>
        <h1>等待玩家加入</h1>
      </div>
      <button class="ghost-button" type="button" @click="$router.push('/home')">返回首页</button>
    </header>
    <section class="waiting-stage">
      <div class="waiting-portal">
        <div class="waiting-hero">
          <span class="eyebrow">Waiting room</span>
          <h2>{{ roomCode ? `房间 ${roomCode}` : '正在创建房间' }}</h2>
          <p>邀请玩家加入圆桌。倒计时结束后，空位会自动由智能体补齐；房主也可以随时立即开始。</p>
        </div>

        <div class="countdown-orb">
          <div>
            <strong>{{ countdown }}</strong>
            <span>秒后自动开始</span>
          </div>
        </div>

        <div class="waiting-actions">
          <button class="primary-button" type="button" :disabled="loading || !roomCode || !isOwner" @click="start">立即开始</button>
          <button class="ghost-button" type="button" :disabled="loading || !roomCode" @click="loadRoom">刷新房间</button>
          <button class="ghost-button" type="button" @click="$router.push('/agents')">设置智能体档案</button>
          <button class="ghost-button" type="button" @click="$router.push('/home')">返回首页</button>
        </div>

        <div v-if="roomCode" class="copy-box">
          <span>房号：{{ roomCode }}</span>
          <button type="button" @click="copyRoomCode">复制</button>
        </div>
        <p v-if="message" class="form-message">{{ message }}</p>
      </div>

      <aside class="waiting-side">
        <div class="room-card">
          <h2>开局设置</h2>
          <p class="modal-copy">手动填写词组会优先使用；留空则按难度生成。</p>
          <div class="settings-grid compact">
          <label class="setting-row">
            <span>玩家席位托管</span>
            <input v-model="settings.playerAsAgent" type="checkbox">
          </label>
          <label>
            智能体强度
            <select v-model="settings.agentLevel">
              <option>轻松</option>
              <option>标准</option>
              <option>高压</option>
            </select>
          </label>
          <label>
            词语难度
            <select v-model="settings.difficulty">
              <option v-for="difficulty in difficulties" :key="difficulty">{{ difficulty }}</option>
            </select>
          </label>
          <label>
            卧底数量
            <input v-model.number="settings.undercoverCount" min="1" max="3" type="number">
          </label>
          <label>
            白板数量
            <input v-model.number="settings.blankCount" disabled min="0" max="0" type="number">
          </label>
          <label>
            发言秒数
            <input v-model.number="settings.roundSeconds" min="30" max="180" step="10" type="number">
          </label>
          <label>
            平民词
            <input v-model.trim="settings.civilianWord" placeholder="留空则按难度生成">
          </label>
          <label>
            卧底词
            <input v-model.trim="settings.undercoverWord" placeholder="留空则按难度生成">
          </label>
          </div>
          <div class="action-row">
            <button class="ghost-button" type="button" :disabled="loading" @click="saveLocalSettings">保存设置</button>
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
  </main>
</template>

<script>
import { createRoom, getRoom, updateRoomSettings } from '../api/room'
import { startAgentGame } from '../api/game'
import { getCurrentRoomCode, getSeatProfiles, getSettings, normalizeAgentGameState, resetGameState, saveCurrentAgentSessionId, saveCurrentRoomCode, saveGameState, saveSettings } from '../store/game'
import { getSessionUser } from '../store/session'

export default {
  name: 'AgentSetup',
  data () {
    return {
      settings: getSettings(),
      room: null,
      roomCode: getCurrentRoomCode(),
      countdown: 120,
      timer: null,
      difficulties: ['炼气', '筑基', '金丹', '元婴', '化神', '洞虚', '大帝'],
      loading: false,
      message: ''
    }
  },
  computed: {
    seats () {
      return getSeatProfiles(this.settings)
    },
    roomSeats () {
      const roomSeats = (this.room?.players || []).map(player => ({
        key: `human-${player.userId}`,
        name: player.nickname,
        trait: `${player.owner ? '房主' : '真人玩家'} · ${player.seatNo}号位`
      }))
      const rest = Math.max(0, 6 - roomSeats.length)
      const agentSeats = this.seats.slice(1, rest + 1).map((seat, index) => ({
        key: `agent-${index}`,
        name: seat.name,
        trait: `${seat.trait} · 待补位`
      }))
      return roomSeats.concat(agentSeats)
    },
    isOwner () {
      const user = getSessionUser()
      return !this.room || this.room.ownerId === user?.id
    }
  },
  mounted () {
    this.ensureRoom()
    this.timer = setInterval(() => {
      if (this.countdown > 0) this.countdown -= 1
      if (this.roomCode && this.countdown > 0 && this.countdown % 5 === 0) this.loadRoom()
      if (this.countdown === 0 && this.isOwner && !this.loading) this.start()
    }, 1000)
  },
  beforeDestroy () {
    if (this.timer) clearInterval(this.timer)
  },
  methods: {
    roomSettingsPayload () {
      return {
        maxPlayers: 6,
        undercoverCount: this.settings.undercoverCount || 1,
        speechSeconds: 90,
        voteMode: 'PUBLIC',
        allowSpectator: false
      }
    },
    wordPairPayload () {
      const civilianWord = (this.settings.civilianWord || '').trim()
      const undercoverWord = (this.settings.undercoverWord || '').trim()
      if (!civilianWord && !undercoverWord) return null
      if (!civilianWord || !undercoverWord) {
        throw new Error('手动词组需要同时填写平民词和卧底词。')
      }
      return { civilianWord, undercoverWord }
    },
    async ensureRoom () {
      const user = getSessionUser()
      if (!user?.id) {
        this.message = '登录状态已失效，请重新登录。'
        return
      }
      if (this.roomCode) {
        await this.loadRoom()
        return
      }
      this.loading = true
      try {
        this.room = await createRoom({
          userId: user.id,
          settings: this.roomSettingsPayload()
        })
        this.roomCode = this.room.roomCode
        saveCurrentRoomCode(this.roomCode)
        this.message = '房间已创建，可复制房号邀请玩家。'
      } catch (error) {
        this.message = error.message || '创建房间失败。'
      } finally {
        this.loading = false
      }
    },
    async loadRoom () {
      if (!this.roomCode) return
      try {
        this.room = await getRoom(this.roomCode)
      } catch (error) {
        this.message = error.message || '房间加载失败。'
      }
    },
    saveLocalSettings () {
      saveSettings(this.settings)
      this.message = '设置已保存。'
    },
    async copyRoomCode () {
      try {
        await navigator.clipboard.writeText(this.roomCode)
        this.message = '房号已复制。'
      } catch (error) {
        this.message = `房号：${this.roomCode}`
      }
    },
    async start () {
      const user = getSessionUser()
      if (!user?.id) {
        this.message = '登录状态已失效，请重新登录。'
        return
      }
      saveSettings(this.settings)
      resetGameState()
      this.loading = true
      this.message = ''
      try {
        await updateRoomSettings(this.roomCode, this.roomSettingsPayload())
        const gameState = await startAgentGame({
          userId: user.id,
          roomCode: this.roomCode,
          maxPlayers: 6,
          agentCount: 5,
          undercoverCount: this.settings.undercoverCount || 1,
          agentNames: this.settings.agentNames || [],
          agentPersonalities: this.settings.agentPersonalities || [],
          difficulty: this.settings.difficulty || '炼气',
          wordPair: this.wordPairPayload()
        })
        const normalized = normalizeAgentGameState(gameState, user.id)
        saveCurrentAgentSessionId(normalized.sessionId)
        saveGameState(normalized)
        this.$router.push('/game')
      } catch (error) {
        this.message = error.message || '开局失败。'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
