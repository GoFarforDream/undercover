<template>
  <transition name="loading-fade">
    <div v-if="show" class="loading-overlay">
      <div class="loading-panel">
        <div class="loading-ring">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <strong>{{ title }}</strong>
        <p>{{ description }}</p>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'LoadingOverlay',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '正在传讯仙府'
    },
    description: {
      type: String,
      default: '请稍等，仙魔圆桌正在同步状态。'
    }
  }
}
</script>
