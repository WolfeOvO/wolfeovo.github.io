<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useData, useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import BlogHome from './blogHome.vue'
import IconRenderer from './iconRenderer.vue'

const { Layout } = DefaultTheme
const { frontmatter, theme } = useData()
const route = useRoute()

const isPlume = ref(false)

const isHomePage = computed(() => frontmatter.value.layout === 'home')
const showBlogHome = computed(() => isPlume.value && isHomePage.value)

// 博客导航图标配置
const blogIcons = computed(() => theme.value.blogIcons || {})
const navItems = computed(() => [
  { text: '博客', link: '/', icon: blogIcons.value.home || '📝' },
  { text: '标签', link: '/blog/tags', icon: blogIcons.value.tags || '🏷️' },
  { text: '归档', link: '/blog/archives', icon: blogIcons.value.archives || '📅' },
  { text: '合辑', link: '/blog/series', icon: blogIcons.value.series || '📚' },
])

function checkPlumeMode() {
  if (typeof document !== 'undefined') {
    isPlume.value = document.documentElement.getAttribute('data-skin') === 'plume'
  }
}

function enforceModeByRoute(path) {
  if (typeof document === 'undefined') return
  const isBlogSection = path.startsWith('/blog/')
  const isHome = path === '/' || path === '/index.html'
  const htmlEl = document.documentElement

  if (isBlogSection) {
    // 访问 /blog/ 下的页面 → 强制进入博客模式
    if (htmlEl.getAttribute('data-skin') !== 'plume') {
      htmlEl.setAttribute('data-skin', 'plume')
      localStorage.setItem('wolfe-theme-mode', 'plume')
      isPlume.value = true
    }
  } else if (!isHome) {
    // 访问非首页的普通文档 → 强制退出博客模式
    if (htmlEl.getAttribute('data-skin') === 'plume') {
      htmlEl.removeAttribute('data-skin')
      localStorage.setItem('wolfe-theme-mode', 'default')
      isPlume.value = false
    }
  }
}

// ★ 简化后的切换逻辑：始终跳转到首页 /
function toggleMode() {
  if (isPlume.value) {
    // 博客模式 → 普通模式，回到首页（显示 homepage.md）
    document.documentElement.removeAttribute('data-skin')
    localStorage.setItem('wolfe-theme-mode', 'default')
    isPlume.value = false
  } else {
    // 普通模式 → 博客模式，回到首页（显示 blogHome）
    document.documentElement.setAttribute('data-skin', 'plume')
    localStorage.setItem('wolfe-theme-mode', 'plume')
    isPlume.value = true
  }
  window.location.href = '/'
}

watch(() => route.path, (newPath) => enforceModeByRoute(newPath), { immediate: true })

onMounted(() => {
  const saved = localStorage.getItem('wolfe-theme-mode')
  if (saved === 'plume') {
    document.documentElement.setAttribute('data-skin', 'plume')
    isPlume.value = true
  }
  checkPlumeMode()

  const observer = new MutationObserver(() => checkPlumeMode())
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-skin']
  })
})
</script>

<template>
  <Layout>
    <template #nav-bar-content-before>
      <nav class="plume-nav desktop-only">
        <a v-for="item in navItems" :key="item.link" :href="item.link" class="plume-nav-link" :class="{ active: item.link === '/' ? isHomePage : route.path.startsWith(item.link) }">
          <IconRenderer :icon="item.icon" class="plume-nav-icon" />
          {{ item.text }}
        </a>
      </nav>
    </template>

    <template #layout-top>
      <nav v-if="isPlume" class="plume-nav-mobile">
        <a v-for="item in navItems" :key="item.link" :href="item.link" class="plume-nav-link" :class="{ active: item.link === '/' ? isHomePage : route.path.startsWith(item.link) }">
          <IconRenderer :icon="item.icon" class="plume-nav-icon" />
          {{ item.text }}
        </a>
      </nav>
    </template>

    <template #nav-bar-content-after>
      <button class="wolfe-toggle-btn" :class="{ active: isPlume }" :title="isPlume ? '切换到文档模式' : '切换到博客模式'" @click="toggleMode">
        <svg v-if="!isPlume" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path><line x1="9" y1="7" x2="16" y2="7"></line><line x1="9" y1="11" x2="14" y2="11"></line></svg>
      </button>
    </template>

    <template #home-hero-before v-if="showBlogHome">
      <div class="plume-blog-overlay">
        <BlogHome />
      </div>
    </template>
  </Layout>
