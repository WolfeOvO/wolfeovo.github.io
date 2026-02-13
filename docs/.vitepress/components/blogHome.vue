<script setup>
import { ref, computed } from 'vue'
import { useData, useRouter } from 'vitepress'
import { data as blogPosts } from '../blog.data.js'

const { theme } = useData()
const router = useRouter()

const activeTag = ref('')
const searchQuery = ref('')

const posts = computed(() => blogPosts || [])

// 标签列表（带计数）
const allTags = computed(() => {
  const map = {}
  posts.value.forEach(p => {
    if (p.tags) p.tags.forEach(t => {
      map[t] = (map[t] || 0) + 1
    })
  })
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

// 过滤后的文章
const filteredPosts = computed(() => {
  let result = posts.value
  if (activeTag.value) {
    result = result.filter(p => p.tags && p.tags.includes(activeTag.value))
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    )
  }
  return result
})

function navigateTo(url) {
  router.go(url)
}

function toggleTag(tag) {
  activeTag.value = activeTag.value === tag ? '' : tag
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<template>
  <div class="plume-blog-home">
    <!-- Profile Card -->
    <aside class="blog-profile">
      <div class="profile-card">
        <div class="profile-avatar">
          <img :src="theme.logo || '/media/icon/logo.svg'" alt="avatar" />
        </div>
        <h2 class="profile-name">Wolfe</h2>
        <p class="profile-desc">の储物间 · 互联网集大成者</p>

        <!-- 统计数据（仿 ermao.net） -->
        <div class="profile-stats">
          <a href="/blog/tags" class="stat-item stat-link">
            <span class="stat-num">{{ allTags.length }}</span>
            <span class="stat-label">标签</span>
          </a>
          <a href="/blog/archives" class="stat-item stat-link">
            <span class="stat-num">{{ posts.length }}</span>
            <span class="stat-label">文章</span>
          </a>
        </div>

        <div class="profile-links">
          <a
            v-for="link in (theme.socialLinks || [])"
            :key="link.link"
            :href="link.link"
            target="_blank"
            class="social-link"
          >
            <svg v-if="link.icon === 'github'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- 快捷导航 -->
      <div class="quick-nav">
        <h3 class="nav-title">📌 快捷导航</h3>
        <nav>
          <a href="/blog/tags" class="nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            标签
          </a>
          <a href="/blog/archives" class="nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            归档
          </a>
          <!-- 移除“储物间”和“墙外指南”快捷导航，确保博客模式下不跳转到站点其它内容 -->
        </nav>
      </div>

      <!-- 标签云预览 -->
      <div class="tag-cloud" v-if="allTags.length > 0">
        <div class="tag-cloud-header">
          <h3 class="nav-title">🏷️ 标签</h3>
          <a href="/blog/tags" class="see-all">查看全部 →</a>
        </div>
        <div class="tags-wrap">
          <button
            v-for="tag in allTags.slice(0, 10)"
            :key="tag.name"
            class="tag-btn"
            :class="{ active: activeTag === tag.name }"
            @click="toggleTag(tag.name)"
          >
            {{ tag.name }}
            <span class="tag-count">{{ tag.count }}</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- Post List -->
    <main class="blog-main">
      <div class="blog-header">
        <h1 class="blog-title">
          <span class="title-icon">📝</span>
          博客文章
        </h1>
        <div class="blog-search">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索文章..."
            class="search-input"
          />
        </div>
      </div>

      <!-- 文章列表 -->
      <div class="post-list">
        <article
          v-for="post in filteredPosts"
          :key="post.url"
          class="post-card"
          @click="navigateTo(post.url)"
        >
          <div class="post-content">
            <h2 class="post-title">{{ post.title }}</h2>
            <p class="post-desc" v-if="post.description">{{ post.description }}</p>
            <div class="post-meta">
              <span class="post-date" v-if="post.date">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {{ formatDate(post.date) }}
              </span>
              <div class="post-tags" v-if="post.tags && post.tags.length">
                <span v-for="tag in post.tags" :key="tag" class="post-tag">{{ tag }}</span>
              </div>
            </div>
          </div>
          <div class="post-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </article>

        <!-- Empty State -->
        <div v-if="filteredPosts.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <p v-if="searchQuery || activeTag">没有找到匹配的文章</p>
          <p v-else>暂时还没有博客文章，快去写一篇吧！</p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.plume-blog-home {
  display: flex;
  gap: 28px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 24px 64px;
  min-height: calc(100vh - var(--vp-nav-height) - 100px);
}

/* ========== Profile Sidebar ========== */
.blog-profile {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: calc(var(--vp-nav-height, 64px) + 24px);
  height: fit-content;
}

.profile-card {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  padding: 28px 20px;
  text-align: center;
  transition: box-shadow 0.3s, border-color 0.3s;
}

.profile-card:hover {
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  border-color: var(--vp-c-brand-soft);
}

.profile-avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--vp-c-brand-soft);
  padding: 4px;
  background: var(--vp-c-bg-soft);
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.profile-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 6px;
  letter-spacing: -0.02em;
}

