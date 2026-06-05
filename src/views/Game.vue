<template>
  <main class="game-page">
    <header class="topbar">
      <div>
        <span class="eyebrow">{{ state.matchId }} · {{ state.phase }}</span>
        <h1>第 {{ state.round }} 轮人机博弈</h1>
      </div>
      <nav>
        <button class="ghost-button" type="button" @click="wordOpen = true">查看词牌</button>
        <button class="icon-button" title="设置" type="button" @click="settingsOpen = true">⚙</button>
      </nav>
    </header>

    <section class="game-board">
      <aside class="identity-card">
        <span>{{ isHosted ? '托管席位' : '你的身份' }}</span>
        <h2>{{ state.myRole }}</h2>
        <p>{{ masked ? '点击查看你的词语' : state.myWord }}</p>
        <button class="primary-button" type="button" @click="masked = !masked">
          {{ masked ? '揭示词牌' : '隐藏词牌' }}
        </button>
      </aside>

      <div class="table-zone">
        <div class="table-center">
          <span>{{ state.phase }}</span>
          <strong>{{ activePlayer.name }}</strong>
          <small>{{ activePlayer.type === 'human' ? '轮到你发言' : '智能体思考中' }}</small>
        </div>
        <player-seat
          v-for="(player, index) in state.players"
          :key="player.id"
          :player="player"
          :position-style="seatStyle(index, state.players.length)"
        />
      </div>

      <aside class="round-panel">
        <h3>发言记录</h3>
        <p v-for="log in state.logs" :key="log">{{ log }}</p>
        <p v-if="!state.logs.length" class="modal-copy">暂无发言记录。</p>
        <p v-if="message" class="form-message">{{ message }}</p>
        <button class="ghost-button full" type="button" :disabled="loading || isFinished" @click="speakOpen = true">{{ isHosted ? '记录托管发言' : '记录我的发言' }}</button>
        <button class="primary-button full" type="button" :disabled="loading || isFinished" @click="agentSpeak">智能体自动发言</button>
      </aside>
    </section>

    <section class="vote-strip">
      <div v-for="vote in state.votes" :key="vote.name">
        <span>{{ vote.name }}</span>
        <strong>{{ vote.count }} 票</strong>
        <i :style="{ width: vote.count * 24 + '%' }"></i>
      </div>
      <button class="danger-button" type="button" :disabled="loading || isFinished" @click="voteOpen = true">{{ isHosted ? '托管席位投票' : '投出我的票' }}</button>
      <button class="ghost-button" type="button" :disabled="loading || isFinished" @click="agentVoteAndResolve">智能体投票并结算</button>
      <button class="ghost-button" type="button" :disabled="loading || isFinished" @click="nextRoundAction">下一轮</button>
      <button class="primary-button" type="button" @click="$router.push('/result')">查看结算</button>
    </section>

    <game-modal v-model="settingsOpen">
      <settings-panel :settings="settings" @close="settingsOpen = false" @save="saveSettingsPanel" />
    </game-modal>
    <game-modal v-model="wordOpen">
      <div class="modal-kicker">词牌确认</div>
      <h2>{{ state.myRole }} · {{ state.myWord }}</h2>
      <p class="modal-copy">{{ isHosted ? '你的席位已交给玩家托管席位，它会像其他智能体一样参与发言和投票。' : '只给你自己看。智能体不知道你的界面状态，只会根据发言与投票推断身份。' }}</p>
    </game-modal>
    <game-modal v-model="speakOpen">
      <div class="modal-kicker">{{ isHosted ? '托管发言' : '我的发言' }}</div>
      <h2>{{ isHosted ? '补充玩家托管席位的描述' : '补充一句你的描述' }}</h2>
      <textarea v-model="newLog" rows="4" placeholder="例如：这个东西通常会在早上出现。"></textarea>
      <p v-if="message" class="form-message">{{ message }}</p>
      <div class="modal-actions">
        <button class="ghost-button" type="button" @click="speakOpen = false">取消</button>
        <button class="primary-button" type="button" :disabled="loading" @click="addLog">提交</button>
      </div>
    </game-modal>
    <game-modal v-model="voteOpen">
      <div class="modal-kicker">投票</div>
      <h2>{{ isHosted ? '选择玩家托管席位的投票目标' : '选择你怀疑的智能体' }}</h2>
      <div class="vote-options">
        <button v-for="player in voteTargets" :key="player.id" type="button" @click="castVote(player)">
          {{ player.name }}
        </button>
      </div>
    </game-modal>
  </main>
</template>

