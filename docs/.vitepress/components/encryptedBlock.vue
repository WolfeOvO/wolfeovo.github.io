<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useData } from 'vitepress'

interface Props {
  icon?: string
  title?: string
  texts?: string[]
  password: string
  contentId: string
  compact?: boolean // 是否使用紧凑模式，默认 false
}

const props = withDefaults(defineProps<Props>(), {
  icon: '🔒',
  title: '加密内容',
  texts: () => ['请输入密码查看内容'],
  compact: false
})

const { page } = useData()

const isLocked = ref(true)
const inputPassword = ref('')
const errorMsg = ref('')
const containerRef = ref<HTMLElement | null>(null)
const overlayRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const isShaking = ref(false)

// 存储密钥：基于页面路径和内容ID
const storageKey = computed(() => {
  return `encrypted-block-${page.value.relativePath}-${props.contentId}`
})

// 检查本地存储中是否已解锁
onMounted(() => {
  const stored = localStorage.getItem(storageKey.value)
  if (stored === 'unlocked') {
    isLocked.value = false
    nextTick(() => {
      showHeadings()
    })
  } else {
    hideHeadings()
  }
  
  // 监听滚动以实现粘性效果（仅在非紧凑模式下）
  if (!props.compact) {
    nextTick(() => {
      updateOverlayPosition()
    })
    window.addEventListener('scroll', updateOverlayPosition, { passive: true })
    window.addEventListener('resize', updateOverlayPosition, { passive: true })
  }
})

onUnmounted(() => {
  if (!props.compact) {
    window.removeEventListener('scroll', updateOverlayPosition)
    window.removeEventListener('resize', updateOverlayPosition)
  }
})

// 更新遮罩层位置（粘性效果）- 仅用于非紧凑模式
function updateOverlayPosition() {
  if (!containerRef.value || !overlayRef.value || !isLocked.value || props.compact) return
  
  const container = containerRef.value
  const overlay = overlayRef.value
  const containerRect = container.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const containerHeight = container.offsetHeight
  
  const overlayHeight = overlay.offsetHeight || 300
  
  overlay.style.position = 'absolute'
  overlay.style.bottom = 'auto'
  
  const padding = 16
  
  if (containerHeight <= overlayHeight + padding * 2) {
    overlay.style.top = '50%'
    overlay.style.transform = 'translate(-50%, -50%)'
    return
  }
  
  const minTop = padding
  const maxTop = containerHeight - overlayHeight - padding
  const viewportCenterY = viewportHeight / 2
  const centerInContainer = viewportCenterY - containerRect.top
  const idealTop = centerInContainer - overlayHeight / 2
  const clampedTop = Math.max(minTop, Math.min(maxTop, idealTop))
  
  overlay.style.top = `${clampedTop}px`
  overlay.style.transform = 'translateX(-50%)'
}

// 隐藏加密区域内的标题
function hideHeadings() {
  if (!contentRef.value) return
  
  const headings = contentRef.value.querySelectorAll('h1, h2, h3, h4, h5, h6')
  headings.forEach((heading) => {
    const id = heading.getAttribute('id')
    if (id) {
      const tocLink = document.querySelector(`.VPDocAsideOutline a[href="#${id}"]`)
      if (tocLink) {
        const listItem = tocLink.closest('li')
        if (listItem) {
          listItem.setAttribute('data-encrypted', 'true')
          ;(listItem as HTMLElement).style.display = 'none'
        }
      }
    }
  })
}

// 显示加密区域内的标题
function showHeadings() {
  if (!contentRef.value) return
  
  const headings = contentRef.value.querySelectorAll('h1, h2, h3, h4, h5, h6')
  headings.forEach((heading) => {
    const id = heading.getAttribute('id')
    if (id) {
      const tocLink = document.querySelector(`.VPDocAsideOutline a[href="#${id}"]`)
      if (tocLink) {
        const listItem = tocLink.closest('li')
        if (listItem) {
          listItem.removeAttribute('data-encrypted')
          ;(listItem as HTMLElement).style.display = ''
        }
      }
    }
  })
}