.profile-desc {
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin: 0 0 16px;
  line-height: 1.5;
}

/* ========== Profile Stats (仿 ermao.net) ========== */
.profile-stats {
  display: flex;
  justify-content: center;
  gap: 0;
  padding: 0;
  border-top: 1px solid var(--vp-c-divider);
  border-bottom: 1px solid var(--vp-c-divider);
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 0;
  flex: 1;
}

.stat-link {
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 0;
}

.stat-link:first-child {
  border-right: 1px solid var(--vp-c-divider);
}

.stat-link:hover {
  background: var(--vp-c-brand-soft);
}

.stat-num {
  font-size: 20px;
  font-weight: 700;
  color: var(--vp-c-brand-1);
}

.stat-label {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.profile-links {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  transition: all 0.2s;
}

.social-link:hover {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}

/* ========== Quick Nav ========== */
.quick-nav, .tag-cloud {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  padding: 16px 20px;
}

.nav-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 12px;
}

.quick-nav nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: all 0.2s;
}

.nav-item:hover {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  padding-left: 16px;
}

.nav-item svg {
  flex-shrink: 0;
  opacity: 0.7;
}

.nav-item:hover svg {
  opacity: 1;
}

/* ========== Tag Cloud ========== */
.tag-cloud-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.see-all {
  font-size: 12px;
  color: var(--vp-c-text-3);
  text-decoration: none;
  transition: color 0.2s;
}

.see-all:hover {
  color: var(--vp-c-brand-1);
}

.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-btn:hover, .tag-btn.active {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.tag-count {
  font-size: 10px;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg);
  padding: 0 5px;
  border-radius: 8px;
  line-height: 16px;
}

.tag-btn:hover .tag-count,
.tag-btn.active .tag-count {
  background: var(--vp-c-brand-1);
  color: #fff;
}

/* ========== Main Content ========== */
.blog-main {
  flex: 1;
  min-width: 0;
}

.blog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
}

.blog-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: -0.02em;
}

.title-icon {
  font-size: 28px;
}

.blog-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  color: var(--vp-c-text-3);
  transition: border-color 0.2s;
  flex-shrink: 0;
}

.blog-search:focus-within {
  border-color: var(--vp-c-brand-1);
}

.search-input {
  border: none;
  background: none;
  outline: none;
  font-size: 14px;
  color: var(--vp-c-text-1);
  width: 160px;
}

.search-input::placeholder {
  color: var(--vp-c-text-3);
}

/* ========== Post Cards ========== */
.post-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.post-card:hover {
  border-color: var(--vp-c-brand-soft);
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.post-card:hover .post-arrow {
  color: var(--vp-c-brand-1);
  transform: translateX(4px);
}

.post-content {
  flex: 1;
  min-width: 0;
}

.post-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 6px;
  line-height: 1.4;
  transition: color 0.2s;
}

.post-card:hover .post-title {
  color: var(--vp-c-brand-1);
}

.post-desc {
  font-size: 14px;
  color: var(--vp-c-text-2);
  margin: 0 0 10px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.post-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.post-tags {
  display: flex;
  gap: 6px;
}

.post-tag {
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 12px;
  font-weight: 500;
}

.post-arrow {
  color: var(--vp-c-text-3);
  flex-shrink: 0;
  transition: all 0.25s;
}

/* ========== Empty State ========== */
.empty-state {
  text-align: center;
  padding: 64px 20px;
  color: var(--vp-c-text-3);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state p {
  font-size: 15px;
  margin: 0;
}

/* ========== Responsive ========== */
@media (max-width: 960px) {
  .plume-blog-home {
    flex-direction: column;
    padding: 16px;
  }

  .blog-profile {
    width: 100%;
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 12px;
  }

  .profile-card {
    flex: 1;
    min-width: 250px;
  }

  .quick-nav {
    flex: 1;
    min-width: 200px;
  }

  .tag-cloud {
    width: 100%;
  }

  .blog-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-input {
    width: 100%;
  }

  .blog-search {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .profile-card {
    min-width: 100%;
  }

  .quick-nav {
    min-width: 100%;
  }

  .post-card {
    padding: 16px;
  }

  .post-title {
    font-size: 15px;
  }
}
</style>