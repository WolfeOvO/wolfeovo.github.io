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
  texts: () => ['请输入密码后查看']
})

const { page } = useData()

const isLocked = ref(true)
const inputPassword = ref('')
const errorMsg = ref('')
const containerRef = ref<HTMLElement | null>(null)
const overlayRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const isShaking = ref(false)
const containerHeight = ref(0) // 实时追踪容器高度

// 存储密钥
const storageKey = computed(() => {
  return `encrypted-block-${page.value.relativePath}-${props.contentId}`
})

// 计算当前的布局模式
const layoutMode = computed(() => {
  if (containerHeight.value < 80) return 'mini' // 极小：单行横向
  if (containerHeight.value < 220) return 'compact' // 紧凑：隐藏图标/描述
  return 'normal' // 正常：全显示
})

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  // 1. 检查解锁状态
  const stored = localStorage.getItem(storageKey.value)
  if (stored === 'unlocked') {
    isLocked.value = false
    nextTick(showHeadings)
  } else {
    hideHeadings()
  }
  
  // 2. 初始化 ResizeObserver 监听容器高度变化
  if (containerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerHeight.value = entry.contentRect.height
        // 高度变化时重新计算定位
        requestAnimationFrame(updateOverlayPosition) 
      }
    })
    resizeObserver.observe(containerRef.value)
  }

  // 3. 事件监听
  window.addEventListener('scroll', updateOverlayPosition, { passive: true })
  window.addEventListener('resize', updateOverlayPosition, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateOverlayPosition)
  window.removeEventListener('resize', updateOverlayPosition)
  if (resizeObserver) resizeObserver.disconnect()
})

// 核心：视野跟随逻辑
function updateOverlayPosition() {
  if (!containerRef.value || !overlayRef.value || !isLocked.value) return
  
  const container = containerRef.value
  const overlay = overlayRef.value
  
  const containerRect = container.getBoundingClientRect()
  const overlayHeight = overlay.offsetHeight
  const viewportHeight = window.innerHeight
  
  // 基础样式重置
  overlay.style.position = 'absolute'
  overlay.style.transform = 'translate(-50%, 0)' // Y轴由 top 控制
  
  // 情况 A: 容器高度不足以容纳卡片 (或者刚好相等)
  // 策略: 绝对垂直居中
  if (containerRect.height <= overlayHeight) {
    overlay.style.top = '50%'
    overlay.style.transform = 'translate(-50%, -50%)'
    return
  }

  // 情况 B: 容器很高，需要跟随滚动
  // 计算卡片在容器内的理想位置：(视口中心 - 容器顶部位置) - 卡片一半高度
  const viewportCenterY = viewportHeight / 2
  const centerInContainer = viewportCenterY - containerRect.top
  const idealTop = centerInContainer - overlayHeight / 2
  
  // 边界限制：不能跑出容器顶部(padding)，也不能跑出容器底部
  const padding = 10 
  const minTop = padding
  const maxTop = containerRect.height - overlayHeight - padding
  
  const clampedTop = Math.max(minTop, Math.min(maxTop, idealTop))
  
  overlay.style.top = `${clampedTop}px`
}

// 隐藏标题逻辑保持不变
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
  // 隐藏 TOC 样式需在全局 CSS 处理，或者这里手动 display none
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
    errorMsg.value = layoutMode.value === 'mini' ? '!' : '密码错误'
    isShaking.value = true
    setTimeout(() => { isShaking.value = false }, 500)
  }
}

function relock() {
  isLocked.value = true
  inputPassword.value = ''
  localStorage.removeItem(storageKey.value)
  nextTick(() => {
    hideHeadings()
    // 强制重算一次布局，确保卡片模式正确
    if (containerRef.value) containerHeight.value = containerRef.value.offsetHeight
    updateOverlayPosition()
  })
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') verifyPassword()
}

watch(isLocked, (locked) => {
  if (locked) nextTick(updateOverlayPosition)
})
</script>

