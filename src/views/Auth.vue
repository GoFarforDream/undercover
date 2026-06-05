<template>
  <main class="auth-page">
    <div class="scanlines"></div>
    <section class="auth-hero">
      <p class="eyebrow">Undercover party game</p>
      <h1>谁是卧底</h1>
      <p>隐藏身份，控制发言节奏，在投票前读懂每一次停顿。</p>
      <div class="hero-stats">
        <span><b>6</b> 推荐人数</span>
        <span><b>60s</b> 发言节奏</span>
        <span><b>3</b> 回合复盘</span>
      </div>
    </section>

    <section class="auth-card">
      <div class="tab-switch">
        <button :class="{ active: mode === 'login' }" type="button" @click="mode = 'login'">登录</button>
        <button :class="{ active: mode === 'register' }" type="button" @click="mode = 'register'">注册</button>
      </div>
      <form @submit.prevent="submit">
        <label>
          用户名
          <input v-model.trim="form.username" autocomplete="username" placeholder="admin">
        </label>
        <label>
          密码
          <input v-model="form.password" autocomplete="current-password" placeholder="123456" type="password">
        </label>
        <label v-if="mode === 'register'">
          确认密码
          <input v-model="form.confirm" autocomplete="new-password" placeholder="再次输入密码" type="password">
        </label>
        <label v-if="mode === 'register'">
          昵称
          <input v-model.trim="form.nickname" autocomplete="nickname" placeholder="游戏内显示名">
        </label>
        <p v-if="message" class="form-message">{{ message }}</p>
        <button class="primary-button full" type="submit" :disabled="loading">
          {{ loading ? '处理中...' : (mode === 'login' ? '进入大厅' : '创建玩家档案') }}
        </button>
      </form>
      <button class="text-button" type="button" @click="quickFill">使用默认账号 admin / 123456</button>
    </section>
  </main>
</template>

<script>
import { login, register } from '../api/user'
import { saveSession } from '../store/session'

export default {
  name: 'Auth',
  data () {
    return {
      mode: 'login',
      loading: false,
      message: '',
      form: {
        username: 'admin',
        password: '123456',
        confirm: '',
        nickname: ''
      }
    }
  },
  methods: {
    quickFill () {
      this.form.username = 'admin'
      this.form.password = '123456'
      this.form.confirm = '123456'
      this.form.nickname = '管理员'
      this.message = ''
    },
    async submit () {
      if (!this.form.username || !this.form.password) {
        this.message = '请输入用户名和密码。'
        return
      }
      if (this.mode === 'register') {
        if (this.form.password.length < 6) {
          this.message = '密码至少 6 位。'
          return
        }
        if (this.form.password !== this.form.confirm) {
          this.message = '两次输入的密码不一致。'
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
        this.message = error.message || '请求失败，请确认后端服务已启动。'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
