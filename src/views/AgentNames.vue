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
        <h2>玩家 + 5 个智能体</h2>
        <p class="modal-copy">玩家昵称只展示不可修改；下面 5 个智能体名字会用于圆桌卡片、发言、投票和结算。</p>

        <label class="readonly-field">
          玩家昵称
          <input :value="playerName" disabled>
        </label>

        <div class="agent-name-grid">
          <label v-for="(name, index) in form.agentNames" :key="index">
            {{ labels[index] }}
            <input v-model.trim="form.agentNames[index]" :placeholder="defaults[index]">
          </label>
        </div>
        <div class="modal-actions">
          <button class="ghost-button" type="button" @click="resetNames">恢复默认</button>
          <button class="primary-button" type="button" @click="save">保存名字</button>
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
          <span>{{ previewTraits[index] }}</span>
        </article>
      </div>
    </section>
  </main>
</template>

<script>
import { defaultAgentNames, getPlayerName, getSettings, resetGameState, saveSettings } from '../store/game'

export default {
  name: 'AgentNames',
  data () {
    const settings = getSettings()
    return {
      playerName: getPlayerName(),
      form: {
        ...settings,
        agentNames: [...settings.agentNames]
      },
      defaults: defaultAgentNames,
      labels: ['智能体 Agent 01', '智能体 Agent 02', '智能体 Agent 03', '智能体 Agent 04', '智能体 Agent 05'],
      previewTraits: ['谨慎型', '推理型', '跟票型', '混淆型', '激进型'],
      message: ''
    }
  },
  computed: {
    normalizedNames () {
      return this.defaults.map((name, index) => this.form.agentNames[index] || name)
    }
  },
  methods: {
    resetNames () {
      this.form.agentNames = [...this.defaults]
      this.message = '已恢复默认名字，保存后生效。'
    },
    save () {
      const names = this.normalizedNames.map(name => name.slice(0, 14))
      saveSettings({
        ...this.form,
        agentNames: names
      })
      resetGameState()
      this.form.agentNames = [...names]
      this.message = '已保存。下一局会使用新的智能体名字。'
    }
  }
}
</script>
