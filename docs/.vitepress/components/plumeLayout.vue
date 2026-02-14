<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useData, useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import BlogHome from './blogHome.vue'
import ThemeToggle from './themeToggle.vue'

const { Layout } = DefaultTheme
const { frontmatter } = useData()
const route = useRoute()

const isPlume = ref(false)

const isHomePage = computed(() => frontmatter.value.layout === 'home')
const showBlogHome = computed(() => isPlume.value && isHomePage.value)

// 博客导航条目（用 emoji 避免 SVG 模板编译问题）
const blogNavItems = [
  { text: '博客', link: '/', icon: '📝' },
  { text: '标签', link: '/blog/tags', icon: '🏷️' },
  { text: '归档', link: '/blog/archives', icon: '📅' }
]

function checkPlumeMode() {
  if (typeof document !== 'undefined') {
    isPlume.value = document.documentElement.getAttribute('data-skin') === 'plume'
  }
}

// 根据路由自动管理模式
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

  // 记录最后访问的页面
  if (typeof localStorage !== 'undefined') {
    const currentIsPlume = htmlEl.getAttribute('data-skin') === 'plume'
    if (currentIsPlume) {
      localStorage.setItem('wolfe-last-blog-page', path)
    } else {
      localStorage.setItem('wolfe-last-normal-page', path)
    }
  }
}

watch(() => route.path, (newPath) => enforceModeByRoute(newPath), { immediate: true })

onMounted(() => {
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
    <!-- 博客模式导航（仅 plume 模式可见，由 CSS 控制） -->
    <template #nav-bar-content-before>
      <nav class="plume-nav">
        <a
          v-for="item in blogNavItems"
          :key="item.link"
          :href="item.link"
          class="plume-nav-link"
          :class="{ active: item.link === '/' ? isHomePage : route.path.startsWith(item.link) }"
        >{{ item.icon }} {{ item.text }}</a>
      </nav>
    </template>

    <!-- 切换按钮（始终可见，通过插槽渲染在 VitePress 上下文中） -->
    <template #nav-bar-content-after>
      <ThemeToggle />
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

/* ====== 博客模式：隐藏默认导航菜单 ====== */
html[data-skin="plume"] .VPNavBarMenu {
  display: none !important;
}

/* ====== Plume 模式下隐藏 Hero 和 Features ====== */
html[data-skin="plume"] .VPHero {
  display: none !important;
}

html[data-skin="plume"] .VPFeatures {
  display: none !important;
}

/* ====== Plume 博客覆盖层 ====== */
.plume-blog-overlay {
  position: relative;
  z-index: 1;
  width: 100%;
  padding-top: 8px;
}

html:not([data-skin="plume"]) .plume-blog-overlay {
  display: none !important;
}

/* VPHome 背景 */
html[data-skin="plume"] .VPHome {
  background: transparent !important;
}

html[data-skin="plume"] .VPContent.is-home {
  background: var(--plume-bg, #f5f7fa) !important;
}

html[data-skin="plume"].dark .VPContent.is-home {
  background: var(--plume-bg, #161820) !important;
}

/* ====== 博客模式：隐藏侧边栏 ====== */
html[data-skin="plume"] .VPSidebar {
  display: none !important;
}

/* 博客模式下文档页面全宽 */
html[data-skin="plume"] .VPDoc .container {
  max-width: 100% !important;
}

html[data-skin="plume"] .VPDoc:not(.has-sidebar) .container {
  max-width: 100% !important;
}

html[data-skin="plume"] .VPDoc:not(.has-sidebar) .content {
  max-width: 100% !important;
}

/* ====== 移动端适配 ====== */
@media (max-width: 960px) {
  html[data-skin="plume"] .plume-nav {
    display: none;
  }
}
</style>