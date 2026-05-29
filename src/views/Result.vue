<template>
  <main class="app-shell result-page">
    <section class="result-hero">
      <span class="eyebrow">本局结算</span>
      <h1>{{ state.winner }} 获胜</h1>
      <p>MVP：{{ state.mvp }}。平民词「{{ state.civilianWord }}」，卧底词「{{ state.undercoverWord }}」。</p>
      <div class="action-row">
        <button class="primary-button" type="button" @click="$router.push('/room')">再来一局</button>
        <button class="ghost-button" type="button" @click="$router.push('/home')">返回大厅</button>
      </div>
    </section>
    <section class="reveal-grid">
      <article v-for="player in state.players" :key="player.id" class="mode-card">
        <span>{{ player.alive ? '存活' : '出局' }}</span>
        <h3>{{ player.name }}</h3>
        <p>{{ player.role }}</p>
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
