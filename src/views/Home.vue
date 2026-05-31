<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <span class="eyebrow">AI 对局中心</span>
        <h1>6 人智能体圆桌局</h1>
      </div>
      <nav>
        <button class="icon-button" title="设置" type="button" @click="settingsOpen = true">⚙</button>
        <button class="ghost-button" type="button" @click="logout">退出</button>
      </nav>
    </header>

    <section class="home-grid">
      <div class="play-panel">
        <p class="eyebrow">固定 6 人</p>
        <h2>玩家 + 5 个智能体</h2>
        <p>默认由你控制玩家席位，其余 5 个席位由智能体扮演。你也可以把玩家席位交给系统托管，观看整局自动推进。</p>
        <div class="action-row">
          <button class="primary-button" type="button" @click="startNewGame">开始新对局</button>
          <button class="ghost-button" type="button" @click="$router.push('/setup')">调整智能体</button>
          <button class="ghost-button" type="button" @click="$router.push('/agents')">智能体名字</button>
        </div>
      </div>

      <aside class="mission-panel">
        <h3>玩家常用</h3>
        <button type="button" @click="$router.push('/game')">继续上一局</button>
        <button type="button" @click="rulesOpen = true">查看规则</button>
        <button type="button" @click="agentOpen = true">智能体说明</button>
      </aside>
    </section>

    <section class="mode-grid">
      <article v-for="modeItem in modes" :key="modeItem.title" class="mode-card">
        <span>{{ modeItem.tag }}</span>
        <h3>{{ modeItem.title }}</h3>
        <p>{{ modeItem.desc }}</p>
      </article>
    </section>

    <game-modal v-model="settingsOpen">
      <settings-panel :settings="settings" @close="settingsOpen = false" @save="saveSettingsPanel" />
    </game-modal>
    <game-modal v-model="rulesOpen">
      <div class="modal-kicker">规则速览</div>
      <h2>描述相近词，找出异类</h2>
      <p class="modal-copy">固定 6 个席位分别拿到身份词。平民词与卧底词相近，白板没有词。每轮按顺序发言，再由真人或托管席位参与投票，直到平民或卧底阵营获胜。</p>
    </game-modal>
    <game-modal v-model="agentOpen">
      <div class="modal-kicker">卧底局说明</div>
      <h2>它们是你的 AI 对手</h2>
      <p class="modal-copy">Agent 会模拟真实玩家的发言风格：谨慎、推理、跟票、混淆或激进。你可以给 5 个固定智能体改名，让圆桌更像你自己的对局。</p>
    </game-modal>
  </main>
</template>

<script>
import GameModal from '../components/GameModal.vue'
import SettingsPanel from '../components/SettingsPanel.vue'
import { getSettings, resetGameState, saveSettings } from '../store/game'

export default {
  name: 'Home',
  components: { GameModal, SettingsPanel },
  data () {
    return {
      settingsOpen: false,
      rulesOpen: false,
      agentOpen: false,
      settings: getSettings(),
      modes: [
        { tag: '推荐', title: '5+1的卧底局', desc: '1 个玩家席位 + 5 个智能体，适合最快进入体验。' },
        { tag: '托管', title: '托管席位演算', desc: '把玩家席位交给系统托管，观察 6 个智能体和托管席位自动博弈。' },
        { tag: '训练', title: '推理压力局', desc: '智能体投票更主动，适合练习辨别话术漏洞。' }
      ]
    }
  },
  methods: {
    startNewGame () {
      resetGameState()
      this.$router.push('/game')
    },
    saveSettingsPanel (settings) {
      this.settings = settings
      saveSettings(settings)
      this.settingsOpen = false
    },
    logout () {
      localStorage.removeItem('undercover-auth')
      this.$router.push('/login')
    }
  }
}
</script>
