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
    <template #nav-bar-content-before>
      <nav class="plume-nav">
        <a v-for="item in navItems" :key="item.link" :href="item.link" class="plume-nav-link" 
           :class="{ active: item.link === '/' ? isHomePage : route.path.startsWith(item.link) }">
          <IconRenderer :icon="item.icon" class="plume-nav-icon" />
          {{ item.text }}
        </a>
      </nav>
    </template>

    <template #nav-screen-content-before>
      <nav v-if="isPlume" class="plume-mobile-nav">
        <a v-for="item in navItems" :key="item.link" :href="item.link" class="plume-mobile-nav-link"
           :class="{ active: item.link === '/' ? isHomePage : route.path.startsWith(item.link) }">
          <IconRenderer :icon="item.icon" class="plume-mobile-nav-icon" />
          {{ item.text }}
        </a>
      </nav>
    </template>

    <template #nav-bar-content-after>
      <button class="wolfe-toggle-btn" :class="{ active: isPlume }" 
              :title="isPlume ? '切换到文档模式' : '切换到博客模式'" @click="toggleMode">
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
/* 1. 基础元素隐藏 */
.VPNavBarMenu .VPLink[href*="/blog/series"] { display: none !important; }

/* 2. 模式切换按钮样式 */
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
  transition: all 0.25s;
  position: relative;
  margin-left: 4px;
}
.wolfe-toggle-btn:hover, .wolfe-toggle-btn.active { color: var(--vp-c-brand-1); background: var(--vp-c-default-soft); }

/* 3. 桌面端博客导航样式 (原版布局) */
.plume-nav { display: none; }
html[data-skin="plume"] .plume-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 16px;
}
.plume-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s;
  white-space: nowrap;
}
.plume-nav-link:hover, .plume-nav-link.active {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}
.plume-nav-link.active { font-weight: 600; }
.plume-nav-icon { font-size: 14px; }

/* 4. ★ 修复：手机端弹出菜单专用样式 */
.plume-mobile-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 24px;
  border-bottom: 1px solid var(--vp-c-divider);
}
.plume-mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  font-size: 16px;
  color: var(--vp-c-text-1);
  text-decoration: none;
  border-radius: 8px;
}
.plume-mobile-nav-link.active {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

/* 5. 博客模式全局布局覆盖 (原版逻辑) */
html[data-skin="plume"] .VPNavBarMenu { display: none !important; }
html[data-skin="plume"] .VPHero,
html[data-skin="plume"] .VPFeatures,
html[data-skin="plume"] .VPSidebar { display: none !important; }

.plume-blog-overlay { position: relative; z-index: 1; width: 100%; padding-top: 8px; }

html[data-skin="plume"] .VPContent.is-home { background: var(--plume-bg, #f5f7fa) !important; }
html[data-skin="plume"].dark .VPContent.is-home { background: var(--plume-bg, #161820) !important; }

/* 隐藏首页默认 Markdown 容器 */
html[data-skin="plume"] .VPContent.is-home .vp-doc.container { display: none !important; }

/* 宽度调整 (原版布局) */
html[data-skin="plume"] .VPDoc .container,
html[data-skin="plume"] .VPDoc:not(.has-sidebar) .container,
html[data-skin="plume"] .VPDoc:not(.has-sidebar) .content {
  max-width: 100% !important;
}

/* 手机端屏蔽桌面版顶栏 */
@media (max-width: 960px) {
  html[data-skin="plume"] .plume-nav { display: none; }
}
</style>