<script setup>
import { ref, onMounted, computed, h, render as vueRender, watch, nextTick } from 'vue'
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
  { text: '博客', link: '/', icon: 'blog' },
  { text: '标签', link: '/blog/tags', icon: 'tag' },
  { text: '归档', link: '/blog/archives', icon: 'archive' },
  { text: '合辑', link: '/blog/series', icon: 'series' }
]

// 判断是否是博客文章页面（用于注入合辑导航）
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

// ====== 根据路由自动切换模式（仅处理 /blog/ 页面） ======
function enforceModeByRoute(path) {
  if (typeof document === 'undefined') return

  const isBlogSection = path.startsWith('/blog/')
  const htmlEl = document.documentElement

  // 如果用户导航到 /blog/ 下的页面，自动切入博客模式
  if (isBlogSection && htmlEl.getAttribute('data-skin') !== 'plume') {
    htmlEl.setAttribute('data-skin', 'plume')
    isPlume.value = true
    localStorage.setItem('wolfe-theme-mode', 'plume')
  }
}

// 监听路由变化
watch(
  () => route.path,
  (newPath) => {
    enforceModeByRoute(newPath)
  },
  { immediate: true }
)

// ====== 注入切换按钮（始终显示） ======
let toggleInjected = false

function injectToggleButton() {
  if (typeof document === 'undefined' || toggleInjected) return

  const appearance = document.querySelector('.VPNavBarAppearance') || 
                     document.querySelector('.VPNavBarSocialLinks') ||
                     document.querySelector('.VPNavBar .content-body')

  if (appearance && appearance.parentNode) {
    const host = document.createElement('div')
    host.id = 'plume-toggle-host'
    host.style.display = 'flex'   // 始终显示
    host.style.alignItems = 'center'
    
    if (appearance.classList.contains('content-body')) {
      appearance.appendChild(host)
    } else {
      appearance.parentNode.insertBefore(host, appearance)
    }

    vueRender(h(ThemeToggle), host)
    toggleInjected = true
  }
}

onMounted(() => {
  checkPlumeMode()
  
  setTimeout(injectToggleButton, 100)

  // 监听 data-skin 属性变化
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
    <!-- 博客模式：在导航栏注入自定义博客导航 -->
    <template #nav-bar-content-before v-if="isPlume">
      <nav class="plume-nav">
        <a
          v-for="item in blogNavItems"
          :key="item.link"
          :href="item.link"
          class="plume-nav-link"
          :class="{
            active: item.link === '/'
              ? isHomePage
              : route.path.startsWith(item.link)
          }"
        >
          <svg v-if="item.icon === 'blog'" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          <svg v-else-if="item.icon === 'tag'" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          <svg v-else-if="item.icon === 'archive'" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <svg v-else-if="item.icon === 'series'" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h8"/><path d="M8 11h6"/></svg>
          {{ item.text }}
        </a>
      </nav>
    </template>

    <!-- 博客模式首页：注入博客首页 -->
    <template #home-hero-before v-if="showBlogHome">
      <div class="plume-blog-overlay">
        <BlogHome />
      </div>
    </template>

    <!-- 博客文章底部：注入合辑导航 -->
    <template #doc-after v-if="isBlogPost">
      <BlogSeriesNav />
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

  html[data-skin="plume"] .VPNavBarMenu {
    display: none !important;
  }
}
</style>