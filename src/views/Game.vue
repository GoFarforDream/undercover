<template>
  <main class="game-page">
    <header class="topbar">
      <div>
        <span class="eyebrow">{{ state.roomCode }} · {{ state.phase }}</span>
        <h1>第 {{ state.round }} 轮发言</h1>
      </div>
      <nav>
        <button class="ghost-button" type="button" @click="wordOpen = true">查看词牌</button>
        <button class="icon-button" title="设置" type="button" @click="settingsOpen = true">⚙</button>
      </nav>
    </header>

    <section class="game-board">
      <aside class="identity-card">
        <span>我的身份</span>
        <h2>{{ state.myRole }}</h2>
        <p>{{ masked ? '点击查看你的词语' : state.myWord }}</p>
        <button class="primary-button" type="button" @click="masked = !masked">{{ masked ? '揭示词牌' : '隐藏词牌' }}</button>
      </aside>
      <div class="table-zone">
        <player-seat v-for="player in state.players" :key="player.id" :player="player" />
      </div>
      <aside class="round-panel">
        <h3>发言记录</h3>
        <p v-for="log in state.logs" :key="log">{{ log }}</p>
        <button class="ghost-button full" type="button" @click="speakOpen = true">记录发言</button>
      </aside>
    </section>

    <section class="vote-strip">
      <div v-for="vote in state.votes" :key="vote.name">
        <span>{{ vote.name }}</span>
        <strong>{{ vote.count }} 票</strong>
        <i :style="{ width: vote.count * 24 + '%' }"></i>
      </div>
      <button class="danger-button" type="button" @click="voteOpen = true">发起投票</button>
      <button class="primary-button" type="button" @click="$router.push('/result')">结算本局</button>
    </section>

    <game-modal v-model="settingsOpen">
      <settings-panel :settings="settings" @close="settingsOpen = false" @save="saveSettingsPanel" />
    </game-modal>
    <game-modal v-model="wordOpen">
      <div class="modal-kicker">词牌确认</div>
      <h2>{{ state.myRole }} · {{ state.myWord }}</h2>
      <p class="modal-copy">只给自己看。发言时描述特征，别直接说出词语。</p>
    </game-modal>
    <game-modal v-model="speakOpen">
      <div class="modal-kicker">发言记录</div>
      <h2>补充一句发言</h2>
      <textarea v-model="newLog" rows="4" placeholder="例如：这个东西适合聚会时一起用。"></textarea>
      <div class="modal-actions">
        <button class="ghost-button" type="button" @click="speakOpen = false">取消</button>
        <button class="primary-button" type="button" @click="addLog">保存</button>
      </div>
    </game-modal>
    <game-modal v-model="voteOpen">
      <div class="modal-kicker">投票</div>
      <h2>选择最可疑的玩家</h2>
      <div class="vote-options">
        <button v-for="player in alivePlayers" :key="player.id" type="button" @click="castVote(player)">{{ player.name }}</button>
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
      newLog: ''
    }
  },
  computed: {
    alivePlayers () {
      return this.state.players.filter(player => player.alive)
    }
  },
  methods: {
    saveSettingsPanel (settings) {
      this.settings = settings
      saveSettings(settings)
      this.settingsOpen = false
    },
    addLog () {
      if (!this.newLog.trim()) return
      this.state.logs.unshift(`我：${this.newLog.trim()}`)
      saveGameState(this.state)
      this.newLog = ''
      this.speakOpen = false
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
