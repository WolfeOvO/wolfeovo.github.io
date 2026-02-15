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
/* ====== 隐藏普通模式导航栏中的"合辑"链接 ====== */
.VPNavBarMenu .VPLink[href*="/blog/series"] {
  display: none !important;
}

/* ====== 切换按钮 ====== */
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

/* ====== 博客模式导航 (桌面端) ====== */
/* 默认隐藏，只有在 html[data-skin="plume"] 且屏幕够大时显示 */
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

/* ====== 博客模式导航 (移动端) ====== */
/* 默认隐藏，只有在屏幕小的时候显示 */
.plume-nav-mobile {
  display: none;
}

@media (max-width: 960px) {
  html[data-skin="plume"] .plume-nav-mobile {
    /* 1. 强制显示 */
    display: flex;
    
    /* 2. 固定定位，钉在顶部导航栏(约56px-60px)的下方 */
    position: fixed;
    top: var(--vp-nav-height); 
    left: 0;
    right: 0;
    z-index: 40; /* 确保层级正确，不要挡住弹窗 */

    /* 3. 样式美化 */
    margin: 0;
    padding: 10px 12px;
    gap: 8px;
    justify-content: flex-start; /* 或者 center */
    
    /* 4. 横向滚动支持 (如果标签很多) */
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    /* 5. 背景模糊效果 */
    background: var(--vp-c-bg); /* 提供一个底色 */
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--vp-c-divider);
  }
  
  /* 隐藏滚动条 */
  .plume-nav-mobile::-webkit-scrollbar {
    display: none;
  }

  /* 调整内容间距，防止被这层导航挡住 */
  html[data-skin="plume"] .VPContent {
    padding-top: calc(var(--vp-nav-height) + 54px) !important;
  }
}

/* 链接通用样式 */
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

@media (max-width: 960px) {
  /* 手机端胶囊按钮样式 */
  .plume-nav-link {
    background-color: var(--vp-c-bg-alt);
    padding: 6px 12px;
    border-radius: 20px;
  }
}

.plume-nav-icon {
  font-size: 14px;
}
.plume-nav-icon.icon-image {
  width: 16px;
  height: 16px;
}

.plume-nav-link:hover {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.plume-nav-link.active {
  color: var(--vp-c-brand-1);
  font-weight: 600;
  background: var(--vp-c-brand-soft);
}
</style>