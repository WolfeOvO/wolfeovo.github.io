export function spoiler(md) {
  function tokenize(state, silent) {
    const start = state.pos
    const src = state.src

    let openLen = 0
    let closeSeq = ''

    if (src.startsWith('||', start)) {
      openLen = 2
      closeSeq = '||'
    } else if (src.startsWith('>!', start)) {
      openLen = 2
      closeSeq = '!<'
    } else {
      return false
    }

    const startContent = start + openLen
    let pos = startContent
    let found = false

    while (pos < state.posMax) {
      if (src.startsWith(closeSeq, pos)) {
        found = true
        break
      }
      pos++
    }

    if (!found) return false
    if (silent) return false

    const content = src.slice(startContent, pos)

    const tokenOpen = state.push('spoiler_open', 'span', 1)
    tokenOpen.attrs = [['class', 'spoiler']]

    const children = []
    state.md.inline.parse(content, state.md, state.env, children)

    for (const t of children) {
      state.tokens.push(t)
    }

    state.push('spoiler_close', 'span', -1)

    state.pos = pos + closeSeq.length
    return true
  }

  md.inline.ruler.before('emphasis', 'spoiler', tokenize)

  md.renderer.rules.spoiler_open = () => '<span class="spoiler">'
  md.renderer.rules.spoiler_close = () => '</span>'
}