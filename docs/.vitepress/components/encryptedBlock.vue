<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useData } from 'vitepress'

interface Props {
  icon?: string
  title?: string
  texts?: string[]
  password: string
  contentId: string
}

const props = withDefaults(defineProps<Props>(), {
  icon: '🔒',
  title: '内容已加密',
  texts: () => ['请输入密码查看内容']
})

const { page } = useData()

const isLocked = ref(true)
const inputPassword = ref('')
const errorMsg = ref('')
const containerRef = ref<HTMLElement | null>(null)
const overlayRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const isShaking = ref(false)
const containerHeight = ref(0) 

const storageKey = computed(() => {
  return `encrypted-block-${page.value.relativePath}-${props.contentId}`
})

const layoutMode = computed(() => {
  if (containerHeight.value < 100) return 'mini'
  if (containerHeight.value < 240) return 'compact'
  return 'normal'
})

let containerObserver: ResizeObserver | null = null
let overlayObserver: ResizeObserver | null = null

onMounted(() => {
  const stored = localStorage.getItem(storageKey.value)
  if (stored === 'unlocked') {
    isLocked.value = false
    nextTick(showHeadings)
  } else {
    hideHeadings()
  }
  
  if (containerRef.value) {
    containerObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerHeight.value = entry.contentRect.height
        requestAnimationFrame(updateOverlayPosition)
      }
    })
    containerObserver.observe(containerRef.value)
  }

  if (overlayRef.value) {
    overlayObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateOverlayPosition)
    })
    overlayObserver.observe(overlayRef.value)
  }

  window.addEventListener('scroll', updateOverlayPosition, { passive: true })
  window.addEventListener('resize', updateOverlayPosition, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateOverlayPosition)
  window.removeEventListener('resize', updateOverlayPosition)
  if (containerObserver) containerObserver.disconnect()
  if (overlayObserver) overlayObserver.disconnect()
})

function updateOverlayPosition() {
  if (!containerRef.value || !overlayRef.value || !isLocked.value) return
  
  const container = containerRef.value
  const overlay = overlayRef.value
  const containerRect = container.getBoundingClientRect()
  const overlayHeight = overlay.offsetHeight
  const viewportHeight = window.innerHeight
  
  // 这里的 transform 负责居中，必须保证不被 CSS 动画覆盖
  overlay.style.position = 'absolute'
  overlay.style.transform = 'translate(-50%, 0)'
  
  const padding = 12 
  if (containerRect.height <= overlayHeight + (padding * 2)) {
    overlay.style.top = '50%'
    overlay.style.transform = 'translate(-50%, -50%)'
    return
  }

  const viewportCenterY = viewportHeight / 2
  const centerInContainer = viewportCenterY - containerRect.top
  const idealTop = centerInContainer - overlayHeight / 2
  const minTop = padding
  const maxTop = containerRect.height - overlayHeight - padding
  const clampedTop = Math.max(minTop, Math.min(maxTop, idealTop))
  
  overlay.style.top = `${clampedTop}px`
}

function hideHeadings() {
  if (!contentRef.value) return
  const headings = contentRef.value.querySelectorAll('h1, h2, h3, h4, h5, h6')
  headings.forEach((heading) => {
    const id = heading.getAttribute('id')
    if (id) {
      const tocLink = document.querySelector(`.VPDocAsideOutline a[href="#${id}"]`)
      if (tocLink) tocLink.closest('li')?.setAttribute('data-encrypted', 'true')
    }
  })
  const styleId = 'encrypted-toc-style'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.innerHTML = `li[data-encrypted="true"] { display: none !important; }`
    document.head.appendChild(style)
  }
}

function showHeadings() {
  if (!contentRef.value) return
  const headings = contentRef.value.querySelectorAll('h1, h2, h3, h4, h5, h6')
  headings.forEach((heading) => {
    const id = heading.getAttribute('id')
    if (id) {
      const tocLink = document.querySelector(`.VPDocAsideOutline a[href="#${id}"]`)
      if (tocLink) tocLink.closest('li')?.removeAttribute('data-encrypted')
    }
  })
}

function verifyPassword() {
  if (inputPassword.value === props.password) {
    isLocked.value = false
    errorMsg.value = ''
    localStorage.setItem(storageKey.value, 'unlocked')
    nextTick(showHeadings)
  } else {
    // Mini模式下，错误提示不显示文字，只抖动
    errorMsg.value = layoutMode.value === 'mini' ? '!' : '密码错误'
    isShaking.value = true
    setTimeout(() => { isShaking.value = false }, 500)
    nextTick(() => updateOverlayPosition())
  }
}

function relock() {
  isLocked.value = true
  inputPassword.value = ''
  errorMsg.value = ''
  localStorage.removeItem(storageKey.value)
  nextTick(() => {
    hideHeadings()
    if (containerRef.value) containerHeight.value = containerRef.value.offsetHeight
    updateOverlayPosition()
  })
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') verifyPassword()
}

watch(isLocked, (locked) => {
  if (locked) {
    nextTick(() => {
      updateOverlayPosition()
      if (overlayRef.value && !overlayObserver) {
        overlayObserver = new ResizeObserver(() => requestAnimationFrame(updateOverlayPosition))
        overlayObserver.observe(overlayRef.value)
      } else if (overlayRef.value && overlayObserver) {
        overlayObserver.disconnect()
        overlayObserver.observe(overlayRef.value)
      }
    })
  } else {
    overlayObserver?.disconnect()
  }
})
</script>

