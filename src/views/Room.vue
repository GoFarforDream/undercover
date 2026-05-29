<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <span class="eyebrow">房间配置</span>
        <h1>创建你的游戏桌</h1>
      </div>
      <button class="ghost-button" type="button" @click="$router.push('/home')">返回大厅</button>
    </header>
    <section class="room-layout">
      <div class="room-card">
        <h2>房间 UC-0529</h2>
        <div class="copy-box">
          <span>{{ inviteText }}</span>
          <button type="button" @click="copied = true">复制</button>
        </div>
        <div class="settings-grid compact">
          <label>
            玩家人数
            <input v-model.number="settings.playerCount" min="4" max="12" type="number">
          </label>
          <label>
            卧底人数
            <input v-model.number="settings.undercoverCount" min="1" max="3" type="number">
          </label>
          <label>
            白板人数
            <input v-model.number="settings.blankCount" min="0" max="2" type="number">
          </label>
          <label>
            发言秒数
            <input v-model.number="settings.roundSeconds" min="30" max="180" step="10" type="number">
          </label>
        </div>
        <button class="primary-button full" type="button" @click="start">开始游戏</button>
        <p v-if="copied" class="form-message">邀请信息已准备好。</p>
      </div>
      <div class="waiting-list">
        <article v-for="player in players" :key="player"> {{ player }} <span>已准备</span></article>
      </div>
    </section>
  </main>
</template>

<script>
import { getSettings, saveSettings } from '../store/game'

export default {
  name: 'Room',
  data () {
    return {
      copied: false,
      settings: getSettings(),
      players: ['玩家 1', '玩家 2', '玩家 3', '玩家 4', '玩家 5', '玩家 6']
    }
  },
  computed: {
    inviteText () {
      return `房间号 UC-0529，${this.settings.playerCount} 人局`
    }
  },
  methods: {
    start () {
      saveSettings(this.settings)
      this.$router.push('/game')
    }
  }
}
</script>
