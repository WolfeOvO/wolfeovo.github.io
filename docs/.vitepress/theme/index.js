import './style.css'
import DefaultTheme from 'vitepress/theme'
import { h, render, onMounted, watch, nextTick } from 'vue'
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

let __anchorObserver = null
let __anchorTimeout = null

function setupAnchorFix() {
  if (typeof window === 'undefined') return

  const hash = window.location.hash
  if (!hash) return

  try {
    const targetId = decodeURIComponent(hash.slice(1))

    requestAnimationFrame(() => {
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

      cancelFix()
      isUserInteracted = false
      if (__anchorTimeout) clearTimeout(__anchorTimeout)

      window.addEventListener('wheel', cancelFix, { once: true, passive: true })
      window.addEventListener('touchstart', cancelFix, { once: true, passive: true })
      window.addEventListener('mousedown', cancelFix, { once: true, passive: true })

      let lastAbsoluteTop = window.scrollY + targetEl.getBoundingClientRect().top

      __anchorObserver = new ResizeObserver(() => {
        if (isUserInteracted) return

        const currentAbsoluteTop = window.scrollY + targetEl.getBoundingClientRect().top

        const diff = currentAbsoluteTop - lastAbsoluteTop
        
        if (Math.abs(diff) > 1) {
          window.scrollBy(0, diff)
          
          // 修正后更新记录
          lastAbsoluteTop = currentAbsoluteTop
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
      mountCopyToastOnce()
      patchClipboardOnce()
      setupDetailsAnimation()
      initFootnotes()
      setupSpoiler()

      // 页面初次载入时初始化锚点防偏移保护
      setupAnchorFix()
      
      // 监听右侧大纲点击哈希跳转
      window.addEventListener('hashchange', setupAnchorFix)
    })

    watch(
      () => route.path,
      () => {
        setTimeout(initFootnotes, 100)
        setTimeout(setupAnchorFix, 100) 
      }
    )
  }
}

// 脚注初始化函数
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