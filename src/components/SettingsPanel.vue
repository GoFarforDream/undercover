<template>
  <div>
    <div class="modal-kicker">仙府法阵</div>
    <h2>六大仙修圆桌</h2>
    <div class="settings-grid">
      <label class="setting-row">
        <span>仙音提示</span>
        <input v-model="local.sound" type="checkbox">
      </label>
      <label class="setting-row">
        <span>传音诵读</span>
        <input v-model="local.speech" type="checkbox">
      </label>
      <label class="setting-row">
        <span>先天之灵自动推演</span>
        <input v-model="local.autoNext" type="checkbox">
      </label>
      <label class="setting-row">
        <span>道友仙位托管</span>
        <input v-model="local.playerAsAgent" type="checkbox">
      </label>
      <label class="setting-row">
        <span>夜幕仙府模式</span>
        <input v-model="local.darkMode" type="checkbox">
      </label>
      <label>
        先天之灵修为
        <select v-model="local.agentLevel">
          <option>清修</option>
          <option>问道</option>
          <option>斩魔</option>
        </select>
      </label>
      <label>
        魔修数量
        <input v-model.number="local.undercoverCount" min="1" max="3" type="number">
      </label>
      <label>
        散修数量
        <input v-model.number="local.blankCount" min="0" max="2" type="number">
      </label>
      <label>
        陈词秒数
        <input v-model.number="local.roundSeconds" min="30" max="180" step="10" type="number">
      </label>
    </div>
    <div class="modal-actions">
      <button class="ghost-button" type="button" @click="$emit('close')">收起法阵</button>
      <button class="primary-button" type="button" @click="save">保存仙府法阵</button>
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