// 验证密码
function verifyPassword() {
  if (inputPassword.value === props.password) {
    isLocked.value = false
    errorMsg.value = ''
    localStorage.setItem(storageKey.value, 'unlocked')
    nextTick(() => {
      showHeadings()
    })
  } else {
    errorMsg.value = '密码错误'
    isShaking.value = true
    setTimeout(() => {
      isShaking.value = false
    }, 500)
  }
}

// 重新锁定
function relock() {
  isLocked.value = true
  inputPassword.value = ''
  localStorage.removeItem(storageKey.value)
  nextTick(() => {
    hideHeadings()
    if (!props.compact) {
      updateOverlayPosition()
    }
  })
}

// 处理回车键
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    verifyPassword()
  }
}

// 监听锁定状态变化
watch(isLocked, (locked) => {
  if (locked && !props.compact) {
    nextTick(() => {
      updateOverlayPosition()
    })
  }
})
</script>

<template>
  <div 
    ref="containerRef" 
    class="encrypted-block"
    :class="{ 
      'is-locked': isLocked,
      'is-compact': compact
    }"
  >
    <!-- 紧凑模式 -->
    <template v-if="compact">
      <!-- 提示栏 -->
      <Transition name="fade">
        <div 
          v-if="isLocked" 
          class="compact-header"
          :class="{ 'shake': isShaking }"
        >
          <div class="compact-left">
            <span class="compact-icon" v-html="icon"></span>
            <span class="compact-title">{{ title }}</span>
          </div>
          <div class="compact-right">
            <div class="compact-input-group">
              <input
                v-model="inputPassword"
                type="password"
                class="compact-input"
                placeholder="输入密码..."
                @keydown="handleKeydown"
                autocomplete="off"
              />
              <button class="compact-btn" @click="verifyPassword">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14"/>
                  <path d="m12 5 7 7-7 7"/>
                </svg>
              </button>
            </div>
            <Transition name="slide-fade">
              <span v-if="errorMsg" class="compact-error">{{ errorMsg }}</span>
            </Transition>
          </div>
        </div>
      </Transition>
      
      <!-- 内容区 -->
      <div class="compact-body">
        <div 
          ref="contentRef" 
          class="encrypted-content"
          :class="{ 'content-hidden-compact': isLocked }"
        >
          <slot />
        </div>
        <Transition name="fade">
          <button 
            v-if="!isLocked" 
            class="relock-btn-inline"
            @click="relock"
            title="重新锁定"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>锁定</span>
          </button>
        </Transition>
      </div>
    </template>

    <!-- 标准模式 -->
    <template v-else>
      <!-- 遮罩层 -->
      <Transition name="fade">
        <div 
          v-if="isLocked" 
          ref="overlayRef"
          class="encrypted-overlay"
          :class="{ 'shake': isShaking }"
        >
          <div class="overlay-content">
            <div class="lock-icon" v-html="icon"></div>
            <h3 class="lock-title">{{ title }}</h3>
            <div class="lock-texts">
              <p v-for="(text, index) in texts" :key="index" class="lock-text">
                {{ text }}
              </p>
            </div>
            <div class="password-input-wrapper">
              <div class="input-group">
                <input
                  v-model="inputPassword"
                  type="password"
                  class="password-input"
                  placeholder="输入密码..."
                  @keydown="handleKeydown"
                  autocomplete="off"
                />
                <button class="unlock-btn" @click="verifyPassword">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12h14"/>
                    <path d="m12 5 7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
            <Transition name="slide-fade">
              <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
            </Transition>
          </div>
        </div>
      </Transition>
      
      <!-- 内容区域 -->
      <div 
        ref="contentRef" 
        class="encrypted-content"
        :class="{ 'content-hidden': isLocked }"
      >
        <slot />
      </div>
      
      <!-- 锁定按钮 -->
      <Transition name="fade">
        <button 
          v-if="!isLocked" 
          class="relock-btn"
          @click="relock"
          title="重新锁定"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>锁定</span>
        </button>
      </Transition>
    </template>
  </div>
