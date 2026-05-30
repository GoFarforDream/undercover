<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <span class="eyebrow">智能体配置</span>
        <h1>固定 6 人圆桌</h1>
      </div>
      <button class="ghost-button" type="button" @click="$router.push('/home')">返回首页</button>
    </header>
    <section class="room-layout">
      <div class="room-card">
        <h2>人机局参数</h2>
        <p class="modal-copy">每局固定 6 个席位：默认是你加 5 个智能体，也可以把你的席位交给智能体托管。</p>
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
            卧底数量
            <input v-model.number="settings.undercoverCount" min="1" max="3" type="number">
          </label>
          <label>
            白板数量
            <input v-model.number="settings.blankCount" min="0" max="2" type="number">
          </label>
          <label>
            发言秒数
            <input v-model.number="settings.roundSeconds" min="30" max="180" step="10" type="number">
          </label>
        </div>
        <div class="action-row">
          <button class="primary-button" type="button" @click="start">开始人机对局</button>
          <button class="ghost-button" type="button" @click="$router.push('/agents')">设置智能体名字</button>
        </div>
      </div>
      <div class="waiting-list">
        <article v-for="seat in seats" :key="seat.name">
          {{ seat.name }}
          <span>{{ seat.trait }}</span>
        </article>
      </div>
    </section>
  </main>
</template>

<script>
import { getSeatProfiles, getSettings, resetGameState, saveSettings } from '../store/game'

export default {
  name: 'AgentSetup',
  data () {
    return {
      settings: getSettings()
    }
  },
  computed: {
    seats () {
      return getSeatProfiles(this.settings)
    }
  },
  methods: {
    start () {
      saveSettings(this.settings)
      resetGameState()
      this.$router.push('/game')
    }
  }
}
</script>
