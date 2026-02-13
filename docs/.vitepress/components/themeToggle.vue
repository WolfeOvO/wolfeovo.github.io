<script setup>
import { ref, onMounted, watch } from 'vue'

const isPlume = ref(false)

onMounted(() => {
  const saved = localStorage.getItem('wolfe-theme-mode')
  if (saved === 'plume') {
    isPlume.value = true
    document.documentElement.setAttribute('data-skin', 'plume')
  }
})

watch(isPlume, (val) => {
  if (val) {
    document.documentElement.setAttribute('data-skin', 'plume')
    localStorage.setItem('wolfe-theme-mode', 'plume')
  } else {
    document.documentElement.removeAttribute('data-skin')
    localStorage.setItem('wolfe-theme-mode', 'default')
  }
})

function toggle() {
  isPlume.value = !isPlume.value
}
</script>

<template>
  <button
    class="theme-toggle-btn"
    :class="{ active: isPlume }"
    @click="toggle"
    :title="isPlume ? '切换到默认主题' : '切换到博客主题'"
    :aria-label="isPlume ? '切换到默认主题' : '切换到博客主题'"
  >
    <span class="toggle-icon" v-if="!isPlume">
      <!-- 博客图标 (grid/card layout) -->
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    </span>
    <span class="toggle-icon" v-else>
      <!-- 文档图标 (sidebar layout) -->
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
        <line x1="9" y1="7" x2="16" y2="7"/>
        <line x1="9" y1="11" x2="14" y2="11"/>
      </svg>
    </span>
  </button>
</template>

<style scoped>
.theme-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.theme-toggle-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background: var(--vp-c-default-soft);
  opacity: 0;
  transition: opacity 0.2s;
}

.theme-toggle-btn:hover::before {
  opacity: 1;
}

.theme-toggle-btn:hover {
  color: var(--vp-c-brand-1);
}

.theme-toggle-btn.active {
  color: var(--vp-c-brand-1);
}

.toggle-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}
</style>