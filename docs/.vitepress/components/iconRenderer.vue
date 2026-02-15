<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useData, useRoute, useRouter } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import BlogHome from './blogHome.vue'
import IconRenderer from './iconRenderer.vue'

const { Layout } = DefaultTheme
const { frontmatter, theme } = useData()
const route = useRoute()
const router = useRouter()

const isPlume = ref(false)

// 判断是否为首页
const isHomePage = computed(() => frontmatter.value.layout === 'home')
// 只有在 Plume 模式且为首页时，才显示 BlogHome 组件
const showBlogHome = computed(() => isPlume.value && isHomePage.value)

// 博客导航图标配置
const blogIcons = computed(() => theme.value.blogIcons || {})
const navItems = computed(() => [
  { text: '博客', link: '/', icon: blogIcons.value.home || '📝' },
  { text: '标签', link: '/blog/tags', icon: blogIcons.value.tags || '🏷️' },
  { text: '归档', link: '/blog/archives', icon: blogIcons.value.archives || '📅' },
  { text: '合辑', link: '/blog/series', icon: blogIcons.value.series || '📚' },
])

// ========================================================================
// 核心逻辑：模式应用与记忆
// ========================================================================

/**
 * 设置当前模式（修改 DOM 和 状态）
 * @param {Boolean} enable true=博客模式, false=文档模式
 */
function applyMode(enable) {
  isPlume.value = enable
  if (enable) {
    document.documentElement.setAttribute('data-skin', 'plume')
    localStorage.setItem('wolfe-theme-mode', 'plume')
  } else {
    document.documentElement.removeAttribute('data-skin')
    localStorage.setItem('wolfe-theme-mode', 'default')
  }
}

/**
 * 记录当前路径到对应的模式历史中
 * 在路由变化后调用
 */
function recordPath(path) {
  if (typeof window === 'undefined') return

  // 忽略一些不需要记忆的中间状态或特殊页面
  if (path.includes('404')) return

  if (isPlume.value) {
    // 当前是博客模式，记录到博客历史
    localStorage.setItem('wolfe-last-blog-path', path)
  } else {
    // 当前是文档模式，记录到文档历史
    localStorage.setItem('wolfe-last-doc-path', path)
  }
}

/**
 * 切换模式按钮点击事件
 * 逻辑：切换模式状态 + 跳转到该模式最后访问的页面
 */
function toggleMode() {
  const nextMode = !isPlume.value
  let targetPath = '/'

  if (nextMode) {
    // 即将切换到 -> 博客模式
    // 读取上次离开博客时的路径，如果没有则去首页
    targetPath = localStorage.getItem('wolfe-last-blog-path') || '/'
  } else {
    // 即将切换到 -> 文档模式
    // 读取上次离开文档时的路径，如果没有则去首页
    targetPath = localStorage.getItem('wolfe-last-doc-path') || '/'
  }

  // 执行切换动画和跳转
  const doSwitch = async () => {
    applyMode(nextMode) // 1. 切换 CSS/State
    
    // 2. 如果目标路径和当前路径不同，进行跳转
    if (route.path !== targetPath) {
      await router.go(targetPath)
    } else {
      // 如果路径相同（比如都是首页），强制刷新一下记录，确保状态正确
      recordPath(targetPath)
    }
  }

  // 使用 View Transition API 实现丝滑切换（如果支持）
  if (document.startViewTransition) {
    document.startViewTransition(() => doSwitch())
  } else {
    doSwitch()
  }
}

// ========================================================================
// 路由监听：处理“后退/前进”按钮导致的模式错乱 + 自动记录
// ========================================================================

