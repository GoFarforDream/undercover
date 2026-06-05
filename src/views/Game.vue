<template>
  <main class="game-page">
    <header class="topbar">
      <div>
        <span class="eyebrow">{{ state.matchId }} · {{ state.phase }}</span>
        <h1>穿越仙界：六大仙修圆桌斩魔</h1>
      </div>
      <nav>
        <button class="ghost-button" type="button" @click="wordOpen = true">查看灵契</button>
        <button class="icon-button" title="仙府法阵" type="button" @click="settingsOpen = true">⚙</button>
      </nav>
    </header>

    <section class="game-board">
      <aside class="identity-card">
        <span>{{ isHosted ? '托管仙位' : '你的仙魔身份' }}</span>
        <h2>{{ state.myRole }}</h2>
        <p>{{ masked ? '点击查看你的灵契' : state.myWord }}</p>
        <button class="primary-button" type="button" @click="masked = !masked">
          {{ masked ? '揭示灵契' : '隐藏灵契' }}
        </button>
      </aside>

      <div class="table-zone">
        <div class="table-center" :class="{ thinking: loading, deliberating: isAgentSpeaking }">
          <span>{{ state.phase }}</span>
          <strong>{{ activePlayer.name }}</strong>
          <small>{{ loading ? loadingHint : turnHint }}</small>
          <div v-if="isAgentSpeaking" class="thought-runes" aria-hidden="true">
            <i></i>
            <i></i>
            <i></i>
          </div>
        </div>
        <player-seat
          v-for="(player, index) in displayedPlayers"
          :key="player.id"
          :player="player"
          :position-style="seatStyle(index, displayedPlayers.length)"
        />
      </div>

      <aside class="round-panel" :class="{ collapsed: chatCollapsed }">
        <div class="panel-heading">
          <h3>陈词玉简</h3>
          <button class="icon-button" type="button" :title="chatCollapsed ? '展开玉简' : '收起玉简'" @click="chatCollapsed = !chatCollapsed">
            {{ chatCollapsed ? '+' : '-' }}
          </button>
        </div>
        <transition name="chat-fold">
          <div v-show="!chatCollapsed" class="round-panel-body">
            <p v-for="log in state.logs" :key="log">{{ log }}</p>
            <p v-if="!state.logs.length" class="modal-copy">暂无陈词玉简。</p>
            <p v-if="message" class="form-message">{{ message }}</p>
          </div>
        </transition>
      </aside>
    </section>

    <section class="speech-compose">
      <textarea
        v-model="newLog"
        rows="2"
        :disabled="loading || isFinished"
        :placeholder="canSpeak ? '道友，请在此陈词。' : '正在等待其他道友或先天之灵陈词。'"
        @keydown.ctrl.enter.prevent="addLog"
      ></textarea>
      <button class="primary-button" type="button" :disabled="loading || isFinished || !canSpeak || !newLog.trim()" @click="addLog">发言</button>
    </section>

    <section class="vote-strip">
      <div v-for="vote in state.votes" :key="vote.name">
        <span>{{ vote.name }}</span>
        <strong>{{ vote.count }} 道令</strong>
        <i :style="{ width: vote.count * 24 + '%' }"></i>
      </div>
      <button class="danger-button" type="button" :disabled="loading || isFinished || !canVote" @click="voteOpen = true">{{ isHosted ? '托管仙位执诛仙令' : '执我的诛仙令' }}</button>
      <button class="primary-button" type="button" @click="$router.push('/result')">查看仙魔终局</button>
    </section>

    <game-modal v-model="settingsOpen">
      <settings-panel :settings="settings" @close="settingsOpen = false" @save="saveSettingsPanel" />
    </game-modal>
    <game-modal v-model="wordOpen">
      <div class="modal-kicker">灵契确认</div>
      <h2>{{ state.myRole }} · {{ state.myWord }}</h2>
      <p class="modal-copy">{{ isHosted ? '你的仙位已交由托管灵处理，它会像其他先天之灵一样参与陈词与诛仙令。' : '只给你自己看。先天之灵不知道你的界面状态，只会根据陈词与诛仙令推断仙魔身份。' }}</p>
    </game-modal>
    <game-modal v-model="voteOpen">
      <div class="modal-kicker">诛仙令</div>
      <h2>{{ isHosted ? '选择托管仙位的执令目标' : '选择你怀疑的魔修' }}</h2>
      <div class="vote-options">
        <button v-for="player in voteTargets" :key="player.id" type="button" :disabled="loading" @click="castVote(player)">
          {{ player.name }}
        </button>
      </div>
    </game-modal>
    <loading-overlay
      :show="showLoadingOverlay"
      :title="loadingTitle"
      :description="loadingDescription"
    />
  </main>