<template>
  <div 
    ref="containerRef" 
    class="encrypted-block"
    :class="{ 'is-locked': isLocked }"
  >
    <Transition name="fade">
      <div 
        v-if="isLocked" 
        ref="overlayRef"
        class="encrypted-overlay-wrapper"
        :class="[`layout-${layoutMode}`]"
      >
        <!-- 
           修正点：将 :class="{ 'shake': isShaking }" 移到内部的 interaction-card 上。
           这样抖动时只会抖内部卡片，不会干扰外层 wrapper 的 transform 定位。
        -->
        <div class="interaction-card" :class="{ 'shake': isShaking }">
          <div v-if="layoutMode !== 'mini'" class="info-section">
            <div v-if="layoutMode === 'normal'" class="lock-icon" v-html="icon"></div>
            <div class="text-group">
              <h3 v-if="layoutMode !== 'mini'" class="lock-title">{{ title }}</h3>
              <div v-if="layoutMode === 'normal'" class="lock-texts">
                <p v-for="(text, index) in texts" :key="index">{{ text }}</p>
              </div>
            </div>
          </div>

          <div class="input-section">
            <div class="input-group">
              <input
                v-model="inputPassword"
                type="password"
                class="password-input"
                :placeholder="layoutMode === 'mini' ? '请输入密码...' : '输入密码查看...'"
                @keydown="handleKeydown"
              />
              <button class="unlock-btn" @click="verifyPassword" title="解锁">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                </svg>
              </button>
            </div>
            
            <Transition name="slide-fade">
              <p v-if="errorMsg && layoutMode !== 'mini'" class="error-msg">{{ errorMsg }}</p>
            </Transition>
          </div>
        </div>
      </div>
    </Transition>
    
    <div 
      ref="contentRef" 
      class="encrypted-content"
      :class="{ 'content-hidden': isLocked }"
    >
      <slot />
    </div>
    
    <Transition name="fade">
      <button v-if="!isLocked" class="relock-btn" @click="relock" title="重新锁定">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>锁定</span>
      </button>
    </Transition>
  </div>
</template>

<style scoped>
.encrypted-block {
  position: relative;
  margin: 1.5rem 0;
  border-radius: 12px;
  overflow: hidden;
}

.encrypted-block.is-locked {
  user-select: none;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

:root.dark .encrypted-block.is-locked {
  background: linear-gradient(135deg, #1f1f23 0%, #18181b 100%);
}

.encrypted-content {
  transition: opacity 0.3s, filter 0.3s;
}

.encrypted-content.content-hidden {
  filter: blur(12px);
  opacity: 0.4;
  pointer-events: none;
}

.encrypted-overlay-wrapper {
  position: absolute; 
  left: 50%;
  z-index: 10;
  width: 90%;
  max-width: 340px;
  will-change: top, transform;
}

.interaction-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

:root.dark .interaction-card {
  background: rgba(40, 40, 45, 0.9);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

/* Layout Modes */
.layout-normal .interaction-card {
  padding: 1.5rem;
  text-align: center;
}

.layout-compact .interaction-card {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: center;
}
.layout-compact .lock-title { margin: 0; font-size: 1rem; }

/* Mini Mode */
.layout-mini { max-width: 300px; }
.layout-mini .interaction-card {
  padding: 4px 6px 4px 14px; 
  border-radius: 99px;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  white-space: nowrap;
  height: auto;
}
:root.dark .layout-mini .interaction-card { background: rgba(40, 40, 45, 0.98); }

.layout-mini .input-section { flex: 1; min-width: 0; margin: 0; }
.layout-mini .input-group { border: none; background: transparent; box-shadow: none; border-radius: 0; }

.layout-mini .password-input {
  padding: 0;
  font-size: 15px;
  height: 36px;
  line-height: 36px;
}
.layout-mini .password-input::placeholder { font-size: 14px; opacity: 0.7; }

.layout-mini .unlock-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-left: 8px;
  flex-shrink: 0;
  padding: 0;
}
.layout-mini .unlock-btn svg { width: 18px !important; height: 18px !important; }

/* General */
.lock-icon { font-size: 2rem; margin-bottom: 0.5rem; }
.lock-title { font-weight: 700; color: #111827; margin-bottom: 0.25rem; }
:root.dark .lock-title { color: #f3f4f6; }
.lock-texts { font-size: 0.85rem; color: #6b7280; margin-bottom: 1rem; line-height: 1.4; }

.input-group {
  display: flex;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: 0.2s;
  overflow: hidden;
}
.input-group:focus-within { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1); }
:root.dark .input-group { background: #27272a; border-color: #3f3f46; }

.password-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.6rem 0.8rem;
  outline: none;
  color: inherit;
  font-size: 0.9rem;
  min-width: 0;
}

.unlock-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #6366f1;
  color: white;
  border: none;
  padding: 0 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
}
.unlock-btn:hover { background: #4f46e5; }
.unlock-btn:active { background: #4338ca; }
.unlock-btn svg { display: block; }

.error-msg { color: #ef4444; font-size: 0.75rem; margin-top: 0.5rem; line-height: 1.2; }

.relock-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(0,0,0,0.1);
  background: rgba(255,255,255,0.8);
  font-size: 0.75rem;
  cursor: pointer;
}
:root.dark .relock-btn {
  background: rgba(0,0,0,0.4);
  border-color: rgba(255,255,255,0.1);
  color: #ccc;
}

.shake {
  animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-3px, 0, 0); }
  40%, 60% { transform: translate3d(3px, 0, 0); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.3s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { opacity: 0; transform: translateY(-5px); }
</style>