<template>
  <transition name="modal">
    <div v-if="value" class="modal-mask" @click.self="$emit('input', false)">
      <section class="modal-panel">
        <button class="icon-button modal-close" type="button" @click="$emit('input', false)">x</button>
        <slot />
      </section>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'GameModal',
  props: {
    value: Boolean
  }
}
</script>