<template>
  <div 
    ref="containerRef" 
    class="encrypted-block"
    :class="{ 'is-locked': isLocked }"
  >
    <!-- 遮罩层容器 (Absolute覆盖) -->
    <Transition name="fade">
      <div 
        v-if="isLocked" 
        ref="overlayRef"
        class="encrypted-overlay-wrapper"
        :class="[`layout-${layoutMode}`, { 'shake': isShaking }]"
      >
        <div class="interaction-card">
          <!-- 区域1: 信息展示 (图标/标题/文本) -->
          <div v-if="layoutMode !== 'mini'" class="info-section">
            <div v-if="layoutMode === 'normal'" class="lock-icon" v-html="icon"></div>
            
            <div class="text-group">
              <h3 v-if="layoutMode !== 'mini'" class="lock-title">{{ title }}</h3>
              <div v-if="layoutMode === 'normal'" class="lock-texts">
                <p v-for="(text, index) in texts" :key="index">{{ text }}</p>
              </div>
            </div>
          </div>

          <!-- 区域2: 交互区域 (输入框/按钮/错误) -->
          <div class="input-section">
            <div class="input-group">
              <input
                v-model="inputPassword"
                type="password"
                class="password-input"
                :placeholder="layoutMode === 'mini' ? '密码...' : '输入密码查看...'"
                @keydown="handleKeydown"
              />
              <button class="unlock-btn" @click="verifyPassword" title="解锁">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                </svg>
              </button>
            </div>
            
            <!-- 错误提示: Normal模式下显示文字，Mini模式下通过Input红色边框或简单提示处理 -->
            <Transition name="slide-fade">
              <p v-if="errorMsg && layoutMode !== 'mini'" class="error-msg">{{ errorMsg }}</p>
            </Transition>
          </div>
        </div>
      </div>
    </Transition>
    
    <!-- 内容区域 (撑开父容器) -->
    <div 
      ref="contentRef" 
      class="encrypted-content"
      :class="{ 'content-hidden': isLocked }"
    >
      <slot />
    </div>
    
    <!-- 重新锁定按钮 -->
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
  overflow: hidden; /* 关键：裁剪内容，保持圆角 */
  /* 移除 min-height，高度完全由内容决定 */
}

.encrypted-block.is-locked {
  /* 锁定时的背景，防止内容被选中 */
  user-select: none;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

:root.dark .encrypted-block.is-locked {
  background: linear-gradient(135deg, #1f1f23 0%, #18181b 100%);
}

/* --- 内容区域 --- */
.encrypted-content {
  transition: opacity 0.3s, filter 0.3s;
}

.encrypted-content.content-hidden {
  filter: blur(12px);
  opacity: 0.4;
  pointer-events: none;
}

/* --- 遮罩层与卡片 --- */
.encrypted-overlay-wrapper {
  /* 绝对定位，不占据流空间 */
  position: absolute; 
  left: 50%;
  /* top 由 JS 动态计算 */
  z-index: 10;
  width: 90%;
  max-width: 340px;
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

/* --- 布局模式适配 --- */

/* Normal Mode (Default) */
.layout-normal .interaction-card {
  padding: 1.5rem;
  text-align: center;
}

/* Compact Mode (Height < 220px) */
.layout-compact .interaction-card {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: center;
}
.layout-compact .lock-title {
  margin: 0;
  font-size: 1rem;
}

/* Mini Mode (Height < 80px) - 极简横向布局 */
.layout-mini {
  /* 在极小高度下，宽度可以适当放宽以容纳横向元素 */
  max-width: 280px; 
}
.layout-mini .interaction-card {
  padding: 4px;
  border-radius: 50px; /* 胶囊形状 */
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
}
.layout-mini .input-section {
  width: 100%;
  margin: 0;
}
.layout-mini .input-group {
  border: none;
  background: transparent;
  box-shadow: none;
}
.layout-mini .password-input {
  padding: 0.25rem 0.75rem;
  font-size: 0.85rem;
}
.layout-mini .unlock-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

/* --- 通用组件样式 --- */
.lock-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}
.lock-title {
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
}
:root.dark .lock-title { color: #f3f4f6; }

.lock-texts {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.input-group {
  display: flex;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: 0.2s;
  overflow: hidden;
}
.input-group:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}
:root.dark .input-group {
  background: #27272a;
  border-color: #3f3f46;
}

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

.error-msg {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.5rem;
}

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

/* 动画 */
.shake {
  animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
@keyframes shake {
  10%, 90% { transform: translate3d(-51%, 0, 0); } /* 考虑 translateX(-50%) 的基础偏移 */
  20%, 80% { transform: translate3d(-49%, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-52%, 0, 0); }
  40%, 60% { transform: translate3d(-48%, 0, 0); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.3s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { opacity: 0; transform: translateY(-5px); }
</style>