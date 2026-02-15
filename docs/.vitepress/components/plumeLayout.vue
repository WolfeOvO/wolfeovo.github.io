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
    if (htmlEl.getAttribute('data-skin') !== 'plume') {
      htmlEl.setAttribute('data-skin', 'plume')
      localStorage.setItem('wolfe-theme-mode', 'plume')
      isPlume.value = true
    }
  } else if (!isHome) {
    if (htmlEl.getAttribute('data-skin') === 'plume') {
      htmlEl.removeAttribute('data-skin')
      localStorage.setItem('wolfe-theme-mode', 'default')
      isPlume.value = false
    }
  }
}

function toggleMode() {
  if (isPlume.value) {
    document.documentElement.removeAttribute('data-skin')
    localStorage.setItem('wolfe-theme-mode', 'default')
    isPlume.value = false
  } else {
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

    <!-- 2. 移动端导航 (使用 Teleport 确保层级) -->
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
   1. 终极修复：彻底锁定导航栏 (The "Magnetic" Fix)
   ================================================== */
/* 核心修改：同时锁定 VPNav (父容器) 和 VPNavBar (子容器) */
html[data-skin="plume"] .VPNav,
html[data-skin="plume"] .VPNavBar {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  /* 强制禁止 transforms 移动 */
  transform: none !important;
  transition: none !important;
  /* 确保在最顶层，但不要遮挡移动端菜单 */
  z-index: 20 !important;
}

/* 修复背景可能透明的问题 */
html[data-skin="plume"] .VPNavBar {
  background-color: var(--vp-c-bg) !important;
  border-bottom: 1px solid var(--vp-c-divider) !important;
}

/* ==================================================
   2. 移动端导航 (Mobile Only)
   ================================================== */
.plume-nav-mobile {
  display: none;
}

@media (max-width: 960px) {
  html[data-skin="plume"] .plume-nav-mobile {
    display: flex;
    /* 固定定位 */
    position: fixed;
    /* 
       重要：使用 CSS 变量，但提供兜底值 60px。
       因为 VPNav 被我们强制固定在 top:0，所以这里紧贴着它 
    */
    top: var(--vp-nav-height, 60px); 
    left: 0;
    right: 0;
    z-index: 19; /* 放在原生导航栏(z-index:20)下面 */

    height: 48px;
    align-items: center;
    padding: 0 16px;
    gap: 12px;
    
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    /* 加强背景不透明度，防止内容透视干扰 */
    background: rgba(255, 255, 255, 0.98);
    border-bottom: 1px solid var(--vp-c-divider);
    box-shadow: 0 4px 6px rgba(0,0,0,0.04);
  }
  
  /* 深色模式适配 */
  html[data-skin="plume"].dark .plume-nav-mobile {
    background: rgba(30, 30, 32, 0.98);
  }

  .plume-nav-mobile::-webkit-scrollbar {
    display: none;
  }

  /* ==================================================
     3. 修复内容被遮挡问题
     ================================================== */
  /* 
     计算公式：
     原生导航栏 (~60px) + 移动端菜单 (48px) + 额外间距 (20px) 
     确保内容从约 128px 处开始显示
  */
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
   4. 隐藏默认元素逻辑 (保持不变)
   ================================================== */
html[data-skin="plume"] .VPNavBarMenu,
html[data-skin="plume"] .VPNavBarSearch,
html[data-skin="plume"] .VPHero,
html[data-skin="plume"] .VPFeatures,
html[data-skin="plume"] .VPContent.is-home .vp-doc.container {
  display: none !important;
}

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
html[data-skin="plume"] .VPDoc .container,
html[data-skin="plume"] .VPDoc:not(.has-sidebar) .container,
html[data-skin="plume"] .VPDoc:not(.has-sidebar) .content {
  max-width: 100% !important;
  padding: 0 !important;
}

/* Desktop Only Logic */
.plume-nav.desktop-only {
  display: none;
}
@media (min-width: 960px) {
  html[data-skin="plume"] .plume-nav.desktop-only {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: 16px;
  }
}

/* 通用链接样式 */
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
.plume-nav-icon { font-size: 14px; }
.plume-nav-link:hover { color: var(--vp-c-brand-1); }
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
.wolfe-toggle-btn:hover { background: var(--vp-c-bg-alt); color: var(--vp-c-brand-1); }
.wolfe-toggle-btn.active { color: var(--vp-c-brand-1); }
</style>