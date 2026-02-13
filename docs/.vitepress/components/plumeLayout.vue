<script setup>
import { ref, onMounted, computed } from 'vue'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import blogHome from './blogHome.vue'
import themeToggle from './themeToggle.vue'

const { Layout } = DefaultTheme
const { frontmatter } = useData()

const isPlume = ref(false)

const isHomePage = computed(() => {
  return frontmatter.value.layout === 'home'
})

const showblogHome = computed(() => {
  return isPlume.value && isHomePage.value
})

function checkPlumeMode() {
  if (typeof document !== 'undefined') {
    isPlume.value = document.documentElement.getAttribute('data-skin') === 'plume'
  }
}

onMounted(() => {
  checkPlumeMode()

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
    <!-- 在导航栏右侧注入主题切换按钮 -->
    <template #nav-bar-content-after>
      <themeToggle />
    </template>

    <!-- 在首页 hero 之前注入博客首页 -->
    <template #home-hero-before v-if="showblogHome">
      <div class="plume-blog-overlay">
        <blogHome />
      </div>
    </template>
  </Layout>
</template>

<style>
/* ====== Plume 模式下隐藏默认首页元素 ====== */
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

/* 默认模式下隐藏博客覆盖层 */
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
</style>