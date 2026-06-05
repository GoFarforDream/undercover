import Vue from 'vue'
import Router from 'vue-router'
import Auth from '../views/Auth.vue'
import Home from '../views/Home.vue'
import Setup from '../views/Room.vue'
import AgentNames from '../views/AgentNames.vue'
import Game from '../views/Game.vue'
import Result from '../views/Result.vue'
import RoomDetail from '../views/RoomDetail.vue'

Vue.use(Router)

const router = new Router({
  mode: 'hash',
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: Auth },
    { path: '/home', name: 'home', component: Home },
    { path: '/setup', name: 'setup', component: Setup },
    { path: '/agents', name: 'agents', component: AgentNames },
    { path: '/room', redirect: '/setup' },
    { path: '/room-detail/:roomCode', name: 'roomDetail', component: RoomDetail },
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
