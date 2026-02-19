import './style.css'
import DefaultTheme from 'vitepress/theme'
import { h, render, onMounted, watch, nextTick } from 'vue'  // 新增了 nextTick
import { useRoute } from 'vitepress'

// 组件
import GitHubRelease from '../components/GitHubRelease.vue'
import notionTags from '../components/notionTags.vue'
import linkCard from '../components/linkCard.vue'
import downloadCard from '../components/downloadCard.vue'
import copyMessage from '../components/copyMessage.vue'
import encryptedBlock from '../components/encryptedBlock.vue'

// 插件
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client'
import { injectTabs } from '../plugins/vitepress-tabbed.js'
import { setupDetailsAnimation } from '../plugins/detailsAnimation.js'

// ====== Copy Toast 单例 & clipboard patch ======
let __copyToastExposed = null
let __clipboardPatched = false

function mountCopyToastOnce() {
  if (typeof document === 'undefined') return
  if (__copyToastExposed) return

  const container = document.createElement('div')
  container.id = '__dl_copy_toast_host'
  document.body.appendChild(container)

  const vnode = h(copyMessage)
  render(vnode, container)

  __copyToastExposed = vnode.component?.exposed || null
}

function patchClipboardOnce() {
  if (typeof navigator === 'undefined') return
  if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') return
  if (__clipboardPatched) return

  const originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard)

  navigator.clipboard.writeText = async (text) => {
    const res = await originalWriteText(text)
    // 复制成功后弹 toast
    __copyToastExposed?.show?.('已复制到剪贴板')
    return res
  }

  __clipboardPatched = true
}
// ============================================

// ====== Spoiler 处理逻辑 ======
let __spoilerInitialized = false

function setupSpoiler() {
  if (typeof document === 'undefined') return
  if (__spoilerInitialized) return
  __spoilerInitialized = true

  // 检测是否为触摸设备
  const isTouchDevice = () => {
    return window.matchMedia('(hover: none)').matches || 
           window.matchMedia('(pointer: coarse)').matches
  }

  // 全局点击事件处理
  document.addEventListener('click', (e) => {
    // 只有触摸设备才处理点击
    if (!isTouchDevice()) return

    const clickedSpoiler = e.target.closest('.spoiler')
    
    if (clickedSpoiler) {
      e.preventDefault()
      
      // 关闭其他已显示的 spoiler
      document.querySelectorAll('.spoiler.revealed').forEach(el => {
        if (el !== clickedSpoiler) {
          el.classList.remove('revealed')
        }
      })
      
      // 切换当前 spoiler
      clickedSpoiler.classList.toggle('revealed')
    } else {
      // 点击其他地方，关闭所有 spoiler
      document.querySelectorAll('.spoiler.revealed').forEach(el => {
        el.classList.remove('revealed')
      })
    }
  }, true)
}
// ============================================

// ====== 动态锚点吸附逻辑 (零布局修改核心) ======
let __anchorObserver = null
let __anchorTimeout = null

function setupAnchorFix() {
  if (typeof window === 'undefined') return

  const hash = window.location.hash
  if (!hash) return

  try {
    const targetId = decodeURIComponent(hash.slice(1))
    
    nextTick(() => {
      const targetEl = document.getElementById(targetId)
      if (!targetEl) return

      let isUserInteracted = false
      const cancelFix = () => {
        isUserInteracted = true
        if (__anchorObserver) {
          __anchorObserver.disconnect()
          __anchorObserver = null
        }
      }

      // 清理残留的监视器
      cancelFix()
      isUserInteracted = false
      if (__anchorTimeout) clearTimeout(__anchorTimeout)

      // 防干扰设计：只要用户介入(滚轮、触摸、点击大纲)，立刻交还控制权
      window.addEventListener('wheel', cancelFix, { once: true, passive: true })
      window.addEventListener('touchstart', cancelFix, { once: true, passive: true })
      window.addEventListener('mousedown', cancelFix, { once: true, passive: true })

      // 监视整个文档的物理变化
      __anchorObserver = new ResizeObserver(() => {
        if (isUserInteracted) return
        
        const el = document.getElementById(targetId)
        if (!el) return
        
        // 动态获取当前主题下顶部固定导航栏的实际高度
        const navHeightStr = getComputedStyle(document.documentElement).getPropertyValue('--vp-nav-height')
        const navHeight = parseInt(navHeightStr) || 68
        const offset = el.getBoundingClientRect().top
        
        // 当组件 fetch 数据或图片完成并撑开文档时，顶部坐标会被挤下去
        // 一旦偏差超过 2px，立刻瞬移补正，肉眼几乎无法察觉到抖动
        if (Math.abs(offset - navHeight) > 2) {
          window.scrollTo({ top: window.pageYOffset + offset - navHeight, behavior: 'instant' })
        }
      })

      const docEl = document.querySelector('.vp-doc') || document.body
      if (docEl) __anchorObserver.observe(docEl)

      // 赋予异步组件 3.5 秒的最大保护期，之后强制释放监控内存
      __anchorTimeout = setTimeout(() => {
        cancelFix()
        window.removeEventListener('wheel', cancelFix)
        window.removeEventListener('touchstart', cancelFix)
        window.removeEventListener('mousedown', cancelFix)
      }, 3500)
    })
  } catch (e) {}
}
// ============================================