</template>

<style scoped>
.encrypted-block {
  position: relative;
  margin: 1.5rem 0;
  border-radius: 12px;
  overflow: hidden;
}

/* ==================== 标准模式 ==================== */
.encrypted-block.is-locked:not(.is-compact) {
  min-height: 280px;
  background: linear-gradient(135deg, #f5f5f7 0%, #e8e8ed 100%);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

:root.dark .encrypted-block.is-locked:not(.is-compact) {
  background: linear-gradient(135deg, #2a2a2e 0%, #1e1e21 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* 遮罩层 */
.encrypted-overlay {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  width: 100%;
  max-width: 340px;
  padding: 1rem;
  box-sizing: border-box;
}

.overlay-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 1.75rem 2rem;
  text-align: center;
  box-shadow: 
    0 4px 24px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

:root.dark .overlay-content {
  background: rgba(40, 40, 45, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 4px 24px rgba(0, 0, 0, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.2);
}

.lock-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
  line-height: 1;
  filter: grayscale(20%);
}

.lock-icon :deep(svg) {
  width: 40px;
  height: 40px;
  color: #6b7280;
}

:root.dark .lock-icon :deep(svg) {
  color: #9ca3af;
}

.lock-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

:root.dark .lock-title {
  color: #f3f4f6;
}

.lock-texts {
  margin-bottom: 1.25rem;
}

.lock-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0;
  line-height: 1.5;
}

:root.dark .lock-text {
  color: #9ca3af;
}

.password-input-wrapper {
  margin-bottom: 0.5rem;
}

.input-group {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.input-group:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

:root.dark .input-group {
  background: #1f1f23;
  border-color: #3f3f46;
}

:root.dark .input-group:focus-within {
  border-color: #818cf8;
  box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.15);
}

.password-input {
  flex: 1;
  padding: 0.7rem 0.875rem;
  border: none;
  font-size: 16px;
  background: transparent;
  color: #1f2937;
  outline: none;
  min-width: 0;
}

:root.dark .password-input {
  color: #f3f4f6;
}

.password-input::placeholder {
  color: #9ca3af;
}

.unlock-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin: 2px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.unlock-btn:hover {
  filter: brightness(1.05);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);
}

.error-msg {
  font-size: 0.8rem;
  color: #ef4444;
  margin: 0.5rem 0 0 0;
  padding: 0.4rem 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
}

:root.dark .error-msg {
  background: rgba(239, 68, 68, 0.15);
}

/* 内容区域 */
.encrypted-content {
  transition: opacity 0.3s ease, filter 0.3s ease;
}

.encrypted-content.content-hidden {
  filter: blur(8px);
  user-select: none;
  pointer-events: none;
  opacity: 0.3;
}

/* 锁定按钮 */
.relock-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  color: #6b7280;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 5;
  -webkit-tap-highlight-color: transparent;
}

.relock-btn:hover {
  background: #fff;
  color: #374151;
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

:root.dark .relock-btn {
  background: rgba(40, 40, 45, 0.9);
  border-color: #3f3f46;
  color: #9ca3af;
}

:root.dark .relock-btn:hover {
  background: #2a2a2e;
  color: #d1d5db;
  border-color: #52525b;
}

/* ==================== 紧凑模式 ==================== */
.encrypted-block.is-compact {
  margin: 0.75rem 0;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: linear-gradient(135deg, #f8f8fa 0%, #f0f0f5 100%);
  overflow: visible;
}

:root.dark .encrypted-block.is-compact {
  background: linear-gradient(135deg, #28282c 0%, #1e1e21 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.encrypted-block.is-compact:not(.is-locked) {
  background: transparent;
  border-color: transparent;
}

.compact-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.5);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
}

:root.dark .compact-header {
  background: rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.compact-left {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.compact-icon {
  font-size: 0.9rem;
  line-height: 1;
  filter: grayscale(20%);
}

.compact-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #4b5563;
}

:root.dark .compact-title {
  color: #d1d5db;
}

.compact-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  justify-content: flex-end;
  min-width: 160px;
}

.compact-input-group {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.compact-input-group:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

:root.dark .compact-input-group {
  background: #1f1f23;
  border-color: #3f3f46;
}

:root.dark .compact-input-group:focus-within {
  border-color: #818cf8;
  box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.12);
}

.compact-input {
  width: 90px;
  padding: 0.3rem 0.5rem;
  border: none;
  font-size: 0.8rem;
  background: transparent;
  color: #1f2937;
  outline: none;
}

:root.dark .compact-input {
  color: #f3f4f6;
}

.compact-input::placeholder {
  color: #9ca3af;
  font-size: 0.75rem;
}

.compact-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  margin: 2px;
  border: none;
  border-radius: 5px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.compact-btn:hover {
  filter: brightness(1.05);
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
}

.compact-error {
  font-size: 0.7rem;
  color: #ef4444;
  white-space: nowrap;
}

/* 紧凑模式内容区 */
.compact-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.75rem;
  gap: 0.5rem;
}

.compact-body .encrypted-content {
  flex: 1;
  min-width: 0;
}

.encrypted-content.content-hidden-compact {
  filter: blur(4px);
  opacity: 0.5;
  user-select: none;
  pointer-events: none;
}

.relock-btn-inline {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.8);
  color: #6b7280;
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  white-space: nowrap;
}

