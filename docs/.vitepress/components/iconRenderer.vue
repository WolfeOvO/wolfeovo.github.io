<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: { type: String, default: '' },
  size: { type: [String, Number], default: '1em' },
  fallback: { type: String, default: '' },
})

// 判断 icon 类型
const iconType = computed(() => {
  const val = (props.icon || props.fallback || '').trim()
  if (!val) return 'none'
  if (val.startsWith('<svg') || val.startsWith('<SVG')) return 'svg'
  if (val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('./')) return 'image'
  return 'text' // emoji 或其他文字
})

const iconValue = computed(() => {
  return (props.icon || props.fallback || '').trim()
})

const sizeStr = computed(() => {
  if (typeof props.size === 'number') return props.size + 'px'
  return props.size
})
</script>

<template>
  <span v-if="iconType === 'text'" class="icon-renderer icon-text" :style="{ fontSize: sizeStr }">{{ iconValue }}</span>
  <span v-else-if="iconType === 'svg'" class="icon-renderer icon-svg" :style="{ width: sizeStr, height: sizeStr }" v-html="iconValue"></span>
  <img v-else-if="iconType === 'image'" class="icon-renderer icon-img" :src="iconValue" :style="{ width: sizeStr, height: sizeStr }" alt="icon" />
</template>

<style scoped>
.icon-renderer {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  vertical-align: middle;
  line-height: 1;
}

.icon-svg {
  overflow: hidden;
}

.icon-svg :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}

.icon-img {
  object-fit: contain;
  border: none;
}
</style>