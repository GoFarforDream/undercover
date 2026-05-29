<template>
  <div>
    <div class="modal-kicker">玩家设置</div>
    <h2>对局偏好</h2>
    <div class="settings-grid">
      <label class="setting-row">
        <span>音效提示</span>
        <input v-model="local.sound" type="checkbox">
      </label>
      <label class="setting-row">
        <span>语音朗读</span>
        <input v-model="local.speech" type="checkbox">
      </label>
      <label class="setting-row">
        <span>自动进入下一轮</span>
        <input v-model="local.autoNext" type="checkbox">
      </label>
      <label class="setting-row">
        <span>暗色沉浸模式</span>
        <input v-model="local.darkMode" type="checkbox">
      </label>
      <label>
        玩家人数
        <input v-model.number="local.playerCount" min="4" max="12" type="number">
      </label>
      <label>
        卧底人数
        <input v-model.number="local.undercoverCount" min="1" max="3" type="number">
      </label>
      <label>
        白板人数
        <input v-model.number="local.blankCount" min="0" max="2" type="number">
      </label>
      <label>
        发言秒数
        <input v-model.number="local.roundSeconds" min="30" max="180" step="10" type="number">
      </label>
    </div>
    <div class="modal-actions">
      <button class="ghost-button" type="button" @click="$emit('close')">取消</button>
      <button class="primary-button" type="button" @click="save">保存设置</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SettingsPanel',
  props: {
    settings: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      local: { ...this.settings }
    }
  },
  methods: {
    save () {
      this.$emit('save', { ...this.local })
    }
  }
}
</script>
