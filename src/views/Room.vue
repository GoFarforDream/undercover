<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <span class="eyebrow">仙府 {{ roomCode || '凝聚中' }} · {{ countdown }}s</span>
        <h1>穿越仙界：六大仙修圆桌斩魔</h1>
      </div>
      <button class="ghost-button" type="button" @click="$router.push('/home')">返回仙府首页</button>
    </header>
    <section class="waiting-stage">
      <div class="waiting-portal">
        <div class="waiting-hero">
          <span class="eyebrow">Immortal mansion</span>
          <h2>{{ roomCode ? `仙府 ${roomCode}` : '正在凝聚仙府' }}</h2>
        <p>邀道友同入圆桌。当前 {{ currentPlayers }} / {{ maxPlayers }} 位仙友已入府；倒计时结束后，空缺仙位会由先天之灵补齐。</p>
        </div>

        <div class="countdown-orb">
          <div>
            <strong>{{ countdown }}</strong>
            <span>秒后自动开启仙缘</span>
          </div>
        </div>

        <div class="waiting-actions">
          <button class="primary-button" type="button" :disabled="loading || !roomCode || !isOwner" @click="start">开启仙缘</button>
          <button class="ghost-button" type="button" :disabled="loading || !roomCode" @click="loadRoom(true)">刷新仙府</button>
          <button class="ghost-button" type="button" @click="$router.push('/agents')">设置先天之灵名册</button>
          <button class="ghost-button" type="button" @click="$router.push('/home')">返回仙府首页</button>
        </div>

        <div v-if="roomCode" class="copy-box">
          <span>仙府令：{{ roomCode }}</span>
          <button type="button" @click="copyRoomCode">复制</button>
        </div>
        <div class="room-count-grid host-count-grid">
          <article>
            <span>当前人数</span>
            <strong>{{ currentPlayers }}</strong>
          </article>
          <article>
            <span>仙府上限</span>
            <strong>{{ maxPlayers }}</strong>
          </article>
          <article>
            <span>剩余补位</span>
            <strong>{{ remainingSeats }}</strong>
          </article>
        </div>
        <p v-if="message" class="form-message">{{ message }}</p>
      </div>

      <aside class="waiting-side">
        <div class="room-card">
          <h2>仙府法阵</h2>
          <p class="modal-copy">{{ wordModeDescription }}</p>
          <div class="settings-grid compact">
          <label class="setting-row">
            <span>道友仙位托管</span>
            <input v-model="settings.playerAsAgent" type="checkbox">
          </label>
          <label>
            先天之灵修为
            <select v-model="settings.agentLevel">
              <option>清修</option>
              <option>问道</option>
              <option>斩魔</option>
            </select>
          </label>
          <label>
            选词模式
            <select v-model="settings.wordMode">
              <option v-for="mode in wordModes" :key="mode.value" :value="mode.value">{{ mode.label }}</option>
            </select>
          </label>
          <label v-if="settings.wordMode === 'HEAVEN'">
            灵契难度
            <select v-model="settings.difficulty">
              <option v-for="difficulty in difficulties" :key="difficulty">{{ difficulty }}</option>
            </select>
          </label>
          <label v-if="settings.wordMode === 'ADVENTURE'">
            秘境关卡
            <select v-model.number="settings.adventureLevelId">
              <option v-for="level in adventureLevels" :key="level.id" :value="level.id">{{ level.name }}</option>
            </select>
          </label>
          <label>
            魔修数量
            <input v-model.number="settings.undercoverCount" min="1" max="3" type="number">
          </label>
          <label>
            散修数量
            <input v-model.number="settings.blankCount" disabled min="0" max="0" type="number">
          </label>
          <label>
            陈词秒数
            <input v-model.number="settings.roundSeconds" min="30" max="180" step="10" type="number">
          </label>
          <label v-if="settings.wordMode === 'CUSTOM'">
            仙修词
            <input v-model.trim="settings.civilianWord" placeholder="府主填写仙修词">
          </label>
          <label v-if="settings.wordMode === 'CUSTOM'">
            魔修词
            <input v-model.trim="settings.undercoverWord" placeholder="府主填写魔修词">
          </label>
          </div>
          <div class="action-row">
            <button class="ghost-button" type="button" :disabled="loading" @click="saveLocalSettings">保存仙府法阵</button>
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
      :title="loadingTitle"
      :description="loadingDescription"
    />
  </main>
