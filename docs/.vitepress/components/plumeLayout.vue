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
   1. 核心修复：强制锁定 VitePress 默认导航栏
   解决“磁吸没了”和“顶部有缝隙”的问题
   ================================================== */
html[data-skin="plume"] .VPNavBar {
  position: fixed !important;
  top: 0 !important;
  /* 防止 VitePress JS 逻辑通过 transform 将其移出屏幕 */
  transform: translateY(0) !important;
  z-index: 30 !important; /* 确保在我们的二级导航之上 */
  /* 如果有背景透明问题，强制加背景 */
  background-color: var(--vp-c-bg) !important;
  border-bottom: 1px solid var(--vp-c-divider) !important;
}

/* 隐藏默认菜单项，但保留 Logo 和 切换按钮 */
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

/* ==================================================
   2. 桌面端导航
   ================================================== */
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

/* ==================================================
   3. 移动端导航修复
   ================================================== */
.plume-nav-mobile {
  display: none;
}

@media (max-width: 960px) {
  html[data-skin="plume"] .plume-nav-mobile {
    display: flex;
    
    /* ★★★ 磁吸定位 ★★★ */
    position: fixed;
    /* 紧贴在被我们强制锁定的原生导航栏下方 */
    top: var(--vp-nav-height); 
    left: 0;
    right: 0;
    z-index: 20;

    height: 48px;
    align-items: center;
    padding: 0 16px;
    gap: 12px;
    
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    background: rgba(255, 255, 255, 0.95); /* 增加不透明度 */
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--vp-c-divider);
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  }
  
  html[data-skin="plume"].dark .plume-nav-mobile {
    background: rgba(30, 30, 32, 0.95);
  }

  .plume-nav-mobile::-webkit-scrollbar {
    display: none;
  }

  /* ★★★ 内容区域 Padding 修正 ★★★ */
  /* 原生导航栏高度(通常64px) + 我们的导航栏高度(48px) + 间隙(16px) */
  html[data-skin="plume"] .VPContent {
    padding-top: calc(var(--vp-nav-height) + 64px) !important;
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
   4. 通用样式
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