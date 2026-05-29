import Vue from 'vue'
import Router from 'vue-router'
import Auth from '../views/Auth.vue'
import Home from '../views/Home.vue'
import Room from '../views/Room.vue'
import Game from '../views/Game.vue'
import Result from '../views/Result.vue'

Vue.use(Router)

const router = new Router({
  mode: 'hash',
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: Auth },
    { path: '/home', name: 'home', component: Home },
    { path: '/room', name: 'room', component: Room },
    { path: '/game', name: 'game', component: Game },
    { path: '/result', name: 'result', component: Result }
  ]
})

router.beforeEach((to, from, next) => {
  const authed = localStorage.getItem('undercover-auth') === 'yes'
  if (to.name !== 'login' && !authed) {
    next('/login')
    return
  }
  if (to.name === 'login' && authed) {
    next('/home')
    return
  }
  next()
})

export default router
