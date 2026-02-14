<script setup>
import { ref, onMounted, watch } from 'vue'

const isPlume = ref(false)

onMounted(() => {
  // 读取保存的模式
  const saved = localStorage.getItem('wolfe-theme-mode')
  if (saved === 'plume') {
    isPlume.value = true
    document.documentElement.setAttribute('data-skin', 'plume')
  }

  // 监听外部变化（如 plumeLayout 的 enforceModeByRoute）
  const observer = new MutationObserver(() => {
    isPlume.value = document.documentElement.getAttribute('data-skin') === 'plume'
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-skin']
  })
})

function toggle() {
  if (isPlume.value) {
    // 博客 → 普通：跳转到上次普通页面或首页
    document.documentElement.removeAttribute('data-skin')
    localStorage.setItem('wolfe-theme-mode', 'default')
    isPlume.value = false
    const lastPage = localStorage.getItem('wolfe-last-normal-page')
    if (lastPage && lastPage !== '/' && lastPage !== '/index.html') {
      window.location.href = lastPage
    } else {
      window.location.href = '/'
    }
  } else {
    // 普通 → 博客：跳转到上次博客页面或博客首页
    document.documentElement.setAttribute('data-skin', 'plume')
    localStorage.setItem('wolfe-theme-mode', 'plume')
    isPlume.value = true
    const lastPage = localStorage.getItem('wolfe-last-blog-page')
    if (lastPage && lastPage !== '/') {
      window.location.href = lastPage
    } else {
      window.location.href = '/'
    }
  }
}
</script>

<template>
  <button
    class="theme-toggle-btn"
    :class="{ active: isPlume }"
    @click="toggle"
    :title="isPlume ? '切换到文档模式' : '切换到博客模式'"
    :aria-label="isPlume ? '切换到文档模式' : '切换到博客模式'"
  >
    <span class="toggle-icon" v-if="!isPlume">
      <!-- 博客图标 (grid) -->
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"></rect>
        <rect x="14" y="3" width="7" height="7" rx="1"></rect>
        <rect x="3" y="14" width="7" height="7" rx="1"></rect>
        <rect x="14" y="14" width="7" height="7" rx="1"></rect>
      </svg>
    </span>
    <span class="toggle-icon" v-else>
      <!-- 文档图标 (book) -->
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
        <line x1="9" y1="7" x2="16" y2="7"></line>
        <line x1="9" y1="11" x2="14" y2="11"></line>
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
  margin-left: 4px;
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