<script setup>
import { reactive } from 'vue'

const toast = reactive({
  visible: false,
  text: '已复制到剪贴板',
  _timer: null
})

function show(text = '已复制到剪贴板', duration = 2000) {
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
        <span class="dl-toast-icon" aria-hidden="true">✔</span>
        <span class="dl-toast-text">{{ toast.text }}</span>
      </div>
    </Transition>
  </Teleport>
</template>