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
        <button class="ghost-button full" type="button" @click="speakOpen = true">{{ isHosted ? '记录托管发言' : '记录我的发言' }}</button>
        <button class="primary-button full" type="button" @click="agentSpeak">让智能体继续发言</button>
      </aside>
    </section>

    <section class="vote-strip">
      <div v-for="vote in state.votes" :key="vote.name">
        <span>{{ vote.name }}</span>
        <strong>{{ vote.count }} 票</strong>
        <i :style="{ width: vote.count * 24 + '%' }"></i>
      </div>
      <button class="danger-button" type="button" @click="voteOpen = true">{{ isHosted ? '托管席位投票' : '投出我的票' }}</button>
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
      <div class="modal-actions">
        <button class="ghost-button" type="button" @click="speakOpen = false">取消</button>
        <button class="primary-button" type="button" @click="addLog">保存</button>
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
import { getGameState, getSettings, saveGameState, saveSettings } from '../store/game'

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
      newLog: '',
      agentLines: [
        'Agent 01：这个词和饮品有关，但我不想说得太具体。',
        'Agent 03：我同意它常见于休息场景，不过 Agent 01 有点保守。',
        'Agent 05：我倾向怀疑描述太泛的人，尤其是一直绕开味道的人。',
        'Agent 02：目前信息里，卧底更可能在 Agent 01 和 Agent 03 之间。'
      ]
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
      return this.state.players.filter(player => player.alive && player.name !== this.state.players[0].name)
    }
  },
  methods: {
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
    addLog () {
      if (!this.newLog.trim()) return
      const speaker = this.isHosted ? this.state.players[0].name : '你'
      this.state.logs.unshift(`${speaker}：${this.newLog.trim()}`)
      saveGameState(this.state)
      this.newLog = ''
      this.speakOpen = false
    },
    agentSpeak () {
      const line = this.agentLines[this.state.logs.length % this.agentLines.length]
      this.state.logs.unshift(line)
      this.state.phase = '智能体推理阶段'
      saveGameState(this.state)
    },
    castVote (player) {
      const target = this.state.votes.find(vote => vote.name === player.name)
      if (target) target.count += 1
      else this.state.votes.push({ name: player.name, count: 1 })
      saveGameState(this.state)
      this.voteOpen = false
    }
  }
}
</script>
