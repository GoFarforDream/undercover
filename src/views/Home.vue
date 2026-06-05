<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <span class="eyebrow">仙魔圆桌局</span>
        <h1>穿越仙界：六大仙修圆桌斩魔</h1>
      </div>
      <nav>
        <button class="icon-button" title="仙府法阵" type="button" @click="settingsOpen = true">⚙</button>
        <button class="ghost-button" type="button" @click="logout">离开仙府</button>
      </nav>
    </header>

    <section class="home-grid">
      <div class="play-panel">
        <p class="eyebrow">六大仙修圆桌</p>
        <h2>仙友 + 道友 + 先天之灵</h2>
        <p>默认由你执掌一席仙位，其余五席可以由先天之灵同桌入局。其他真实参与者则称为道友，也可一同进入仙府圆桌。</p>
        <div class="action-row">
          <button class="primary-button" type="button" :disabled="loading" @click="startNewGame">开启仙缘</button>
          <button class="ghost-button" type="button" @click="$router.push('/setup')">调整仙府</button>
          <button class="ghost-button" type="button" @click="$router.push('/agents')">先天之灵名册</button>
        </div>
        <p v-if="message" class="form-message">{{ message }}</p>
      </div>

      <aside class="mission-panel">
        <h3>道友常用</h3>
        <input v-model.trim="joinCode" placeholder="输入 6 位仙府令">
        <button type="button" :disabled="loading" @click="joinExistingRoom">进入仙府</button>
        <button type="button" @click="$router.push('/game')">续入前缘</button>
        <button type="button" @click="rulesOpen = true">查看仙规</button>
        <button type="button" @click="agentOpen = true">先天之灵说明</button>
      </aside>
    </section>

    <section class="mode-grid">
      <article v-for="modeItem in modes" :key="modeItem.title" class="mode-card">
        <span>{{ modeItem.tag }}</span>
        <h3>{{ modeItem.title }}</h3>
        <p>{{ modeItem.desc }}</p>
      </article>
    </section>

    <section class="room-records" v-if="rooms.length">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Immortal mansion records</span>
          <h2>仙府记录</h2>
        </div>
        <button class="ghost-button" type="button" @click="roomsCollapsed = !roomsCollapsed">
          {{ roomsCollapsed ? '展开仙府记录' : '收起仙府记录' }}
        </button>
      </div>
      <transition name="chat-fold">
        <div v-show="!roomsCollapsed" class="mode-grid room-record-grid">
          <article v-for="room in rooms" :key="room.roomCode" class="mode-card room-record-card">
            <span>{{ room.status }}</span>
            <h3>仙府 {{ room.roomCode }}</h3>
            <p>{{ room.players.length }} / {{ room.settings.maxPlayers }} 位道友 · {{ room.settings.speechSeconds }} 秒陈词</p>
            <div class="card-actions">
              <button class="ghost-button" type="button" :disabled="loading" @click="viewRoomDetail(room.roomCode)">查看详情</button>
              <button class="ghost-button" type="button" :disabled="loading" @click="joinRoomCard(room.roomCode)">进入仙府</button>
              <button class="danger-button" type="button" :disabled="loading" @click="removeRoom(room.roomCode)">抹去记录</button>
            </div>
          </article>
        </div>
      </transition>
    </section>

    <game-modal v-model="settingsOpen">
      <settings-panel :settings="settings" @close="settingsOpen = false" @save="saveSettingsPanel" />
    </game-modal>
    <game-modal v-model="rulesOpen">
      <div class="modal-kicker">仙规速览</div>
      <h2>辨仙魔气息，执令斩天魔</h2>
      <p class="modal-copy">六席仙修各得灵契密词。仙修词与魔修词相近，魔修需藏匿真身。每轮依序陈词，再由道友执诛仙令，直到仙修斩尽魔修，或天魔侵吞仙界。</p>
    </game-modal>
    <game-modal v-model="agentOpen">
      <div class="modal-kicker">先天之灵说明</div>
      <h2>它们是同席论道的先天之灵</h2>
      <p class="modal-copy">先天之灵会模拟道友陈词风格：谨慎观星、推演天机、顺势执令、迷雾藏锋或锋芒斩魔。你可以为五位先天之灵赐名，让仙魔圆桌局更像你的仙府试炼。</p>
    </game-modal>
    <loading-overlay :show="loading" :title="loadingTitle" :description="loadingDescription" />
  </main>
