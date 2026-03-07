export function spoiler(md) {
  // 1. 覆盖默认的 text 规则，把 '|' 加入到终止符列表中
  // 这样当解析器遇到 '|' 时就会停下来，把接力棒交给我们的 spoiler 规则
  md.inline.ruler.at('text', (state, silent) => {
    const pos = state.pos
    const str = state.src.slice(pos)
    // 关键修复：在原本的 TERMINATOR_RE 中增加了 '|'
    const TERMINATOR_RE = /[\n!#$%&*+\-:<=>@[\\\]^_`{}~|]/
    const idx = str.search(TERMINATOR_RE)

    if (idx === 0) return false

    if (idx < 0) {
      if (!silent) state.pending += str
      state.pos = state.posMax
      return true
    }

    if (!silent) state.pending += str.slice(0, idx)
    state.pos += idx
    return true
  })

  // 2. 注册自定义内联规则，插入到 'emphasis' (加粗/斜体) 解析之前
  md.inline.ruler.before('emphasis', 'spoiler', (state, silent) => {
    const max = state.posMax
    const start = state.pos

    // 判断当前光标是否以 || 开头 (0x7c 是 '|' 的 ASCII 码)
    if (
      state.src.charCodeAt(start) !== 0x7c ||
      start + 1 >= max ||
      state.src.charCodeAt(start + 1) !== 0x7c
    ) {
      return false
    }

    let end = -1
    let pos = start + 2

    // 往后扫描，寻找闭合的 ||
    while (pos < max) {
      if (
        state.src.charCodeAt(pos) === 0x7c &&
        pos + 1 < max &&
        state.src.charCodeAt(pos + 1) === 0x7c
      ) {
        // 关键修复：确保它没有被反斜杠转义 (0x5c 是 '\')
        if (state.src.charCodeAt(pos - 1) !== 0x5c) {
          end = pos
          break
        }
      }
      pos++
    }

    // 如果没有找到闭合标记，说明不是 Spoiler，放弃匹配
    if (end === -1) {
      return false
    }

    // 关键修复：如果只是在探测 (silent 模式)，不生成节点，但必须把光标移走并返回 true！
    if (silent) {
      state.pos = end + 2
      return true
    }

    // 匹配成功！生成开始标签 <span class="spoiler">
    const tokenOpen = state.push('spoiler_open', 'span', 1)
    tokenOpen.attrs = [['class', 'spoiler']]

    // 递归解析被包裹的内容（支持内部加粗、链接等）
    state.pos = start + 2
    state.posMax = end
    state.md.inline.tokenize(state)

    // 生成结束标签 </span>
    const tokenClose = state.push('spoiler_close', 'span', -1)

    // 恢复解析器的读取范围，把光标移动到闭合 || 的后面
    state.pos = end + 2
    state.posMax = max

    return true
  })
}