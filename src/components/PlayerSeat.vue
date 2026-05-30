<template>
  <article
    class="player-seat"
    :class="{ active: player.speaking, out: !player.alive, human: player.type === 'human' }"
    :style="positionStyle"
  >
    <div class="seat-avatar">{{ player.type === 'human' ? 'YOU' : player.id }}</div>
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
    },
    positionStyle: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    status () {
      if (this.player.type === 'human') return this.player.voted ? '你已投票' : '由你操控'
      return this.player.voted ? 'AI 已投票' : this.player.trait
    }
  }
}
</script>
