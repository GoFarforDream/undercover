<template>
  <article class="player-seat" :class="{ active: player.speaking, out: !player.alive }">
    <div class="seat-avatar">{{ player.id }}</div>
    <div>
      <strong>{{ player.name }}</strong>
      <span>{{ player.alive ? (player.speaking ? '正在发言' : status) : '已出局' }}</span>
    </div>
    <i v-if="player.voted">已投</i>
  </article>
</template>

<script>
export default {
  name: 'PlayerSeat',
  props: {
    player: {
      type: Object,
      required: true
    }
  },
  computed: {
    status () {
      return this.player.voted ? '等待结算' : '观察中'
    }
  }
}
</script>
