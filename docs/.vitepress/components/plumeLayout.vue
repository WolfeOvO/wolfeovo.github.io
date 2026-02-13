<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useData, useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import BlogHome from './blogHome.vue'
import BlogSeriesNav from './blogSeriesNav.vue'
import ThemeToggle from './themeToggle.vue'

const { Layout } = DefaultTheme
const { frontmatter } = useData()
const route = useRoute()

const isPlume = ref(false)

const isHomePage = computed(() => {
  return frontmatter.value.layout === 'home'
})

const showBlogHome = computed(() => {
  return isPlume.value && isHomePage.value
})

const blogNavItems = [
  { text: '博客', link: '/', icon: '📝' },
  { text: '标签', link: '/blog/tags', icon: '🏷️' },
  { text: '归档', link: '/blog/archives', icon: '📅' },
  { text: '合辑', link: '/blog/series', icon: '📚' }
]

const isBlogPost = computed(() => {
  const path = route.path
  return path.startsWith('/blog/') &&
    !path.startsWith('/blog/tags') &&
    !path.startsWith('/blog/archives') &&
    !path.startsWith('/blog/series')
})

function checkPlumeMode() {
  if (typeof document !== 'undefined') {
    isPlume.value = document.documentElement.getAttribute('data-skin') === 'plume'
  }
}

function enforceModeByRoute(path) {
  if (typeof document === 'undefined') return
  const isBlogSection = path.startsWith('/blog/')
  const htmlEl = document.documentElement

  if (isBlogSection && htmlEl.getAttribute('data-skin') !== 'plume') {
    htmlEl.setAttribute('data-skin', 'plume')
    isPlume.value = true
    localStorage.setItem('wolfe-theme-mode', 'plume')
  }
}

watch(
  () => route.path,
  (newPath) => {
    enforceModeByRoute(newPath)

    if (typeof localStorage !== 'undefined') {
      const currentIsPlume = document.documentElement.getAttribute('data-skin') === 'plume'
      if (currentIsPlume) {
        if (newPath.startsWith('/blog/') || newPath === '/' || newPath === '/index.html') {
          localStorage.setItem('wolfe-last-blog-page', newPath)
        }
      } else {
        if (!newPath.startsWith('/blog/')) {
          localStorage.setItem('wolfe-last-normal-page', newPath)
        }
      }
    }
  },
  { immediate: true }
)

onMounted(() => {
  checkPlumeMode()

  const observer = new MutationObserver(() => {
    checkPlumeMode()
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-skin']
  })
})
</script>

<template>
  <Layout>
    <!-- 博客模式导航 -->
    <template #nav-bar-content-before v-if="isPlume">
      <nav class="plume-nav">
          <a v-for="item in blogNavItems" :key="item.link" :href="item.link" class="plume-nav-link" :class="{ active: item.link === '/' ? isHomePage : route.path.startsWith(item.link) }"><span class="plume-nav-icon">{{ item.icon }}</span> {{ item.text }}</a>
          <span class="plume-nav-icon">{{ item.icon }}</span>
          {{ item.text }}
      </nav>
    </template>

    <!-- ★ 切换按钮：通过插槽渲染，不再用 DOM 注入 -->
    <template #nav-bar-content-after>
      <ThemeToggle />
    </template>

    <!-- 博客模式首页 -->
    <template #home-hero-before v-if="showBlogHome">
      <div class="plume-blog-overlay">
        <BlogHome />
      </div>
    </template>

    <!-- 博客文章底部合辑导航 -->
    <template #doc-after v-if="isBlogPost">
      <BlogSeriesNav />
    </template>
  </Layout>
</template>

<style>
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
  gap: 5px;
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

html[data-skin="plume"] .VPNavBarMenu { display: none !important; }
html[data-skin="plume"] .VPHero { display: none !important; }
html[data-skin="plume"] .VPFeatures { display: none !important; }

.plume-blog-overlay {
  position: relative;
  z-index: 1;
  width: 100%;
  padding-top: 8px;
}

html:not([data-skin="plume"]) .plume-blog-overlay { display: none !important; }
html[data-skin="plume"] .VPHome { background: transparent !important; }
html[data-skin="plume"] .VPContent.is-home { background: var(--plume-bg, #f5f7fa) !important; }
html[data-skin="plume"].dark .VPContent.is-home { background: var(--plume-bg, #161820) !important; }
html[data-skin="plume"] .VPSidebar { display: none !important; }
html[data-skin="plume"] .VPDoc .container { max-width: 100% !important; }
html[data-skin="plume"] .VPDoc:not(.has-sidebar) .container { max-width: 100% !important; }
html[data-skin="plume"] .VPDoc:not(.has-sidebar) .content { max-width: 100% !important; }

@media (max-width: 960px) {
  html[data-skin="plume"] .plume-nav { display: none; }
  html[data-skin="plume"] .VPNavBarMenu { display: none !important; }
}
</style>