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
const isHomePage = computed(() => frontmatter.value.layout === 'home')
const showBlogHome = computed(() => isPlume.value && isHomePage.value)

// ========================================================================
// 🛑 配置区：根据您的描述定义的默认入口
// ========================================================================
const DOCS_HOME = '/docs/homepage'  // 文档模式的默认首页
const BLOG_HOME = '/'               // 博客模式的默认首页
const BLOG_PATH_PREFIX = '/blog/'   // 博客文章路径特征

// 博客导航图标
const blogIcons = computed(() => theme.value.blogIcons || {})
const navItems = computed(() => [
  { text: '博客', link: '/', icon: blogIcons.value.home || '📝' },
  { text: '标签', link: '/blog/tags', icon: blogIcons.value.tags || '🏷️' },
  { text: '归档', link: '/blog/archives', icon: blogIcons.value.archives || '📅' },
  { text: '合辑', link: '/blog/series', icon: blogIcons.value.series || '📚' },
])

// ========================================================================
// 核心功能
// ========================================================================

// 1. 纯粹的模式切换（只动CSS/State）
function applyModeState(enable) {
  isPlume.value = enable
  if (enable) {
    document.documentElement.setAttribute('data-skin', 'plume')
    localStorage.setItem('wolfe-theme-mode', 'plume')
  } else {
    document.documentElement.removeAttribute('data-skin')
    localStorage.setItem('wolfe-theme-mode', 'default')
  }
}

// 2. 检查一个路径是不是属于“博客侧”
function isBlogSidePath(path) {
  // 首页在 Plume 模式下算博客侧，或者路径包含 /blog/
  return path === '/' || path.includes(BLOG_PATH_PREFIX)
}

/**
 * 3. 切换按钮点击事件（核心修复）
 * 逻辑：保存当前现场 -> 计算目标 -> 强制清洗目标 -> 切换CSS -> 跳转
 */
async function toggleMode() {
  const currentPath = route.path
  const nextModeIsPlume = !isPlume.value

  // --- A. 保存现场 ---
  // 如果我现在是文档模式，就把当前页存为“最后文档页”
  // 如果我现在是博客模式，就把当前页存为“最后博客页”
  if (isPlume.value) {
    localStorage.setItem('wolfe-last-blog-path', currentPath)
  } else {
    localStorage.setItem('wolfe-last-doc-path', currentPath)
  }

  // --- B. 计算并清洗目标路径 ---
  let targetPath = ''

  if (nextModeIsPlume) {
    // 准备切 -> 博客模式
    targetPath = localStorage.getItem('wolfe-last-blog-path') || BLOG_HOME
    
    // 【关键修复】如果取出来的路径竟然不是博客侧的（比如是 /docs/homepage），强制回博客首页
    if (!isBlogSidePath(targetPath)) {
      targetPath = BLOG_HOME
    }
  } else {
    // 准备切 -> 文档模式
    targetPath = localStorage.getItem('wolfe-last-doc-path') || DOCS_HOME
    
    // 【关键修复】如果取出来的路径竟然是博客侧的（比如 /blog/xxx），强制回文档首页
    if (isBlogSidePath(targetPath)) {
      targetPath = DOCS_HOME
    }
  }

  // --- C. 执行切换 ---
  // 1. 先换 CSS
  applyModeState(nextModeIsPlume)

  // 2. 再跳转 (如果已经在目标页，比如首页切首页，也要跳一下触发刷新或不做操作)
  if (currentPath !== targetPath) {
    await router.go(targetPath)
  }
}

// ========================================================================
// 路由监听：处理“后退”按钮导致的 CSS 不同步
// ========================================================================
watch(
  () => route.path,
  (newPath) => {
    if (typeof document === 'undefined') return
    
    // 自动判断当前 URL 属于哪一边
    const belongsToBlog = isBlogSidePath(newPath)
    
    // 如果 URL 是博客的，但 CSS 是文档的 -> 强制切成博客 CSS
    if (belongsToBlog && !isPlume.value) {
      applyModeState(true)
    }
    // 如果 URL 是文档的，但 CSS 是博客的 -> 强制切成文档 CSS
    // 注意：首页 '/' 比较特殊，如果用户在文档模式下访问根路径，通常还是视为博客入口，所以这里主要判断 /docs/
    else if (!belongsToBlog && isPlume.value) {
      // 只有明确进入非博客区域才切回文档模式
      applyModeState(false)
    }

    // 每次路由变化，顺便更新一下对应的历史记录（作为备份）
    nextTick(() => {
      if (isPlume.value) {
        localStorage.setItem('wolfe-last-blog-path', newPath)
      } else {
        localStorage.setItem('wolfe-last-doc-path', newPath)
      }
    })
  },
  { immediate: true }
)

// ========================================================================
// 初始化
// ========================================================================
onMounted(() => {
  // 1. 根据当前 URL 强行定性
  // 如果进来就是 /blog/ 或者根路径(通常是博客)，优先展示博客模式
  // 如果进来是 /docs/，优先展示文档模式
  if (route.path.includes(BLOG_PATH_PREFIX)) {
    applyModeState(true)
  } else if (route.path.startsWith('/docs/')) {
    applyModeState(false)
  } else {
    // 2. 如果是模糊地带（如自定义页面），读取缓存
    const saved = localStorage.getItem('wolfe-theme-mode')
    applyModeState(saved === 'plume')
  }

  // 3. 监听外部变化（防御性代码）
  const observer = new MutationObserver(() => {
    const hasAttr = document.documentElement.getAttribute('data-skin') === 'plume'
    if (isPlume.value !== hasAttr) {
      isPlume.value = hasAttr
    }
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-skin'] })
})
</script>

<template>
  <Layout>
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
        <!-- 图标：文档模式下显示方块，博客模式下显示文档 -->
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
  </Layout>
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