export function spoiler(md) {
  // 注册自定义内联规则，插入到 'emphasis' (加粗/斜体) 解析之前
  md.inline.ruler.before('emphasis', 'spoiler', (state, silent) => {
    const max = state.posMax
    const start = state.pos

    // 1. 判断当前光标是否以 || 开头 (0x7c 是 '|' 的 ASCII 码)
    if (
      state.src.charCodeAt(start) !== 0x7c ||
      start + 1 >= max ||
      state.src.charCodeAt(start + 1) !== 0x7c
    ) {
      return false
    }

    // 如果只是在进行匹配探测 (silent 模式)，直接返回 true，不生成节点
    if (silent) return false

    let end = -1
    let pos = start + 2

    // 2. 往后扫描，寻找闭合的 ||
    while (pos < max) {
      if (
        state.src.charCodeAt(pos) === 0x7c &&
        pos + 1 < max &&
        state.src.charCodeAt(pos + 1) === 0x7c
      ) {
        end = pos
        break
      }
      pos++
    }

    // 3. 如果没有找到闭合标记，说明不是 Spoiler，放弃匹配
    if (end === -1) {
      return false
    }

    // 4. 匹配成功！生成开始标签 <span class="spoiler">
    const tokenOpen = state.push('spoiler_open', 'span', 1)
    tokenOpen.attrs = [['class', 'spoiler']]

    // 5. 递归解析被包裹的内容（这是支持 **加粗** 和 [链接] 的核心！）
    // 我们暂时限制解析器的读取范围为 || 内部
    state.pos = start + 2
    state.posMax = end
    state.md.inline.tokenize(state)

    // 6. 生成结束标签 </span>
    const tokenClose = state.push('spoiler_close', 'span', -1)

    // 7. 恢复解析器的读取范围，把光标移动到闭合 || 的后面，继续解析后续文本
    state.pos = end + 2
    state.posMax = max

    return true
  })
}