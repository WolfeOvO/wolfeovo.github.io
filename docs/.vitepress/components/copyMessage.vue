<script setup>
import { reactive } from 'vue'

const icons = {
  check: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17l-5-5" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`
}

const toast = reactive({
  visible: false,
  text: '已复制到剪贴板',
  _timer: null
})

function show(text = '已复制到剪贴板', duration = 1800) {
  toast.text = text
  toast.visible = true
  if (toast._timer) clearTimeout(toast._timer)
  toast._timer = setTimeout(() => {
    toast.visible = false
    toast._timer = null
  }, duration)
}

defineExpose({ show })
</script>

<template>
  <Teleport to="body">
    <Transition name="dl-toast">
      <div v-if="toast.visible" class="dl-toast" role="status" aria-live="polite">
        <span class="dl-toast-icon" v-html="icons.check"></span>
        <span class="dl-toast-text">{{ toast.text }}</span>
      </div>
    </Transition>
  </Teleport>
</template>