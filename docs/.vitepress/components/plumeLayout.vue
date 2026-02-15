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
/* ==================================================
   1. 核心逻辑：博客模式下，强行隐藏默认主题元素
   ================================================== */
html[data-skin="plume"] .VPNavBarMenu,
html[data-skin="plume"] .VPNavBarSearch,
html[data-skin="plume"] .VPHero,
html[data-skin="plume"] .VPFeatures,
html[data-skin="plume"] .VPContent.is-home .vp-doc.container {
  display: none !important;
}

/* 隐藏首页默认背景，适配深色模式 */
html[data-skin="plume"] .VPHome {
  background: transparent !important;
  padding-bottom: 0 !important;
}
html[data-skin="plume"] .VPContent.is-home {
  background: var(--plume-bg, #f5f7fa) !important;
}
html[data-skin="plume"].dark .VPContent.is-home {
  background: var(--plume-bg, #161820) !important;
}

/* 去除内容最大宽度限制，让博客组件铺满 */
html[data-skin="plume"] .VPDoc .container,
html[data-skin="plume"] .VPDoc:not(.has-sidebar) .container,
html[data-skin="plume"] .VPDoc:not(.has-sidebar) .content {
  max-width: 100% !important;
  padding: 0 !important;
}

/* ==================================================
   2. 桌面端导航 (Desktop Only)
   ================================================== */
.plume-nav.desktop-only {
  display: none;
}
/* 仅在电脑端(>960px)且为博客模式时显示 */
@media (min-width: 960px) {
  html[data-skin="plume"] .plume-nav.desktop-only {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: 16px;
  }
}

/* ==================================================
   3. 移动端导航 (Mobile Only) - 修复磁吸问题
   ================================================== */
.plume-nav-mobile {
  display: none; /* 默认不显示，防止电脑端出现 */
}

@media (max-width: 960px) {
  /* 只有在博客模式下才显示移动端导航 */
  html[data-skin="plume"] .plume-nav-mobile {
    display: flex;
    
    /* ★★★ 核心修复：磁吸定位 ★★★ */
    position: fixed;
    /* 紧贴在 VitePress 原生导航栏(通常60px左右)下方 */
    top: var(--vp-nav-height); 
    left: 0;
    right: 0;
    z-index: 20; /* 确保在内容之上，但在侧边栏之下 */

    /* 样式美化 */
    height: 48px; /* 固定高度 */
    align-items: center;
    padding: 0 16px;
    gap: 12px;
    
    /* 横向滚动 (防止标签太多换行) */
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none; /* Firefox 隐藏滚动条 */

    /* 毛玻璃背景 */
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--vp-c-divider);
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  }
  
  /* 深色模式适配 */
  html[data-skin="plume"].dark .plume-nav-mobile {
    background: rgba(30, 30, 32, 0.85);
  }

  /* 隐藏滚动条 (Chrome/Safari) */
  .plume-nav-mobile::-webkit-scrollbar {
    display: none;
  }

  /* ★★★ 核心修复：防止内容被遮挡 ★★★ */
  /* 因为导航栏fixed了，所以内容由于脱离文档流会上移，必须加 padding 顶下来 */
  html[data-skin="plume"] .VPContent {
    /* 原生导航栏高度 + 我们自定义导航栏高度(48px) + 一点间隙 */
    padding-top: calc(var(--vp-nav-height) + 56px) !important;
  }
  
  /* 调整胶囊样式更像 APP */
  .plume-nav-mobile .plume-nav-link {
    flex-shrink: 0; /* 防止被挤压 */
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
   4. 通用链接样式
   ================================================== */
.plume-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s;
}

.plume-nav-icon {
  font-size: 14px;
}

.plume-nav-link:hover {
  color: var(--vp-c-brand-1);
}

.wolfe-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  margin-left: 4px;
  color: var(--vp-c-text-2);
  transition: background 0.2s;
}
.wolfe-toggle-btn:hover {
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-brand-1);
}
.wolfe-toggle-btn.active {
  color: var(--vp-c-brand-1);
}
</style>