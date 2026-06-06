<template>
  <main class="auth-page">
    <div class="scanlines"></div>
    <section class="auth-hero">
      <p class="eyebrow">仙魔圆桌局</p>
      <h1>穿越仙界：六大仙修圆桌斩魔</h1>
      <p>隐匿仙魔真身，掌控陈词节奏，在诛仙令落下前看破每一道气息。</p>
      <div class="hero-stats">
        <span><b>6</b> 仙修圆桌</span>
        <span><b>60s</b> 陈词节奏</span>
        <span><b>7</b> 修为境界</span>
      </div>
    </section>

    <section class="auth-card">
      <div class="tab-switch">
        <button :class="{ active: mode === 'login' }" type="button" @click="mode = 'login'">入仙府</button>
        <button :class="{ active: mode === 'register' }" type="button" @click="mode = 'register'">立仙籍</button>
      </div>
      <form @submit.prevent="submit">
        <label>
          道号
          <input v-model.trim="form.username" autocomplete="username" placeholder="请输入道号">
        </label>
        <label>
          密令
          <input v-model="form.password" autocomplete="current-password" placeholder="请输入密令" type="password">
        </label>
        <label v-if="mode === 'register'">
          确认密令
          <input v-model="form.confirm" autocomplete="new-password" placeholder="再次输入密令" type="password">
        </label>
        <label v-if="mode === 'register'">
          仙名
          <input v-model.trim="form.nickname" autocomplete="nickname" placeholder="请输入仙府昵称">
        </label>
        <p v-if="message" class="form-message">{{ message }}</p>
        <button class="primary-button full" type="submit" :disabled="loading">
          {{ loading ? '仙府通传中...' : (mode === 'login' ? '进入仙府' : '创建仙籍') }}
        </button>
      </form>
    </section>
    <loading-overlay :show="loading" title="正在进入仙府" description="正在校验道号并同步道友档案。" />
  </main>
</template>

<script>
import LoadingOverlay from '../components/LoadingOverlay.vue'
import { login, register } from '../api/user'
import { saveSession } from '../store/session'

export default {
  name: 'Auth',
  components: { LoadingOverlay },
  data () {
    return {
      mode: 'login',
      loading: false,
      message: '',
      form: {
        username: '',
        password: '',
        confirm: '',
        nickname: ''
      }
    }
  },
  methods: {
    async submit () {
      if (!this.form.username || !this.form.password) {
        this.message = '请输入道号和密令。'
        return
      }
      if (this.mode === 'register') {
        if (this.form.password.length < 6) {
          this.message = '密令至少 6 位。'
          return
        }
        if (this.form.password !== this.form.confirm) {
          this.message = '两次输入的密令不一致。'
          return
        }
      }
      this.loading = true
      this.message = ''
      try {
        if (this.mode === 'register') {
          await register({
            username: this.form.username,
            password: this.form.password,
            nickname: this.form.nickname || this.form.username,
            avatar: 'avatar-player'
          })
        }
        const result = await login({
          username: this.form.username,
          password: this.form.password
        })
        saveSession(result)
        this.$router.push('/home')
      } catch (error) {
        this.message = error.message || '仙府传讯失败，请确认后端法阵已启动。'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