</template>

<style>
/* ====== 1. 全局及切换按钮 (基础样式) ====== */
.VPNavBarMenu .VPLink[href*="/blog/series"] {
  display: none !important;
}

.wolfe-toggle-btn {
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
  margin-left: 4px;
}
.wolfe-toggle-btn:hover, .wolfe-toggle-btn.active { color: var(--vp-c-brand-1); }

/* ====== 2. 博客模式 (data-skin="plume") 深度隐藏逻辑 ====== */
/* 必须加 !important 确保在任何情况下都杀掉默认组件 */
html[data-skin="plume"] .VPHero,
html[data-skin="plume"] .VPFeatures,
html[data-skin="plume"] .VPNavBarMenu,
html[data-skin="plume"] .VPNavBarSearch,
html[data-skin="plume"] .VPSidebar,
html[data-skin="plume"] .VPContent.is-home .vp-doc.container {
  display: none !important;
}

html[data-skin="plume"] .VPHome {
  background: transparent !important;
  padding: 0 !important;
}

html[data-skin="plume"] .VPContent.is-home {
  background: var(--plume-bg, #f5f7fa) !important;
}
html[data-skin="plume"].dark .VPContent.is-home {
  background: var(--plume-bg, #161820) !important;
}

/* ====== 3. 桌面端导航 (PC展示) ====== */
.plume-nav { display: none; }
@media (min-width: 960px) {
  html[data-skin="plume"] .plume-nav {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: 16px;
  }
}

/* ====== 4. 移动端磁吸导航 (核心修复) ====== */
.plume-nav-mobile { display: none; }

@media (max-width: 960px) {
  html[data-skin="plume"] .plume-nav-mobile {
    display: flex !important;
    /* 改用 fixed 确保它绝不会因为容器问题而无法吸附 */
    position: fixed;
    /* 核心：钉在原生导航栏下方 */
    top: var(--vp-nav-height); 
    left: 0;
    right: 0;
    /* 关键：设置一个略低于顶栏但高于内容的层级 */
    z-index: 30; 
    
    height: 52px;
    align-items: center;
    padding: 0 12px;
    gap: 8px;
    
    background: var(--vp-c-bg);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--vp-c-divider);
    
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .plume-nav-mobile::-webkit-scrollbar { display: none; }

  /* 核心：内容区补偿。因为导航栏变 fixed 了，不占位，内容会上浮，
     所以必须给内容区加一个“原顶栏高度 + 胶囊栏高度”的 Padding */
  html[data-skin="plume"] .VPContent {
    padding-top: calc(var(--vp-nav-height) + 52px) !important;
  }

  /* 修复磁吸后被遮住的问题：确保主体内容层级低于胶囊栏 */
  html[data-skin="plume"] .VPContent.is-home {
    position: relative;
    z-index: 1;
  }

  /* 手机端胶囊细节 */
  .plume-nav-mobile .plume-nav-link {
    background: var(--vp-c-bg-alt);
    border: 1px solid var(--vp-c-divider);
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 13px;
    flex-shrink: 0;
  }
}

/* ====== 5. 通用链接样式 ====== */
.plume-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  text-decoration: none !important;
}
.plume-nav-link:hover { color: var(--vp-c-brand-1); }
.plume-nav-link.active {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft) !important;
  border-color: var(--vp-c-brand-1) !important;
}

.plume-nav-icon { font-size: 14px; }

/* 博客组件容器 */
.plume-blog-overlay {
  position: relative;
  z-index: 2; /* 确保在背景之上 */
  width: 100%;
}
</style>