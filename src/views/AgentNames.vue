<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <span class="eyebrow">先天之灵名册</span>
        <h1>穿越仙界：六大仙修圆桌斩魔</h1>
      </div>
      <nav>
        <button class="ghost-button" type="button" @click="$router.push('/setup')">返回仙府法阵</button>
        <button class="ghost-button" type="button" @click="$router.push('/home')">返回仙府首页</button>
      </nav>
    </header>

    <section class="agent-name-layout">
      <div class="room-card">
        <h2>五位先天之灵与一位道友</h2>
        <p class="modal-copy">道友仙名只展示不可在此修改；下面五位先天之灵的名号和性格会用于圆桌卡片、陈词、诛仙令和终局卷轴。</p>

        <label class="readonly-field">
          道友仙名
          <input :value="playerName" disabled>
        </label>

        <div class="agent-card-grid">
          <article v-for="index in 5" :key="index" class="agent-edit-card">
            <div>
              <span>{{ labels[index - 1] }}</span>
              <strong>{{ normalizedNames[index - 1] }}</strong>
            </div>
            <label>
              名号
              <input v-model.trim="form.agentNames[index - 1]" :placeholder="defaults[index - 1]">
            </label>
            <label>
              性格
              <textarea v-model.trim="form.agentPersonalities[index - 1]" rows="3" :placeholder="personalityDefaults[index - 1]"></textarea>
            </label>
          </article>
        </div>
        <div class="modal-actions">
          <button class="ghost-button" type="button" @click="resetNames">恢复默认先天之灵</button>
          <button class="primary-button" type="button" @click="save">保存先天之灵名册</button>
        </div>
        <p v-if="message" class="form-message">{{ message }}</p>
      </div>

      <div class="waiting-list">
        <article>
          {{ playerName }}
          <span>真人道友 / 可托管仙位</span>
        </article>
        <article v-for="(name, index) in normalizedNames" :key="index">
          {{ name }}
          <span>{{ normalizedPersonalities[index] }}</span>
        </article>
      </div>
    </section>
  </main>
</template>

<script>
import { defaultAgentNames, defaultAgentPersonalities, getPlayerName, getSettings, resetGameState, saveSettings } from '../store/game'

export default {
  name: 'AgentNames',
  data () {
    const settings = getSettings()
    return {
      playerName: getPlayerName(),
      form: {
        ...settings,
        agentNames: [...settings.agentNames],
        agentPersonalities: [...settings.agentPersonalities]
      },
      defaults: defaultAgentNames,
      personalityDefaults: defaultAgentPersonalities,
      labels: ['先天之灵 01', '先天之灵 02', '先天之灵 03', '先天之灵 04', '先天之灵 05'],
      message: ''
    }
  },
  computed: {
    normalizedNames () {
      return this.defaults.map((name, index) => this.form.agentNames[index] || name)
    },
    normalizedPersonalities () {
      return this.personalityDefaults.map((personality, index) => this.form.agentPersonalities[index] || personality)
    }
  },
  methods: {
    resetNames () {
      this.form.agentNames = [...this.defaults]
      this.form.agentPersonalities = [...this.personalityDefaults]
      this.message = '已恢复默认先天之灵名册，保存后生效。'
    },
    save () {
      const names = this.normalizedNames.map(name => name.slice(0, 14))
      const personalities = this.normalizedPersonalities.map(personality => personality.slice(0, 120))
      saveSettings({
        ...this.form,
        agentNames: names,
        agentPersonalities: personalities
      })
      resetGameState()
      this.form.agentNames = [...names]
      this.form.agentPersonalities = [...personalities]
      this.message = '已保存。下一局仙魔圆桌会使用新的先天之灵名册。'
    }
  }
}
</script>