</template>

<script>
import GameModal from '../components/GameModal.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import PlayerSeat from '../components/PlayerSeat.vue'
import SettingsPanel from '../components/SettingsPanel.vue'
import { getCurrentAgentSessionId, getCurrentRoomCode, getGameState, getSettings, normalizeAgentGameState, normalizeBackendGameState, saveGameState, saveSettings } from '../store/game'
import { getAgentGameState, getGameStateApi, submitAgentSpeech, submitAgentVote, submitSpeech, submitVote } from '../api/game'
import { getSessionUser } from '../store/session'

export default {
  name: 'Game',
  components: { GameModal, LoadingOverlay, PlayerSeat, SettingsPanel },
  data () {
    return {
      state: getGameState(),
      settings: getSettings(),
      masked: true,
      settingsOpen: false,
      wordOpen: false,
      voteOpen: false,
      chatCollapsed: true,
      loading: false,
      loadingAction: '',
      message: '',
      newLog: '',
      activeBubblePlayerId: null,
      activeBubbleText: '',
      bubbleTimer: null,
      agentThinking: false,
      thinkingCountdown: 0,
      thinkingTimer: null,
      pollTimer: null,
      sessionId: getCurrentAgentSessionId(),
      roomCode: getCurrentRoomCode()
    }
  },
  computed: {
    isHosted () {
      return this.settings.playerAsAgent
    },
    activePlayer () {
      if (this.activeBubblePlayerId) {
        return this.state.players.find(player => String(player.id) === String(this.activeBubblePlayerId)) || this.state.players[0]
      }
      return this.state.players.find(player => player.speaking) || this.state.players[0]
    },
    displayedPlayers () {
      return (this.state.players || []).map(player => ({
        ...player,
        speaking: this.activeBubblePlayerId ? String(player.id) === String(this.activeBubblePlayerId) : player.speaking,
        speechBubble: this.activeBubblePlayerId && String(player.id) === String(this.activeBubblePlayerId) ? this.activeBubbleText : ''
      }))
    },
    voteTargets () {
      const user = getSessionUser()
      return this.state.players.filter(player => player.alive && player.id !== this.state.humanPlayerId && player.userId !== user?.id)
    },
    isFinished () {
      return this.state.rawPhase === 'FINISHED'
    },
    isAgentSpeaking () {
      return this.loadingAction === 'agentSpeech' || this.loadingAction === 'agentThinking'
    },
    pendingPlayer () {
      const pendingId = this.state.rawPhase === 'VOTING' ? this.state.pendingVoterId : this.state.pendingSpeakerId
      return this.state.players.find(player => String(player.id) === String(pendingId))
    },
    canSpeak () {
      return this.state.rawPhase === 'SPEAKING' && this.pendingPlayer?.isMe
    },
    canVote () {
      return this.state.rawPhase === 'VOTING' && this.pendingPlayer?.isMe
    },
    turnHint () {
      if (!this.pendingPlayer) return this.state.rawPhase === 'VOTING' ? '等待诛仙令' : '等待圆桌推进'
      if (this.pendingPlayer.isMe) return this.state.rawPhase === 'VOTING' ? '轮到你执诛仙令' : '轮到你陈词'
      if (this.pendingPlayer.type === 'human') return `等待 ${this.pendingPlayer.name}，超时后先天之灵托管`
      return '先天之灵观星中'
    },
    showLoadingOverlay () {
      return this.loading && this.loadingAction !== 'agentSpeech' && this.loadingAction !== 'agentThinking'
    },
    loadingHint () {
      const hints = {
        speech: '正在刻入陈词',
        agentThinking: this.thinkingCountdown > 0 ? `先天之灵沉思中 ${this.thinkingCountdown}s` : '先天之灵沉思中',
        agentSpeech: '先天之灵观星中',
        vote: '正在执诛仙令',
        agentVote: '先天之灵执令斩魔中',
        nextRound: '正在开启下一轮仙缘'
      }
      return hints[this.loadingAction] || '正在同步仙府'
    },
    loadingTitle () {
      const titles = {
        speech: '正在刻入陈词',
        agentThinking: '先天之灵正在沉思',
        agentSpeech: '先天之灵正在陈词',
        vote: '正在执诛仙令',
        agentVote: '正在执令并斩魔',
        nextRound: '正在开启下一轮仙缘'
      }
      return titles[this.loadingAction] || '正在请求后端仙府'
    },
    loadingDescription () {
      const descriptions = {
        speech: '正在把你的陈词刻入本轮玉简。',
        agentThinking: this.thinkingCountdown > 0 ? `先天之灵正在推演局势，${this.thinkingCountdown} 秒后陈词。` : '先天之灵正在推演局势。',
        agentSpeech: 'Dify 先天之灵正在根据局势生成陈词。',
        vote: '正在登记你的诛仙令并刷新令数。',
        agentVote: '先天之灵正在执令，后端随后执行最高令斩魔。',
        nextRound: '正在清理本轮法阵并推进到下一轮仙缘。'
      }
      return descriptions[this.loadingAction] || '请稍等，仙魔圆桌正在同步状态。'
    }
  },
  mounted () {
    this.refreshState()
    this.pollTimer = window.setInterval(() => this.refreshState(), 3000)
  },
  beforeDestroy () {
    if (this.pollTimer) window.clearInterval(this.pollTimer)
    this.clearThinkingTimer()
    this.clearBubbleTimer()
  },
  methods: {
    async refreshState () {
      const user = getSessionUser()
      try {
        if (this.sessionId) {
          const backendState = await getAgentGameState(this.sessionId)
          this.state = normalizeAgentGameState(backendState, user?.id)
        } else if (this.roomCode) {
          const backendState = await getGameStateApi(this.roomCode)
          this.state = normalizeBackendGameState(backendState, user?.id)
        }
        saveGameState(this.state)
      } catch (error) {
        this.message = error.message || '仙魔局状态加载失败。'
      }
    },
    latestRoundSpeechByPlayer (state = this.state) {
      const session = state.raw?.session || {}
      const roundNo = session.round_no || state.round
      const speeches = state.raw?.speeches || []
      const result = {}
      speeches
        .filter(speech => String(speech.round_no) === String(roundNo))
        .forEach(speech => {
          result[String(speech.player_id)] = speech
        })
      return result
    },
    cleanBubbleText (text, speakerName) {
      let content = String(text || '')
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/\/+\s*$/g, '')
        .trim()
      if (speakerName) {
        content = content
          .replace(new RegExp(`^${this.escapeRegExp(speakerName)}\\s*[:：]\\s*`), '')
          .trim()
      }
      return content
    },
    escapeRegExp (text) {
      return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    },
    showOnlyBubble (playerId, text, duration = 10000) {
      this.clearBubbleTimer()
      this.activeBubblePlayerId = playerId
      this.activeBubbleText = text
      if (duration > 0) {
        this.bubbleTimer = window.setTimeout(() => {
          this.activeBubblePlayerId = null
          this.activeBubbleText = ''
          this.bubbleTimer = null
        }, duration)
      }
    },
    clearBubbleTimer () {
      if (this.bubbleTimer) {
        window.clearTimeout(this.bubbleTimer)
        this.bubbleTimer = null
      }
    },
    wait (ms) {
      return new Promise(resolve => window.setTimeout(resolve, ms))
    },
    playersAfterCurrentHuman () {
      const players = this.state.players || []
      const currentIndex = players.findIndex(player => String(player.id) === String(this.state.humanPlayerId))
      if (currentIndex < 0) return players
      return players.slice(currentIndex + 1).concat(players.slice(0, currentIndex))
    },
    seatStyle (index, total) {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / total
      const x = 50 + Math.cos(angle) * 38
      const y = 50 + Math.sin(angle) * 37
      return {
        left: `${x}%`,
        top: `${y}%`
      }
    },
    saveSettingsPanel (settings) {
      this.settings = settings
      saveSettings(settings)
      this.settingsOpen = false
    },
    async addLog () {
      if (!this.newLog.trim()) return
      const user = getSessionUser()
      if (!user?.id || (!this.roomCode && !this.sessionId)) {
        this.message = '缺少仙籍或仙府信息。'
        return
      }
      this.loading = true
      this.loadingAction = 'speech'
      this.message = ''
      const speechContent = this.newLog.trim()
      try {
        if (this.sessionId) {
          const backendState = await submitAgentSpeech({
            sessionId: Number(this.sessionId),
            playerId: this.state.humanPlayerId,
            content: speechContent
          })
          this.state = normalizeAgentGameState(backendState, user.id)
          saveGameState(this.state)
          this.newLog = ''
          this.showOnlyBubble(this.state.humanPlayerId, speechContent)
        } else {
          const backendState = await submitSpeech({
            roomCode: this.roomCode,
            userId: user.id,
            content: speechContent
          })
          this.state = normalizeBackendGameState(backendState, user.id)
          saveGameState(this.state)
          this.newLog = ''
          this.showOnlyBubble(user.id, speechContent)
        }
      } catch (error) {
        this.message = error.message || '陈词刻入失败。'
      } finally {
        this.loading = false
        this.loadingAction = ''
      }
    },
    pauseAgentThinking () {
      this.clearThinkingTimer()
      this.agentThinking = true
      this.thinkingCountdown = 5
      return new Promise(resolve => {
        this.thinkingTimer = window.setInterval(() => {
          this.thinkingCountdown -= 1
          if (this.thinkingCountdown <= 0) {
            this.clearThinkingTimer()
            resolve()
          }
        }, 1000)
      })
    },
    clearThinkingTimer () {
      if (this.thinkingTimer) {
        window.clearInterval(this.thinkingTimer)
        this.thinkingTimer = null
      }
      this.agentThinking = false
      this.thinkingCountdown = 0
    },
    async castVote (player) {
      const user = getSessionUser()
      if (!user?.id || (!this.roomCode && !this.sessionId)) return
      this.loading = true
      this.loadingAction = 'vote'
      this.message = ''
      try {
        if (this.sessionId) {
          const backendState = await submitAgentVote({
            sessionId: Number(this.sessionId),
            voterPlayerId: this.state.humanPlayerId,
            targetPlayerId: player.id,
            reason: '道友手动执诛仙令'
          })
          this.state = normalizeAgentGameState(backendState, user.id)
          saveGameState(this.state)
          this.voteOpen = false
        } else {
          const backendState = await submitVote({
            roomCode: this.roomCode,
            voterId: user.id,
            targetId: player.id
          })
          this.state = normalizeBackendGameState(backendState, user.id)
          saveGameState(this.state)
          this.voteOpen = false
        }
      } catch (error) {
        this.message = error.message || '诛仙令执令失败。'
      } finally {
        this.loading = false
        this.loadingAction = ''
      }
    }
  }
}
</script>