.relock-btn-inline:hover {
  background: #fff;
  color: #374151;
  border-color: #d1d5db;
}

:root.dark .relock-btn-inline {
  background: rgba(40, 40, 45, 0.8);
  border-color: #3f3f46;
  color: #9ca3af;
}

:root.dark .relock-btn-inline:hover {
  background: #2a2a2e;
  color: #d1d5db;
}

/* ==================== 动画 ==================== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 抖动动画 */
.shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-4px); }
  40%, 60% { transform: translateX(4px); }
}

.encrypted-overlay.shake {
  animation: shake-centered 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake-centered {
  10%, 90% { transform: translateX(calc(-50% - 1px)); }
  20%, 80% { transform: translateX(calc(-50% + 2px)); }
  30%, 50%, 70% { transform: translateX(calc(-50% - 4px)); }
  40%, 60% { transform: translateX(calc(-50% + 4px)); }
}

/* ==================== 响应式 ==================== */
@media (max-width: 640px) {
  .encrypted-block:not(.is-compact) {
    min-height: 260px;
  }
  
  .encrypted-overlay {
    padding: 0.75rem;
    max-width: calc(100% - 1.5rem);
  }
  
  .overlay-content {
    padding: 1.5rem 1.25rem;
  }
  
  .lock-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  
  .lock-title {
    font-size: 1.05rem;
  }
  
  .lock-text {
    font-size: 0.8rem;
  }
  
  .lock-texts {
    margin-bottom: 1rem;
  }
  
  /* 紧凑模式响应式 */
  .compact-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.4rem;
    padding: 0.4rem 0.6rem;
  }
  
  .compact-left {
    justify-content: center;
  }
  
  .compact-right {
    flex-direction: column;
    min-width: 0;
    gap: 0.3rem;
  }
  
  .compact-input-group {
    width: 100%;
  }
  
  .compact-input {
    flex: 1;
    width: auto;
  }
  
  .compact-body {
    flex-direction: column;
    align-items: stretch;
    gap: 0.4rem;
  }
  
  .relock-btn-inline {
    align-self: flex-end;
  }
}
</style>