</template>

<script>
import LoadingOverlay from '../components/LoadingOverlay.vue'
import { createRoom, getRoom, updateRoomSettings } from '../api/room'
import { getAgentGameState, startAgentGame } from '../api/game'
import { getCurrentRoomCode, getSeatProfiles, getSettings, normalizeAgentGameState, resetGameState, saveCurrentAgentSessionId, saveCurrentRoomCode, saveGameState, saveSettings } from '../store/game'
import { getSessionUser } from '../store/session'

export default {
  name: 'AgentSetup',
  components: { LoadingOverlay },
  data () {
    return {
      settings: getSettings(),
      room: null,
      roomCode: this.$route.query.roomCode || getCurrentRoomCode(),
      countdown: 120,
      timer: null,
      wordModes: [
        { value: 'HEAVEN', label: '天道降契' },
        { value: 'CUSTOM', label: '府主自填' },
        { value: 'ADVENTURE', label: '秘境探险' }
      ],
      difficulties: ['炼气', '筑基', '金丹', '元婴', '化神', '渡劫', '大帝'],
      loading: false,
      loadingAction: '',
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
        trait: `${player.owner ? '府主' : '真人道友'} · 第 ${player.seatNo} 仙位`
      }))
      const rest = Math.max(0, this.maxPlayers - roomSeats.length)
      const agentSeats = this.seats.slice(1, rest + 1).map((seat, index) => ({
        key: `agent-${index}`,
        name: seat.name,
        trait: `${seat.trait} · 待入定`
      }))
      return roomSeats.concat(agentSeats)
    },
    currentPlayers () {
      return this.room?.players?.length || 0
    },
    maxPlayers () {
      return this.room?.settings?.maxPlayers || 6
    },
    remainingSeats () {
      return Math.max(0, this.maxPlayers - this.currentPlayers)
    },
    isOwner () {
      const user = getSessionUser()
      return !this.room || this.room.ownerId === user?.id
    },
    adventureLevels () {
      return Array.from({ length: 100 }, (_, index) => {
        const levelNo = index + 1
        const realm = this.realmByLevel(levelNo)
        return {
          id: levelNo,
          name: `第 ${levelNo} 关 · ${realm}`
        }
      })
    },
    loadingTitle () {
      const titles = {
        create: '正在凝聚仙府',
        refresh: '正在刷新仙府',
        start: '正在开启仙缘'
      }
      return titles[this.loadingAction] || '正在请求后端'
    },
    loadingDescription () {
      const descriptions = {
        create: '正在登记府主与仙位。',
        refresh: '正在同步最新入府的真人道友。',
        start: '正在补齐先天之灵、分配灵契并开启仙魔圆桌局。'
      }
      return descriptions[this.loadingAction] || '请稍等，圆桌正在同步状态。'
    },
    wordModeDescription () {
      const map = {
        HEAVEN: '天道降契会按修为境界生成灵契。',
        CUSTOM: '府主自填需要同时填写仙修词和魔修词。',
        ADVENTURE: '秘境探险会从所选关卡的固定词库中抽取灵契。'
      }
      return map[this.settings.wordMode] || map.HEAVEN
    }
  },
  mounted () {
    this.ensureRoom()
    this.timer = setInterval(() => {
      if (this.countdown > 0) this.countdown -= 1
      if (this.roomCode && this.countdown > 0 && this.countdown % 2 === 0) this.loadRoom()
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
        allowSpectator: false,
        wordMode: this.settings.wordMode || 'HEAVEN',
        adventureLevelId: this.settings.wordMode === 'ADVENTURE' ? (this.settings.adventureLevelId || 1) : null
      }
    },
    wordPairPayload () {
      if (this.settings.wordMode !== 'CUSTOM') return null
      const civilianWord = (this.settings.civilianWord || '').trim()
      const undercoverWord = (this.settings.undercoverWord || '').trim()
      if (!civilianWord || !undercoverWord) {
        throw new Error('手动灵契需要同时填写仙修词和魔修词。')
      }
      return { civilianWord, undercoverWord }
    },
    realmByLevel (levelNo) {
      if (levelNo <= 15) return '炼气'
      if (levelNo <= 30) return '筑基'
      if (levelNo <= 45) return '金丹'
      if (levelNo <= 60) return '元婴'
      if (levelNo <= 75) return '化神'
      if (levelNo <= 90) return '渡劫'
      return '大帝'
    },
    async ensureRoom () {
      const user = getSessionUser()
      if (!user?.id) {
        this.message = '仙籍已失效，请重新入仙府。'
        return
      }
      const routeRoomCode = this.$route.query.roomCode
      if (routeRoomCode) {
        this.$router.replace({ path: '/join-waiting', query: { roomCode: routeRoomCode } })
        return
      }
      if (this.roomCode) {
        await this.loadRoom(true)
        return
      }
      this.loading = true
      this.loadingAction = 'create'
      try {
        this.room = await createRoom({
          userId: user.id,
          settings: this.roomSettingsPayload()
        })
        this.roomCode = this.room.roomCode
        saveCurrentRoomCode(this.roomCode)
        this.message = '仙府已凝聚，可复制仙府令邀请道友。'
      } catch (error) {
        this.message = error.message || '凝聚仙府失败。'
      } finally {
        this.loading = false
        this.loadingAction = ''
      }
    },
    async loadRoom (showBusy = false) {
      if (!this.roomCode) return
      if (showBusy) {
        this.loading = true
        this.loadingAction = 'refresh'
      }
      try {
        this.room = await getRoom(this.roomCode)
        await this.enterStartedRoom()
      } catch (error) {
        this.message = error.message || '仙府加载失败。'
      } finally {
        if (showBusy) {
          this.loading = false
          this.loadingAction = ''
        }
      }
    },
    async enterStartedRoom () {
      const user = getSessionUser()
      const sessionId = this.room?.sessionId
      if (!user?.id || !sessionId || this.room.status !== 'PLAYING') return false
      const gameState = await getAgentGameState(sessionId)
      const normalized = normalizeAgentGameState(gameState, user.id)
      saveCurrentAgentSessionId(normalized.sessionId)
      saveGameState(normalized)
      this.goGame()
      return true
    },
    goGame () {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
      if (this.$route.path !== '/game') {
        this.$router.push('/game')
      }
    },
    saveLocalSettings () {
      saveSettings(this.settings)
      this.message = '仙府法阵已保存。'
    },
    async copyRoomCode () {
      try {
        await navigator.clipboard.writeText(this.roomCode)
        this.message = '仙府令已复制。'
      } catch (error) {
        this.message = `仙府令：${this.roomCode}`
      }
    },
    async start () {
      const user = getSessionUser()
      if (!user?.id) {
        this.message = '仙籍已失效，请重新入仙府。'
        return
      }
      saveSettings(this.settings)
      resetGameState()
      this.loading = true
      this.loadingAction = 'start'
      this.message = ''
      try {
        await updateRoomSettings(this.roomCode, this.roomSettingsPayload())
        const gameState = await startAgentGame({
          userId: user.id,
          roomCode: this.roomCode,
          maxPlayers: 6,
          agentCount: 5,
          undercoverCount: this.settings.undercoverCount || 1,
          playerAsAgent: Boolean(this.settings.playerAsAgent),
          agentNames: this.settings.agentNames || [],
          agentPersonalities: this.settings.agentPersonalities || [],
          difficulty: this.settings.difficulty || '炼气',
          wordMode: this.settings.wordMode || 'HEAVEN',
          adventureLevelId: this.settings.wordMode === 'ADVENTURE' ? (this.settings.adventureLevelId || 1) : null,
          wordPair: this.wordPairPayload()
        })
        const normalized = normalizeAgentGameState(gameState, user.id)
        saveCurrentAgentSessionId(normalized.sessionId)
        saveGameState(normalized)
        this.goGame()
      } catch (error) {
        this.message = error.message || '开启仙缘失败。'
      } finally {
        this.loading = false
        this.loadingAction = ''
      }
    }
  }
}
</script>
