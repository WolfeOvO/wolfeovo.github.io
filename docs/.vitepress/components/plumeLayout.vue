<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useData, useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import BlogHome from './blogHome.vue'

const { Layout } = DefaultTheme
const { frontmatter } = useData()
const route = useRoute()

const isPlume = ref(false)

const isHomePage = computed(() => frontmatter.value.layout === 'home')
const showBlogHome = computed(() => isPlume.value && isHomePage.value)

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

  if (typeof localStorage !== 'undefined') {
    const currentIsPlume = htmlEl.getAttribute('data-skin') === 'plume'
    if (currentIsPlume) {
      localStorage.setItem('wolfe-last-blog-page', path)
    } else {
      localStorage.setItem('wolfe-last-normal-page', path)
    }
  }
}

function toggleMode() {
  if (isPlume.value) {
    document.documentElement.removeAttribute('data-skin')
    localStorage.setItem('wolfe-theme-mode', 'default')
    isPlume.value = false
    const lastPage = localStorage.getItem('wolfe-last-normal-page')
    window.location.href = (lastPage && lastPage !== '/' && lastPage !== '/index.html') ? lastPage : '/'
  } else {
    document.documentElement.setAttribute('data-skin', 'plume')
    localStorage.setItem('wolfe-theme-mode', 'plume')
    isPlume.value = true
    const lastPage = localStorage.getItem('wolfe-last-blog-page')
    window.location.href = (lastPage && lastPage !== '/') ? lastPage : '/'
  }
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
    <!-- 博客模式导航 -->
    <template #nav-bar-content-before>
      <nav class="plume-nav">
        <a v-for="item in [
          { text: '博客', link: '/', icon: '📝' },
          { text: '标签', link: '/blog/tags', icon: '🏷️' },
          { text: '归档', link: '/blog/archives', icon: '📅' },
          { text: '合辑', link: '/blog/series', icon: '📚' }
        ]" :key="item.link" :href="item.link" class="plume-nav-link" :class="{ active: item.link === '/' ? isHomePage : route.path.startsWith(item.link) }">{{ item.icon }} {{ item.text }}</a>
      </nav>
    </template>

    <!-- ★ 切换按钮（直接内联，不用单独组件） -->
    <template #nav-bar-content-after>
      <button class="wolfe-toggle-btn" :class="{ active: isPlume }" :title="isPlume ? '切换到文档模式' : '切换到博客模式'" @click="toggleMode">
        <svg v-if="!isPlume" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path><line x1="9" y1="7" x2="16" y2="7"></line><line x1="9" y1="11" x2="14" y2="11"></line></svg>
      </button>
    </template>

    <!-- 博客首页 -->
    <template #home-hero-before v-if="showBlogHome">
      <div class="plume-blog-overlay">
        <BlogHome />
      </div>
    </template>
  </Layout>
</template>

<style>
/* ====== 切换按钮（全局样式，不用 scoped） ====== */
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
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  margin-left: 4px;
  padding: 0;
}

.wolfe-toggle-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background: var(--vp-c-default-soft);
  opacity: 0;
  transition: opacity 0.2s;
}

.wolfe-toggle-btn:hover::before {
  opacity: 1;
}

.wolfe-toggle-btn:hover {
  color: var(--vp-c-brand-1);
}

.wolfe-toggle-btn.active {
  color: var(--vp-c-brand-1);
}

.wolfe-toggle-btn svg {
  position: relative;
  z-index: 1;
}

/* ====== 博客模式导航 ====== */
.plume-nav {
  display: none;
}

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

.plume-nav-link:hover {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.plume-nav-link.active {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

/* ====== 博客模式隐藏默认导航 ====== */
html[data-skin="plume"] .VPNavBarMenu {
  display: none !important;
}

html[data-skin="plume"] .VPHero {
  display: none !important;
}

html[data-skin="plume"] .VPFeatures {
  display: none !important;
}

/* ====== 博客覆盖层 ====== */
.plume-blog-overlay {
  position: relative;
  z-index: 1;
  width: 100%;
  padding-top: 8px;
}

html:not([data-skin="plume"]) .plume-blog-overlay {
  display: none !important;
}

html[data-skin="plume"] .VPHome {
  background: transparent !important;
}

html[data-skin="plume"] .VPContent.is-home {
  background: var(--plume-bg, #f5f7fa) !important;
}

html[data-skin="plume"].dark .VPContent.is-home {
  background: var(--plume-bg, #161820) !important;
}

html[data-skin="plume"] .VPSidebar {
  display: none !important;
}

html[data-skin="plume"] .VPDoc .container {
  max-width: 100% !important;
}

html[data-skin="plume"] .VPDoc:not(.has-sidebar) .container {
  max-width: 100% !important;
}

html[data-skin="plume"] .VPDoc:not(.has-sidebar) .content {
  max-width: 100% !important;
}

@media (max-width: 960px) {
  html[data-skin="plume"] .plume-nav {
    display: none;
  }
}
</style>