<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <span class="eyebrow">仙府详情</span>
        <h1>{{ room ? `仙府 ${room.roomCode}` : '仙府卷宗' }}</h1>
      </div>
      <nav>
        <button class="ghost-button" type="button" @click="$router.push('/home')">返回仙府首页</button>
        <button class="ghost-button" type="button" :disabled="loading" @click="loadRoom">刷新卷宗</button>
      </nav>
    </header>

    <section v-if="room" class="detail-layout">
      <article class="detail-hero">
        <span>{{ statusText(room.status) }}</span>
        <h2>{{ room.players.length }} / {{ room.settings.maxPlayers }} 位道友入席</h2>
        <p>此卷记录仙府候场与对局配置，可查看席位、房主、陈词时限和诛仙令法阵。</p>
        <div class="detail-actions">
          <button class="primary-button" type="button" :disabled="loading" @click="enterRoom">进入仙府</button>
          <button class="danger-button" type="button" :disabled="loading" @click="removeRoom">抹去记录</button>
        </div>
        <p v-if="message" class="form-message">{{ message }}</p>
      </article>

      <aside class="detail-summary">
        <div>
          <span>仙府令</span>
          <strong>{{ room.roomCode }}</strong>
        </div>
        <div>
          <span>房主仙籍</span>
          <strong>{{ ownerName }}</strong>
        </div>
        <div>
          <span>陈词时限</span>
          <strong>{{ room.settings.speechSeconds }} 秒</strong>
        </div>
        <div>
          <span>天魔数量</span>
          <strong>{{ room.settings.undercoverCount }} 位</strong>
        </div>
      </aside>
    </section>

    <section v-if="room" class="detail-grid">
      <article class="detail-panel">
        <div class="panel-heading plain">
          <h3>仙府法阵</h3>
        </div>
        <div class="setting-list">
          <p><span>总席位</span><strong>{{ room.settings.maxPlayers }}</strong></p>
          <p><span>魔修数</span><strong>{{ room.settings.undercoverCount }}</strong></p>
          <p><span>选词</span><strong>{{ wordModeText(room.settings.wordMode) }}</strong></p>
          <p v-if="room.settings.wordMode === 'ADVENTURE'"><span>秘境关卡</span><strong>第 {{ room.settings.adventureLevelId || 1 }} 关</strong></p>
          <p><span>诛仙令</span><strong>{{ voteModeText(room.settings.voteMode) }}</strong></p>
          <p><span>观战</span><strong>{{ room.settings.allowSpectator ? '允许' : '关闭' }}</strong></p>
        </div>
      </article>

      <article class="detail-panel">
        <div class="panel-heading plain">
          <h3>入席道友</h3>
        </div>
        <div class="seat-list">
          <div v-for="player in orderedPlayers" :key="player.userId" class="seat-row">
            <span>{{ player.seatNo }}</span>
            <div>
              <strong>{{ player.nickname }}</strong>
              <small>{{ player.owner ? '房主' : player.userId < 0 ? '补位仙影' : '真人道友' }}</small>
            </div>
            <i>{{ player.username }}</i>
          </div>
          <p v-if="!orderedPlayers.length" class="modal-copy">暂无道友入席。</p>
        </div>
      </article>
    </section>

    <section v-if="!room && !loading" class="empty-state">
      <h2>未找到此仙府卷宗</h2>
      <p>{{ message || '仙府可能已被抹去，或后端法阵已重启。' }}</p>
      <button class="primary-button" type="button" @click="$router.push('/home')">返回仙府首页</button>
    </section>

    <loading-overlay :show="loading" :title="loadingTitle" :description="loadingDescription" />
  </main>
</template>

<script>
import LoadingOverlay from '../components/LoadingOverlay.vue'
import { deleteRoom, getRoom, joinRoom } from '../api/room'
import { resetGameState, saveCurrentRoomCode } from '../store/game'
import { getSessionUser } from '../store/session'

export default {
  name: 'RoomDetail',
  components: { LoadingOverlay },
  data () {
    return {
      room: null,
      loading: false,
      loadingAction: '',
      message: ''
    }
  },
  computed: {
    roomCode () {
      return this.$route.params.roomCode
    },
    ownerName () {
      if (!this.room) return '未知房主'
      const owner = (this.room?.players || []).find(player => player.owner || player.userId === this.room.ownerId)
      return owner ? owner.nickname : `仙籍 ${this.room.ownerId}`
    },
    orderedPlayers () {
      return (this.room?.players || []).slice().sort((left, right) => left.seatNo - right.seatNo)
    },
    loadingTitle () {
      const titles = {
        load: '正在展开仙府卷宗',
        join: '正在进入仙府',
        delete: '正在抹去仙府记录'
      }
      return titles[this.loadingAction] || '正在请求后端'
    },
    loadingDescription () {
      const descriptions = {
        load: '正在读取仙府席位与法阵配置。',
        join: '正在确认道友仙籍与仙府席位。',
        delete: '正在移除此条仙府记录。'
      }
      return descriptions[this.loadingAction] || '请稍等，仙魔圆桌正在同步状态。'
    }
  },
  mounted () {
    this.loadRoom()
  },
  methods: {
    async loadRoom () {
      if (!this.roomCode) return
      this.loading = true
      this.loadingAction = 'load'
      this.message = ''
      try {
        this.room = await getRoom(this.roomCode)
      } catch (error) {
        this.room = null
        this.message = error.message || '仙府卷宗加载失败。'
      } finally {
        this.loading = false
        this.loadingAction = ''
      }
    },
    async enterRoom () {
      if (!this.room) return
      const user = getSessionUser()
      if (!user?.id) {
        this.message = '道友仙籍已失效，请重新入仙府。'
        return
      }
      this.loading = true
      this.loadingAction = 'join'
      this.message = ''
      try {
        const alreadySeated = this.room.players.some(player => player.userId === user.id)
        const room = alreadySeated ? this.room : await joinRoom({ roomCode: this.room.roomCode, userId: user.id })
        saveCurrentRoomCode(room.roomCode)
        resetGameState()
        this.$router.push('/setup')
      } catch (error) {
        this.message = error.message || '进入仙府失败。'
      } finally {
        this.loading = false
        this.loadingAction = ''
      }
    },
    async removeRoom () {
      if (!this.room) return
      this.loading = true
      this.loadingAction = 'delete'
      this.message = ''
      try {
        await deleteRoom(this.room.roomCode)
        this.$router.push('/home')
      } catch (error) {
        this.message = error.message || '抹去仙府记录失败。'
      } finally {
        this.loading = false
        this.loadingAction = ''
      }
    },
    statusText (status) {
      const map = {
        WAITING: '仙府候场',
        PLAYING: '仙缘已启',
        FINISHED: '仙魔终局'
      }
      return map[status] || status || '未知状态'
    },
    voteModeText (mode) {
      const map = {
        PUBLIC: '明令',
        PRIVATE: '暗令'
      }
      return map[mode] || mode || '明令'
    },
    wordModeText (mode) {
      const map = {
        HEAVEN: '天道降契',
        CUSTOM: '府主自填',
        ADVENTURE: '秘境探险'
      }
      return map[mode] || '天道降契'
    }
  }
}
</script>
