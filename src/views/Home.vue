<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <span class="eyebrow">大厅在线</span>
        <h1>今晚谁是卧底</h1>
      </div>
      <nav>
        <button class="icon-button" title="设置" type="button" @click="settingsOpen = true">⚙</button>
        <button class="ghost-button" type="button" @click="logout">退出</button>
      </nav>
    </header>

    <section class="home-grid">
      <div class="play-panel">
        <p class="eyebrow">快速匹配</p>
        <h2>开一局轻量派对局</h2>
        <p>适合线下面杀或语音房。系统会分配身份词、记录发言、辅助投票与复盘。</p>
        <div class="action-row">
          <button class="primary-button" type="button" @click="$router.push('/room')">创建房间</button>
          <button class="ghost-button" type="button" @click="joinOpen = true">加入房间</button>
        </div>
      </div>

      <aside class="mission-panel">
        <h3>玩家习惯入口</h3>
        <button type="button" @click="$router.push('/game')">继续上一局</button>
        <button type="button" @click="rulesOpen = true">查看规则</button>
        <button type="button" @click="noticeOpen = true">赛季公告</button>
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
    <game-modal v-model="joinOpen">
      <div class="modal-kicker">加入房间</div>
      <h2>输入房间号</h2>
      <label>
        房间号
        <input v-model.trim="roomCode" placeholder="例如 UC-0529">
      </label>
      <div class="modal-actions">
        <button class="ghost-button" type="button" @click="joinOpen = false">取消</button>
        <button class="primary-button" type="button" @click="$router.push('/game')">加入</button>
      </div>
    </game-modal>
    <game-modal v-model="rulesOpen">
      <div class="modal-kicker">规则速览</div>
      <h2>描述相近词，找出异类</h2>
      <p class="modal-copy">每名玩家只知道自己的词。平民与卧底词相近，白板没有词。每轮依次发言，投票淘汰可疑玩家，直到一方胜利。</p>
    </game-modal>
    <game-modal v-model="noticeOpen">
      <div class="modal-kicker">赛季公告</div>
      <h2>新增投票复盘与语音开关</h2>
      <p class="modal-copy">本地演示版已加入设置面板、身份卡、投票进度、房间入口与结算复盘，适合课程展示和快速演示。</p>
    </game-modal>
  </main>
</template>

<script>
import GameModal from '../components/GameModal.vue'
import SettingsPanel from '../components/SettingsPanel.vue'
import { getSettings, saveSettings } from '../store/game'

export default {
  name: 'Home',
  components: { GameModal, SettingsPanel },
  data () {
    return {
      settingsOpen: false,
      joinOpen: false,
      rulesOpen: false,
      noticeOpen: false,
      roomCode: 'UC-0529',
      settings: getSettings(),
      modes: [
        { tag: '经典', title: '普通卧底局', desc: '一名卧底混入平民，适合 4-8 人快速开局。' },
        { tag: '进阶', title: '白板混战', desc: '加入白板身份，发言更刺激，也更考验临场编造。' },
        { tag: '派对', title: '语音轮盘', desc: '按顺序提醒发言，适合多人围坐或线上语音房。' }
      ]
    }
  },
  methods: {
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
