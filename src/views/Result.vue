<template>
  <main class="app-shell result-page">
    <section class="result-hero">
      <span class="eyebrow">人机局结算</span>
      <h1>{{ state.winner }} 获胜</h1>
      <p>MVP：{{ state.mvp }}。平民词「{{ state.civilianWord }}」，卧底词「{{ state.undercoverWord }}」。复盘重点是智能体如何通过发言隐藏或暴露身份。</p>
      <div class="action-row">
        <button class="primary-button" type="button" @click="$router.push('/setup')">调整智能体再来</button>
        <button class="ghost-button" type="button" @click="$router.push('/home')">返回首页</button>
      </div>
    </section>
    <section class="reveal-grid">
      <article v-for="player in state.players" :key="player.id" class="mode-card">
        <span>{{ player.type === 'human' ? '真人玩家' : player.trait }}</span>
        <h3>{{ player.name }}</h3>
        <p>{{ player.role }} · {{ player.alive ? '存活' : '出局' }}</p>
      </article>
    </section>
  </main>
</template>

<script>
import { getGameState } from '../store/game'

export default {
  name: 'Result',
  data () {
    return {
      state: getGameState()
    }
  }
}
</script>