watch(
  () => route.path,
  (newPath) => {
    if (typeof document === 'undefined') return

    const isBlogPath = newPath.startsWith('/blog/')
    
    // 1. 强制模式修正逻辑 (解决浏览器后退按钮导致的 CSS 不匹配问题)
    if (isBlogPath && !isPlume.value) {
      // 如果进入了 /blog/ 路径但还是文档模式 -> 强制切为博客模式
      applyMode(true)
    } 
    else if (!isBlogPath && isPlume.value && newPath !== '/') {
      // 如果进入了非 /blog/ 且非首页的路径，但开着博客模式 ->
      // 这里需要小心：因为首页 '/' 在博客模式下是合法的。
      // 但如果你有明确的文档路径（如 /guide/），则应该强制切回文档模式。
      // 这里做一个简单判断：如果之前是在文档模式浏览该页面的，切回去。
      
      // 这里的逻辑稍微宽松一点，避免误切：
      // 只有当路径明显不属于博客（例如 /储物间/），才强制切回默认
      // 你可以根据你的目录结构调整这里的判断
      const isContentPage = newPath.match(/^\/(储物间|墙外指南|guide|docs)\//)
      if (isContentPage) {
        applyMode(false)
      }
    }

    // 2. 记录路径 (延时一下确保 mode 已经修正)
    nextTick(() => {
      recordPath(newPath)
    })
  },
  { immediate: true }
)

// ========================================================================
// 初始化逻辑
// ========================================================================
onMounted(() => {
  // 1. 读取保存的模式
  const savedMode = localStorage.getItem('wolfe-theme-mode')
  
  // 2. 根据当前 URL 优先级判断
  // 如果用户直接通过 URL 访问 /blog/xxx，无论存的什么，必须是 Plume 模式
  if (route.path.startsWith('/blog/')) {
    applyMode(true)
  } 
  // 如果没有强制路径要求，则恢复用户上次的选择
  else if (savedMode === 'plume') {
    applyMode(true)
  } else {
    applyMode(false)
  }

  // 3. 初始化路径记忆（如果是第一次访问，存一下当前路径）
  if (!localStorage.getItem('wolfe-last-doc-path')) {
    localStorage.setItem('wolfe-last-doc-path', '/')
  }
  if (!localStorage.getItem('wolfe-last-blog-path')) {
    localStorage.setItem('wolfe-last-blog-path', '/')
  }
  
  // 记录初始路径
  recordPath(route.path)

  // 4. 监听外部 DOM 变化（防止其他插件修改 data-skin 导致状态不同步）
  const observer = new MutationObserver(() => {
    const hasAttr = document.documentElement.getAttribute('data-skin') === 'plume'
    if (isPlume.value !== hasAttr) {
      isPlume.value = hasAttr
    }
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-skin']
  })
})
</script>

<template>
  <Layout>
    <!-- 1. 电脑端导航 -->
    <template #nav-bar-content-before>
      <nav class="plume-nav desktop-only">
        <a 
          v-for="item in navItems" 
          :key="item.link" 
          :href="item.link" 
          class="plume-nav-link" 
          :class="{ active: item.link === '/' ? isHomePage : route.path.startsWith(item.link) }"
        >
          <IconRenderer :icon="item.icon" class="plume-nav-icon" />
          {{ item.text }}
        </a>
      </nav>
    </template>

    <!-- 2. 移动端导航 -->
    <template #layout-top>
      <ClientOnly>
        <Teleport to="body">
          <nav v-if="isPlume" class="plume-nav-mobile">
            <a 
              v-for="item in navItems" 
              :key="item.link" 
              :href="item.link" 
              class="plume-nav-link" 
              :class="{ active: item.link === '/' ? isHomePage : route.path.startsWith(item.link) }"
            >
              <IconRenderer :icon="item.icon" class="plume-nav-icon" />
              {{ item.text }}
            </a>
          </nav>
        </Teleport>
      </ClientOnly>
    </template>

    <!-- 3. 模式切换按钮 -->
    <template #nav-bar-content-after>
      <button 
        class="wolfe-toggle-btn" 
        :class="{ active: isPlume }" 
        :title="isPlume ? '切换到文档模式' : '切换到博客模式'" 
        @click="toggleMode"
      >
        <svg v-if="!isPlume" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path><line x1="9" y1="7" x2="16" y2="7"></line><line x1="9" y1="11" x2="14" y2="11"></line></svg>
      </button>
    </template>

    <!-- 4. 博客首页覆盖层 -->
    <template #home-hero-before v-if="showBlogHome">
      <div class="plume-blog-overlay">
        <BlogHome />
      </div>
    </template>
  </Layout>
</template>

<style>
/* ==================================================
   1. 锁定导航栏 (VPNav + VPNavBar)
   ================================================== */
html[data-skin="plume"] .VPNav,
html[data-skin="plume"] .VPNavBar {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  transform: none !important;
  transition: none !important;
  z-index: 20 !important;
}
html[data-skin="plume"] .VPNavBar {
  background-color: var(--vp-c-bg) !important;
  border-bottom: 1px solid var(--vp-c-divider) !important;
}

/* ==================================================
   2. 移动端适配 (Mobile Only)
   ================================================== */
.plume-nav-mobile { display: none; }

@media (max-width: 960px) {
  html[data-skin="plume"] .plume-nav-mobile {
    display: flex;
    position: fixed;
    /* 放在原生导航栏下方 */
    top: var(--vp-nav-height, 60px); 
    left: 0; right: 0;
    z-index: 19; /* 比原生导航低，比大纲栏高 */
    height: 48px;
    align-items: center;
    padding: 0 16px;
    gap: 12px;
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    background: rgba(255, 255, 255, 0.98);
    border-bottom: 1px solid var(--vp-c-divider);
    box-shadow: 0 4px 6px rgba(0,0,0,0.04);
  }
  
  html[data-skin="plume"].dark .plume-nav-mobile {
    background: rgba(30, 30, 32, 0.98);
  }
  .plume-nav-mobile::-webkit-scrollbar { display: none; }

  /* =========================================================
     ★ 关键修复：把“大纲栏” (.VPLocalNav) 往下挤
     解决重叠问题
     ========================================================= */
  html[data-skin="plume"] .VPLocalNav {
    /* 
      原始值通常是 var(--vp-nav-height) (60px)
      我们改为：60px (原生导航) + 48px (自定义导航) = 108px
    */
    top: calc(var(--vp-nav-height, 60px) + 48px) !important;
    
    /* 确保层级在我们的自定义导航之下，避免互相穿插 */
    z-index: 18 !important; 
  }

  /* 调整内容区域 Padding，给两个导航栏腾出空间 */
  html[data-skin="plume"] .VPContent, 
  html[data-skin="plume"] .VPContent.is-home {
    padding-top: calc(var(--vp-nav-height, 60px) + 68px) !important;
  }
  
  .plume-nav-mobile .plume-nav-link {
    flex-shrink: 0;
    background: var(--vp-c-bg-alt);
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 13px;
    border: 1px solid transparent;
  }
  .plume-nav-mobile .plume-nav-link.active {
    background: var(--vp-c-brand-soft);
    border-color: var(--vp-c-brand-1);
    color: var(--vp-c-brand-1);
  }
}

/* ==================================================
   3. 隐藏与通用样式 (保持不变)
   ================================================== */
html[data-skin="plume"] .VPNavBarMenu,
html[data-skin="plume"] .VPNavBarSearch,
html[data-skin="plume"] .VPHero,
html[data-skin="plume"] .VPFeatures,
html[data-skin="plume"] .VPContent.is-home .vp-doc.container {
  display: none !important;
}
html[data-skin="plume"] .VPHome { background: transparent !important; padding-bottom: 0 !important; }
html[data-skin="plume"] .VPContent.is-home { background: var(--plume-bg, #f5f7fa) !important; }
html[data-skin="plume"].dark .VPContent.is-home { background: var(--plume-bg, #161820) !important; }
html[data-skin="plume"] .VPDoc .container,
html[data-skin="plume"] .VPDoc:not(.has-sidebar) .container,
html[data-skin="plume"] .VPDoc:not(.has-sidebar) .content {
  max-width: 100% !important; padding: 0 !important;
}

/* Desktop Only Logic */
.plume-nav.desktop-only { display: none; }
@media (min-width: 960px) {
  html[data-skin="plume"] .plume-nav.desktop-only {
    display: flex; align-items: center; gap: 4px; margin-left: 16px;
  }
}

.plume-nav-link {
  display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px;
  font-size: 14px; font-weight: 500; color: var(--vp-c-text-2);
  text-decoration: none; border-radius: 8px; transition: all 0.2s;
}
.plume-nav-icon { font-size: 14px; }
.plume-nav-link:hover { color: var(--vp-c-brand-1); }
.wolfe-toggle-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 8px; margin-left: 4px;
  color: var(--vp-c-text-2); transition: background 0.2s;
}
.wolfe-toggle-btn:hover { background: var(--vp-c-bg-alt); color: var(--vp-c-brand-1); }
.wolfe-toggle-btn.active { color: var(--vp-c-brand-1); }

/* ==================================================
   4. View Transition 动画样式
   ================================================== */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
}
</style>