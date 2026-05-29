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
        <p v-if="message" class="form-message">{{ message }}</p>
        <button class="primary-button full" type="submit">{{ mode === 'login' ? '进入大厅' : '创建玩家档案' }}</button>
      </form>
      <button class="text-button" type="button" @click="quickFill">使用默认账号 admin / 123456</button>
    </section>
  </main>
</template>

<script>
export default {
  name: 'Auth',
  data () {
    return {
      mode: 'login',
      message: '',
      form: {
        username: 'admin',
        password: '123456',
        confirm: ''
      }
    }
  },
  methods: {
    quickFill () {
      this.form.username = 'admin'
      this.form.password = '123456'
      this.form.confirm = '123456'
      this.message = ''
    },
    submit () {
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
        localStorage.setItem('undercover-user', JSON.stringify({
          username: this.form.username,
          password: this.form.password
        }))
        this.message = '注册成功，已为你登录。'
      } else {
        const saved = JSON.parse(localStorage.getItem('undercover-user') || 'null')
        const isDefault = this.form.username === 'admin' && this.form.password === '123456'
        const isSaved = saved && saved.username === this.form.username && saved.password === this.form.password
        if (!isDefault && !isSaved) {
          this.message = '账号或密码错误，默认账号为 admin / 123456。'
          return
        }
      }
      localStorage.setItem('undercover-auth', 'yes')
      localStorage.setItem('undercover-current-user', this.form.username)
      this.$router.push('/home')
    }
  }
}
</script>
