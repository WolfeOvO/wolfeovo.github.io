// .vitepress/theme/spoiler.js

export function spoilerPlugin(md) {
  // 1. 注册行内规则 (Inline): ||text||
  md.inline.ruler.push('spoiler_inline', (state, silent) => {
    const marker = '||';
    const start = state.pos;
    if (state.src.slice(start, start + 2) !== marker) return false;

    const end = state.src.indexOf(marker, start + 2);
    if (end === -1) return false; // 没找到结尾
    
    // 内容不能为空
    if (end - start === 2) return false;

    if (silent) return true;

    state.pos = start;
    
    // 生成 <span class="spoiler">
    const tokenOpen = state.push('spoiler_inline_open', 'span', 1);
    tokenOpen.attrs = [['class', 'spoiler']];

    // 解析中间的文本
    const tokenText = state.push('text', '', 0);
    tokenText.content = state.src.slice(start + 2, end);

    // 生成 </span>
    state.push('spoiler_inline_close', 'span', -1);

    state.pos = end + 2;
    return true;
  });

  // 2. 注册块级规则 (Block): 
  // ||
  // 内容
  // ||
  md.block.ruler.before('fence', 'spoiler_block', (state, startLine, endLine, silent) => {
    const marker = '||';
    const pos = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    
    // 检查第一行是否只有 ||
    if (state.src.slice(pos, max).trim() !== marker) return false;

    if (silent) return true;

    // 寻找结束行
    let nextLine = startLine + 1;
    let found = false;
    for (; nextLine < endLine; nextLine++) {
      const pos = state.bMarks[nextLine] + state.tShift[nextLine];
      const max = state.eMarks[nextLine];
      if (state.src.slice(pos, max).trim() === marker) {
        found = true;
        break;
      }
    }

    if (!found) return false;

    // 生成 <div class="spoiler spoiler-block">
    // 注意：这里加了个 spoiler-block 类，方便 CSS 单独控制块级显示
    const tokenOpen = state.push('spoiler_block_open', 'div', 1);
    tokenOpen.attrs = [['class', 'spoiler spoiler-block']];
    tokenOpen.map = [startLine, nextLine];

    // 解析块内部内容
    state.md.block.tokenize(state, startLine + 1, nextLine);

    // 生成 </div>
    state.push('spoiler_block_close', 'div', -1);

    state.line = nextLine + 1;
    return true;
  });
}