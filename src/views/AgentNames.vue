<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <span class="eyebrow">智能体档案</span>
        <h1>设置智能体名字</h1>
      </div>
      <nav>
        <button class="ghost-button" type="button" @click="$router.push('/setup')">返回配置</button>
        <button class="ghost-button" type="button" @click="$router.push('/home')">返回首页</button>
      </nav>
    </header>

    <section class="agent-name-layout">
      <div class="room-card">
        <h2>5+1的卧底局</h2>
        <p class="modal-copy">玩家昵称只展示不可在此修改；下面 5 个智能体名字和性格会用于圆桌卡片、发言、投票和结算。</p>

        <label class="readonly-field">
          玩家昵称
          <input :value="playerName" disabled>
        </label>

        <div class="agent-name-grid">
          <label v-for="(name, index) in form.agentNames" :key="index">
            {{ labels[index] }}
            <input v-model.trim="form.agentNames[index]" :placeholder="defaults[index]">
          </label>
          <label v-for="(personality, index) in form.agentPersonalities" :key="`p-${index}`">
            {{ personalityLabels[index] }}
            <textarea v-model.trim="form.agentPersonalities[index]" rows="3" :placeholder="personalityDefaults[index]"></textarea>
          </label>
        </div>
        <div class="modal-actions">
          <button class="ghost-button" type="button" @click="resetNames">恢复默认</button>
          <button class="primary-button" type="button" @click="save">保存档案</button>
        </div>
        <p v-if="message" class="form-message">{{ message }}</p>
      </div>

      <div class="waiting-list">
        <article>
          {{ playerName }}
          <span>真人玩家 / 可托管</span>
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
      labels: ['智能体 Agent 01', '智能体 Agent 02', '智能体 Agent 03', '智能体 Agent 04', '智能体 Agent 05'],
      personalityLabels: ['Agent 01 性格', 'Agent 02 性格', 'Agent 03 性格', 'Agent 04 性格', 'Agent 05 性格'],
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
      this.message = '已恢复默认档案，保存后生效。'
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
      this.message = '已保存。下一局会使用新的智能体档案。'
    }
  }
}
</script>