<script>
import GameModal from '../components/GameModal.vue'
import PlayerSeat from '../components/PlayerSeat.vue'
import SettingsPanel from '../components/SettingsPanel.vue'
import { getCurrentAgentSessionId, getCurrentRoomCode, getGameState, getSettings, normalizeAgentGameState, normalizeBackendGameState, saveGameState, saveSettings } from '../store/game'
import { getAgentGameState, getGameStateApi, nextAgentRound, nextRound, resolveAgentRound, runAgentSpeech, runAgentVote, submitAgentSpeech, submitAgentVote, submitSpeech, submitVote } from '../api/game'
import { getSessionUser } from '../store/session'

export default {
  name: 'Game',
  components: { GameModal, PlayerSeat, SettingsPanel },
  data () {
    return {
      state: getGameState(),
      settings: getSettings(),
      masked: true,
      settingsOpen: false,
      wordOpen: false,
      speakOpen: false,
      voteOpen: false,
      loading: false,
      message: '',
      newLog: '',
      sessionId: getCurrentAgentSessionId(),
      roomCode: getCurrentRoomCode()
    }
  },
  computed: {
    isHosted () {
      return this.settings.playerAsAgent
    },
    activePlayer () {
      return this.state.players.find(player => player.speaking) || this.state.players[0]
    },
    voteTargets () {
      const user = getSessionUser()
      return this.state.players.filter(player => player.alive && player.id !== this.state.humanPlayerId && player.userId !== user?.id)
    },
    isFinished () {
      return this.state.rawPhase === 'FINISHED'
    }
  },
  mounted () {
    this.refreshState()
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
        this.message = error.message || '游戏状态加载失败。'
      }
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
        this.message = '缺少登录或房间信息。'
        return
      }
      this.loading = true
      this.message = ''
      try {
        if (this.sessionId) {
          const backendState = await submitAgentSpeech({
            sessionId: Number(this.sessionId),
            playerId: this.state.humanPlayerId,
            content: this.newLog.trim()
          })
          this.state = normalizeAgentGameState(backendState, user.id)
        } else {
          const backendState = await submitSpeech({
            roomCode: this.roomCode,
            userId: user.id,
            content: this.newLog.trim()
          })
          this.state = normalizeBackendGameState(backendState, user.id)
        }
        saveGameState(this.state)
        this.newLog = ''
        this.speakOpen = false
      } catch (error) {
        this.message = error.message || '发言提交失败。'
      } finally {
        this.loading = false
      }
    },
    async agentSpeak () {
      if (!this.sessionId) {
        this.message = '当前不是 Agent 对战会话。'
        return
      }
      const user = getSessionUser()
      this.loading = true
      this.message = '智能体正在生成发言...'
      try {
        const backendState = await runAgentSpeech(this.sessionId)
        this.state = normalizeAgentGameState(backendState, user?.id)
        saveGameState(this.state)
        this.message = '智能体已完成本轮发言。'
      } catch (error) {
        this.message = error.message || '智能体发言失败。'
      } finally {
        this.loading = false
      }
    },
    async castVote (player) {
      const user = getSessionUser()
      if (!user?.id || (!this.roomCode && !this.sessionId)) return
      this.loading = true
      this.message = ''
      try {
        if (this.sessionId) {
          const backendState = await submitAgentVote({
            sessionId: Number(this.sessionId),
            voterPlayerId: this.state.humanPlayerId,
            targetPlayerId: player.id,
            reason: '玩家手动投票'
          })
          this.state = normalizeAgentGameState(backendState, user.id)
        } else {
          const backendState = await submitVote({
            roomCode: this.roomCode,
            voterId: user.id,
            targetId: player.id
          })
          this.state = normalizeBackendGameState(backendState, user.id)
        }
        saveGameState(this.state)
        this.voteOpen = false
      } catch (error) {
        this.message = error.message || '投票失败。'
      } finally {
        this.loading = false
      }
    },
    async agentVoteAndResolve () {
      if (!this.sessionId) {
        this.message = '当前不是 Agent 对战会话。'
        return
      }
      const user = getSessionUser()
      this.loading = true
      this.message = '智能体正在投票并结算...'
      try {
        await runAgentVote(this.sessionId)
        const backendState = await resolveAgentRound(this.sessionId)
        this.state = normalizeAgentGameState(backendState, user?.id)
        saveGameState(this.state)
        this.message = this.state.rawPhase === 'FINISHED' ? '游戏已结束，可查看结算。' : '本轮已结算，可进入下一轮。'
      } catch (error) {
        this.message = error.message || '智能体投票或结算失败。'
      } finally {
        this.loading = false
      }
    },
    async nextRoundAction () {
      const user = getSessionUser()
      this.loading = true
      try {
        if (this.sessionId) {
          const backendState = await nextAgentRound(this.sessionId)
          this.state = normalizeAgentGameState(backendState, user?.id)
        } else if (this.roomCode) {
          const backendState = await nextRound(this.roomCode)
          this.state = normalizeBackendGameState(backendState, user?.id)
        }
        saveGameState(this.state)
      } catch (error) {
        this.message = error.message || '进入下一轮失败。'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
