<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useData, useRoute, useRouter } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import BlogHome from './blogHome.vue'
import IconRenderer from './iconRenderer.vue'

const { frontmatter, theme } = useData()
const route = useRoute()
const router = useRouter()

// ========================================================================
// 1. 常量定义 (你指定的路径结构)
// ========================================================================
const DOCS_HOME = '/docs/homepage'
const BLOG_HOME = '/'
const BLOG_PATH_PREFIX = '/blog/'

// 判断路径是否属于博客侧（SSR安全纯函数）
function isBlogSidePath(path) {
  if (!path) return false
  return path === '/' || path.includes(BLOG_PATH_PREFIX)
}

// ========================================================================
// 2. 状态初始化 (SSR 安全)
// ========================================================================
const isPlume = ref(false)

// 在 SSR 阶段仅根据路径做最简单的判断，避免复杂逻辑导致的死循环
if (route.path && isBlogSidePath(route.path)) {
  isPlume.value = true
}

const isHomePage = computed(() => frontmatter.value.layout === 'home')
const showBlogHome = computed(() => isPlume.value && isHomePage.value)

// 导航图标配置
const blogIcons = computed(() => theme.value.blogIcons || {})
const navItems = computed(() => [
  { text: '博客', link: '/', icon: blogIcons.value.home || '📝' },
  { text: '标签', link: '/blog/tags', icon: blogIcons.value.tags || '🏷️' },
  { text: '归档', link: '/blog/archives', icon: blogIcons.value.archives || '📅' },
  { text: '合辑', link: '/blog/series', icon: blogIcons.value.series || '📚' },
])

// ========================================================================
// 3. 客户端交互逻辑 (仅在浏览器执行)
// ========================================================================

function applyModeState(enable) {
  isPlume.value = enable
  if (typeof document !== 'undefined') {
    if (enable) {
      document.documentElement.setAttribute('data-skin', 'plume')
      localStorage.setItem('wolfe-theme-mode', 'plume')
    } else {
      document.documentElement.removeAttribute('data-skin')
      localStorage.setItem('wolfe-theme-mode', 'default')
    }
  }
}

// 切换按钮逻辑：保存现场 -> 计算目标 -> 切换跳转
async function toggleMode() {
  const currentPath = route.path
  const nextModeIsPlume = !isPlume.value

  // A. 保存现场
  const key = isPlume.value ? 'wolfe-last-blog-path' : 'wolfe-last-doc-path'
  localStorage.setItem(key, currentPath)

  // B. 计算目标
  let targetPath = ''
  if (nextModeIsPlume) {
    // 准备切往博客：读取历史 -> 强制校验
    targetPath = localStorage.getItem('wolfe-last-blog-path') || BLOG_HOME
    if (!isBlogSidePath(targetPath)) targetPath = BLOG_HOME
  } else {
    // 准备切往文档：读取历史 -> 强制校验
    targetPath = localStorage.getItem('wolfe-last-doc-path') || DOCS_HOME
    if (isBlogSidePath(targetPath)) targetPath = DOCS_HOME
  }

  // C. 执行切换
  applyModeState(nextModeIsPlume)
  
  if (currentPath !== targetPath) {
    await router.go(targetPath)
  }
}

onMounted(() => {
  // 1. 初始化校验：根据当前 URL 强制设定模式 (防止 Hydration 不匹配)
  const path = route.path
  if (isBlogSidePath(path)) {
    applyModeState(true)
  } else if (path.startsWith('/docs/')) {
    applyModeState(false)
  } else {
    // 模糊地带读取缓存
    const saved = localStorage.getItem('wolfe-theme-mode')
    applyModeState(saved === 'plume')
  }

  // 2. 路由监听：处理浏览器后退键 + 自动记录足迹
  watch(
    () => route.path,
    (newPath) => {
      const isBlog = isBlogSidePath(newPath)
      
      // 强制纠正模式（应对浏览器后退）
      if (isBlog && !isPlume.value) {
        applyModeState(true)
      } else if (!isBlog && isPlume.value) {
        // 只有明确进入文档区才切回，防止在根路径误判
        if (newPath.startsWith('/docs/') || newPath === DOCS_HOME) {
           applyModeState(false)
        }
      }

      // 记录足迹
      nextTick(() => {
        const key = isPlume.value ? 'wolfe-last-blog-path' : 'wolfe-last-doc-path'
        localStorage.setItem(key, newPath)
      })
    }
  )

  // 3. 防御性监听：防止 data-skin 被意外修改
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
  <!-- 关键修改：使用动态组件 :is="DefaultTheme.Layout" 避免递归引用导致的 Stack Overflow -->
  <component :is="DefaultTheme.Layout">
    <!-- 电脑端导航 -->
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

    <!-- 移动端导航 -->
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

    <!-- 模式切换按钮 -->
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

    <!-- 博客首页覆盖层 -->
    <template #home-hero-before v-if="showBlogHome">
      <div class="plume-blog-overlay">
        <BlogHome />
      </div>
    </template>
  </component>
</template>

<style>
/* 锁定导航栏 */
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

/* 移动端菜单 */
.plume-nav-mobile { display: none; }

@media (max-width: 960px) {
  html[data-skin="plume"] .plume-nav-mobile {
    display: flex;
    position: fixed;
    top: var(--vp-nav-height, 60px); 
    left: 0; right: 0;
    z-index: 19;
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

  html[data-skin="plume"] .VPLocalNav {
    top: calc(var(--vp-nav-height, 60px) + 48px) !important;
    z-index: 18 !important; 
  }

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

/* 隐藏与通用样式 */
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
</style>