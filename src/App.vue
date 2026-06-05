<template>
  <div id="app" :class="{ 'reduce-motion': reduceMotion }">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  data () {
    return {
      reduceMotion: false
    }
  },
  mounted () {
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
}
</script>
