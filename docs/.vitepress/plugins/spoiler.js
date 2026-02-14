export function spoiler(md) {
  // -----------------------------
  // 1. 定义行内规则 (Inline Rule)
  // 用于：这段文字 ||中间隐藏|| 了。
  // -----------------------------
  md.inline.ruler.push('spoiler_inline', (state, silent) => {
    const marker = '||';
    const start = state.pos;
    
    // 检查开头是否是 ||
    if (state.src.slice(start, start + 2) !== marker) return false;

    // 寻找结尾的 ||
    const end = state.src.indexOf(marker, start + 2);
    if (end === -1) return false; // 没找到结尾
    
    // 内容不能为空 (||||)
    if (end - start === 2) return false;

    if (silent) return true; // 只是检查语法，直接返回

    state.pos = start;
    
    // 生成开始标签 <span class="spoiler">
    const tokenOpen = state.push('spoiler_inline_open', 'span', 1);
    tokenOpen.attrs = [['class', 'spoiler']]; // 这里添加类名

    // 解析中间的文本
    const tokenText = state.push('text', '', 0);
    tokenText.content = state.src.slice(start + 2, end);

    // 生成结束标签 </span>
    state.push('spoiler_inline_close', 'span', -1);

    state.pos = end + 2; // 跳过结束标记
    return true;
  });

  // -----------------------------
  // 2. 定义块级规则 (Block Rule)
  // 用于：
  // ||
  // 大段内容...
  // ||
  // -----------------------------
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

    if (!found) return false; // 没找到闭合，当做普通文本处理

    // 生成 <div class="spoiler spoiler-block">
    const tokenOpen = state.push('spoiler_block_open', 'div', 1);
    tokenOpen.attrs = [['class', 'spoiler spoiler-block']]; // 块级多加一个类以便区分
    tokenOpen.map = [startLine, nextLine];

    // 关键：递归解析块内部的内容（支持图片、代码块等）
    state.md.block.tokenize(state, startLine + 1, nextLine);

    // 生成 </div>
    state.push('spoiler_block_close', 'div', -1);

    state.line = nextLine + 1;
    return true;
  });
}