</template>

<script>
import GameModal from '../components/GameModal.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import SettingsPanel from '../components/SettingsPanel.vue'
import { deleteRoom, joinRoom, listRooms } from '../api/room'
import { getSettings, resetCurrentGamePointers, resetGameState, saveCurrentRoomCode, saveSettings } from '../store/game'
import { clearSession, getSessionUser } from '../store/session'

export default {
  name: 'Home',
  components: { GameModal, LoadingOverlay, SettingsPanel },
  data () {
    return {
      settingsOpen: false,
      rulesOpen: false,
      agentOpen: false,
      loading: false,
      loadingAction: '',
      message: '',
      joinCode: '',
      rooms: [],
      roomsCollapsed: false,
      settings: getSettings(),
      modes: [
        { tag: '推荐', title: '道友与先天之灵同席', desc: '多位真人道友 + 先天之灵陪修，最快进入仙魔圆桌局。' },
        { tag: '托管', title: '仙位托管推演', desc: '将你的仙位交由托管灵推演，观摩六席仙修自动判定仙魔胜负。' },
        { tag: '试炼', title: '斩魔试炼局', desc: '先天之灵执令更果断，适合修炼辨别魔修话术的眼力。' }
      ]
    }
  },
  mounted () {
    this.loadRooms()
  },
  computed: {
    loadingTitle () {
      const titles = {
        join: '正在进入仙府',
        delete: '正在抹去仙府记录'
      }
      return titles[this.loadingAction] || '正在请求后端'
    },
    loadingDescription () {
      const descriptions = {
        join: '正在向后端确认仙府与道友席位。',
        delete: '正在从后端移除这条仙府记录。'
      }
      return descriptions[this.loadingAction] || '请稍等，仙魔圆桌正在同步状态。'
    }
  },
  methods: {
    async loadRooms () {
      try {
        this.rooms = await listRooms()
      } catch (error) {
        this.message = error.message || '仙府记录加载失败。'
      }
    },
    async startNewGame () {
      resetCurrentGamePointers()
      this.$router.push('/setup')
    },
    async joinExistingRoom () {
      if (!this.joinCode) {
        this.message = '请输入仙府令。'
        return
      }
      await this.joinRoomCard(this.joinCode)
    },
    async joinRoomCard (roomCode) {
      const user = getSessionUser()
      if (!user?.id) {
        this.message = '道友仙籍已失效，请重新入仙府。'
        return
      }
      this.loading = true
      this.loadingAction = 'join'
      this.message = ''
      try {
        const room = await joinRoom({ roomCode, userId: user.id })
        saveCurrentRoomCode(room.roomCode)
        resetGameState()
        this.$router.push({ path: '/join-waiting', query: { roomCode: room.roomCode } })
      } catch (error) {
        this.message = error.message || '进入仙府失败。'
      } finally {
        this.loading = false
        this.loadingAction = ''
      }
    },
    viewRoomDetail (roomCode) {
      if (!roomCode) return
      this.$router.push(`/room-detail/${roomCode}`)
    },
    async removeRoom (roomCode) {
      if (!roomCode) return
      this.loading = true
      this.loadingAction = 'delete'
      this.message = ''
      try {
        await deleteRoom(roomCode)
        this.rooms = this.rooms.filter(room => room.roomCode !== roomCode)
        this.message = `仙府 ${roomCode} 记录已抹去。`
      } catch (error) {
        this.message = error.message || '抹去仙府记录失败。'
      } finally {
        this.loading = false
        this.loadingAction = ''
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
