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
          <button class="primary-button" type="button" :disabled="loading" @click="startNewGame">开始智能体对局</button>
          <button class="ghost-button" type="button" @click="$router.push('/setup')">调整对局</button>
          <button class="ghost-button" type="button" @click="$router.push('/agents')">智能体名字</button>
        </div>
        <p v-if="message" class="form-message">{{ message }}</p>
      </div>

      <aside class="mission-panel">
        <h3>玩家常用</h3>
        <input v-model.trim="joinCode" placeholder="输入 6 位房号">
        <button type="button" :disabled="loading" @click="joinExistingRoom">加入普通房间</button>
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

    <section class="mode-grid" v-if="rooms.length">
      <article v-for="room in rooms" :key="room.roomCode" class="mode-card">
        <span>{{ room.status }}</span>
        <h3>房间 {{ room.roomCode }}</h3>
        <p>{{ room.players.length }} / {{ room.settings.maxPlayers }} 人 · {{ room.settings.speechSeconds }} 秒发言</p>
        <button class="ghost-button" type="button" @click="joinRoomCard(room.roomCode)">进入房间</button>
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
import { joinRoom, listRooms } from '../api/room'
import { getSettings, resetCurrentGamePointers, resetGameState, saveCurrentRoomCode, saveSettings } from '../store/game'
import { clearSession, getSessionUser } from '../store/session'

export default {
  name: 'Home',
  components: { GameModal, SettingsPanel },
  data () {
    return {
      settingsOpen: false,
      rulesOpen: false,
      agentOpen: false,
      loading: false,
      message: '',
      joinCode: '',
      rooms: [],
      settings: getSettings(),
      modes: [
        { tag: '推荐', title: '5+1的卧底局', desc: '1 个玩家席位 + 5 个智能体，适合最快进入体验。' },
        { tag: '托管', title: '托管席位演算', desc: '把玩家席位交给系统托管，观察 6 个智能体和托管席位自动博弈。' },
        { tag: '训练', title: '推理压力局', desc: '智能体投票更主动，适合练习辨别话术漏洞。' }
      ]
    }
  },
  mounted () {
    this.loadRooms()
  },
  methods: {
    async loadRooms () {
      try {
        this.rooms = await listRooms()
      } catch (error) {
        this.message = error.message || '房间列表加载失败。'
      }
    },
    async startNewGame () {
      resetCurrentGamePointers()
      this.$router.push('/setup')
    },
    async joinExistingRoom () {
      if (!this.joinCode) {
        this.message = '请输入房号。'
        return
      }
      await this.joinRoomCard(this.joinCode)
    },
    async joinRoomCard (roomCode) {
      const user = getSessionUser()
      if (!user?.id) {
        this.message = '登录状态已失效，请重新登录。'
        return
      }
      this.loading = true
      this.message = ''
      try {
        const room = await joinRoom({ roomCode, userId: user.id })
        saveCurrentRoomCode(room.roomCode)
        resetGameState()
        this.$router.push('/setup')
      } catch (error) {
        this.message = error.message || '加入房间失败。'
      } finally {
        this.loading = false
      }
    },
    saveSettingsPanel (settings) {
      this.settings = settings
      saveSettings(settings)
      this.settingsOpen = false
    },
    logout () {
      clearSession()
      this.$router.push('/login')
    }
  }
}
</script>