export default {
  extends: DefaultTheme,

  enhanceApp({ app }) {
    // 注册插件
    injectTabs()
    enhanceAppWithTabs(app)

    // 注册组件
    app.component('gtl', GitHubRelease)
    app.component('nt', notionTags)
    app.component('lc', linkCard)
    app.component('dc', downloadCard)
    app.component('eb', encryptedBlock)
  },

  setup() {
    const route = useRoute()

    onMounted(() => {
      // ✅ 挂载 Copy Toast + 劫持 clipboard（放最前面更稳）
      mountCopyToastOnce()
      patchClipboardOnce()

      // 初始化 details 动画
      setupDetailsAnimation()

      // 初始化脚注
      initFootnotes()

      // 初始化 Spoiler 处理
      setupSpoiler()

      // ✅ 页面初次载入时初始化锚点防偏移保护
      setupAnchorFix()
      
      // ✅ 监听右侧侧边栏(大纲)的点击哈希跳转
      window.addEventListener('hashchange', setupAnchorFix)
    })

    // 路由变化时重新初始化脚注和锚点保护
    watch(
      () => route.path,
      () => {
        setTimeout(initFootnotes, 100)
        
        // 由于组件切换存在 DOM 卸载，稍微延后执行防止拿不到新页面 DOM
        setTimeout(setupAnchorFix, 100) 
      }
    )
  }
}

// 脚注初始化函数（保留原逻辑不变）
function initFootnotes() {
  if (typeof document === 'undefined') return

  const footnoteLinks = document.querySelectorAll('.footnote-link')

  footnoteLinks.forEach((link) => {
    if (link.dataset.footnoteInit) return
    link.dataset.footnoteInit = 'true'

    const footnoteId = link.getAttribute('href')?.substring(1)
    const footnoteContent = document.getElementById(footnoteId)

    if (!footnoteContent) return

    const text = footnoteContent.querySelector('p')?.innerText || ''

    const tooltip = document.createElement('div')
    tooltip.className = 'footnote-tooltip'
    tooltip.innerHTML = text

    link.addEventListener('mouseenter', () => {
      if (window.innerWidth > 768) {
        document.body.appendChild(tooltip)
        const rect = link.getBoundingClientRect()
        tooltip.style.left = rect.left + 'px'
        tooltip.style.top = rect.bottom + 5 + 'px'
        tooltip.classList.add('visible')
      }
    })

    link.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible')
      setTimeout(() => tooltip.remove(), 200)
    })

    link.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault()
        document.body.appendChild(tooltip)
        const rect = link.getBoundingClientRect()
        tooltip.style.left = '10px'
        tooltip.style.right = '10px'
        tooltip.style.top = rect.bottom + 5 + 'px'
        tooltip.classList.add('visible')

        setTimeout(() => {
          document.addEventListener('click', function closeTooltip(ev) {
            if (!tooltip.contains(ev.target) && ev.target !== link) {
              tooltip.classList.remove('visible')
              setTimeout(() => tooltip.remove(), 200)
              document.removeEventListener('click', closeTooltip)
            }
          })
        }, 100)
      }
    })
  })
}