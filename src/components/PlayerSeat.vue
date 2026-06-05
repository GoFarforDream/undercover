<template>
  <article
    class="player-seat"
    :class="{ active: player.speaking, out: !player.alive, human: player.type === 'human' }"
    :style="positionStyle"
  >
    <div class="seat-avatar">{{ player.type === 'human' ? '道友' : player.id }}</div>
    <div>
      <strong>{{ player.name }}</strong>
      <span>{{ player.alive ? (player.speaking ? '正在陈词' : status) : '已飞升离席' }}</span>
    </div>
    <i v-if="player.voted">已执令</i>
    <transition name="speech-pop">
      <p v-if="player.speechBubble" class="speech-bubble">{{ player.speechBubble }}</p>
    </transition>
  </article>
</template>

<script>
export default {
  name: 'PlayerSeat',
  props: {
    player: {
      type: Object,
      required: true
    },
    positionStyle: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    status () {
      if (this.player.type === 'human') return this.player.voted ? '你已执诛仙令' : '由你执掌'
      return this.player.voted ? '先天之灵已执令' : this.player.trait
    }
  }
}
</script>
