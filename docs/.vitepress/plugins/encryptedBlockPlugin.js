// 全局ID计数器
let idCounter = 0

// 生成唯一ID
function generateId() {
  return 'eb-' + (++idCounter) + '-' + Math.random().toString(36).substring(2, 8)
}

// 解析层级标记，返回层级数字或 null
// 支持 ===@1, ===@2, ===@3 等格式
function parseLevelMarker(line) {
  const match = line.trim().match(/^===@(\d+)$/)
  if (match) {
    return parseInt(match[1], 10)
  }
  return null
}

// 检查是否是简单的 %%% 标记
function isSimpleMarker(line) {
  return line.trim() === '%%%'
}

// 解析配置行
function parseConfigLine(line) {
  // 匹配 "key":"value" 或 "key": "value" 格式
  const match = line.match(/^"([^"]+)"\s*:\s*"([^"]*)"$/)
  if (match) {
    return { key: match[1], value: match[2] }
  }
  return null
}

// 解析加密块内容（只解析配置）
function parseEncryptedBlockConfig(content) {
  const lines = content.split('\n')
  const config = {
    texts: []
  }
  let mdContentStartIndex = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // 跳过空行
    if (!line) {
      continue
    }
    
    const parsed = parseConfigLine(line)
    
    if (parsed) {
      switch (parsed.key) {
        case 'icon':
          config.icon = parsed.value
          break
        case 'title':
          config.title = parsed.value
          break
        case 'text':
          config.texts.push(parsed.value)
          break
        case 'pwd':
          config.pwd = parsed.value
          break
      }
      mdContentStartIndex = i + 1
    } else {
      // 遇到非配置行，后面都是 Markdown 内容
      break
    }
  }
  
  // 找到实际内容开始的位置（跳过配置后的空行）
  while (mdContentStartIndex < lines.length && !lines[mdContentStartIndex].trim()) {
    mdContentStartIndex++
  }
  
  const mdContent = lines.slice(mdContentStartIndex).join('\n')
  
  return { config, mdContent }
}

// 转义属性值中的特殊字符
function escapeAttr(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// 插件主函数
function encryptedBlockPlugin(md) {
  
  // ========== 规则1: 处理 ===@N 层级语法 ==========
  md.block.ruler.before('fence', 'encrypted_block_leveled', (state, startLine, endLine, silent) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine]
    const maxPos = state.eMarks[startLine]
    const lineContent = state.src.slice(startPos, maxPos).trim()
    
    // 解析开始标记的层级
    const startLevel = parseLevelMarker(lineContent)
    if (startLevel === null) {
      return false
    }
    
    if (silent) {
      return true
    }
    
    // 查找匹配的结束标记（相同层级）
    let nextLine = startLine + 1
    let found = false
    
    while (nextLine < endLine) {
      const lineStartPos = state.bMarks[nextLine] + state.tShift[nextLine]
      const lineEndPos = state.eMarks[nextLine]
      const line = state.src.slice(lineStartPos, lineEndPos).trim()
      
      const level = parseLevelMarker(line)
      
      if (level === startLevel) {
        // 检查是否是另一个开始标记（下一行有配置）
        const nextNextLine = nextLine + 1
        if (nextNextLine < endLine) {
          const nextLineStartPos = state.bMarks[nextNextLine] + state.tShift[nextNextLine]
          const nextLineEndPos = state.eMarks[nextNextLine]
          const nextLineContent = state.src.slice(nextLineStartPos, nextLineEndPos).trim()
          
          // 如果下一行是配置行，这是新块的开始，跳过
          if (parseConfigLine(nextLineContent)) {
            nextLine++
            continue
          }
        }
        
        // 否则是结束标记
        found = true
        break
      }
      
      nextLine++
    }
    
    if (!found) {
      return false
    }
    
    // 获取块内容
    const contentStart = state.bMarks[startLine + 1]
    const contentEnd = state.bMarks[nextLine]
    const content = state.src.slice(contentStart, contentEnd)
    
    // 创建 token
    const token = state.push('encrypted_block', '', 0)
    token.content = content
    token.map = [startLine, nextLine + 1]
    token.markup = `===@${startLevel}`
    token.meta = { level: startLevel }
    
    state.line = nextLine + 1
    
    return true
  })
  
  // ========== 规则2: 处理简单的 %%% 语法 ==========
  md.block.ruler.before('fence', 'encrypted_block_simple', (state, startLine, endLine, silent) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine]
    const maxPos = state.eMarks[startLine]
    const lineContent = state.src.slice(startPos, maxPos).trim()
    
    // 检查是否是 %%%
    if (!isSimpleMarker(lineContent)) {
      return false
    }
    
    if (silent) {
      return true
    }
    
    // 使用计数器查找匹配的结束标记（支持嵌套）
    let nextLine = startLine + 1
    let nestLevel = 1
    let found = false
    
    while (nextLine < endLine) {
      const lineStartPos = state.bMarks[nextLine] + state.tShift[nextLine]
      const lineEndPos = state.eMarks[nextLine]
      const line = state.src.slice(lineStartPos, lineEndPos).trim()
      
      if (isSimpleMarker(line)) {
        // 判断是开始还是结束标记
        // 检查下一行是否有配置（"key":"value" 格式）
        const nextNextLine = nextLine + 1
        if (nextNextLine < endLine) {
          const nextLineStartPos = state.bMarks[nextNextLine] + state.tShift[nextNextLine]
          const nextLineEndPos = state.eMarks[nextNextLine]
          const nextLineContent = state.src.slice(nextLineStartPos, nextLineEndPos).trim()
          
          // 如果下一行是配置行，说明这是一个新的嵌套块开始
          if (parseConfigLine(nextLineContent)) {
            nestLevel++
            nextLine++
            continue
          }
        }
        
        // 否则是结束标记
        nestLevel--
        
        if (nestLevel === 0) {
          found = true
          break
        }
      }
      
      nextLine++
    }
    
    if (!found) {
      return false
    }
    
    // 获取块内容
    const contentStart = state.bMarks[startLine + 1]
    const contentEnd = state.bMarks[nextLine]
    const content = state.src.slice(contentStart, contentEnd)
    
    // 创建 token
    const token = state.push('encrypted_block', '', 0)
    token.content = content
    token.map = [startLine, nextLine + 1]
    token.markup = '%%%'
    token.meta = { level: 1 }
    
    state.line = nextLine + 1
    
    return true
  })
  
  // ========== 渲染规则 ==========
  md.renderer.rules.encrypted_block = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const { config, mdContent } = parseEncryptedBlockConfig(token.content)
    const level = token.meta?.level || 1
    
    // 如果没有密码，直接渲染内容
    if (!config.pwd) {
      return md.render(mdContent)
    }
    
    const contentId = generateId()
    
    // 递归渲染内部 Markdown 内容（这会处理嵌套的加密块）
    const renderedContent = md.render(mdContent)
    
    // 构建组件属性
    const iconAttr = config.icon ? ` icon="${escapeAttr(config.icon)}"` : ''
    const titleAttr = config.title ? ` title="${escapeAttr(config.title)}"` : ''
    const textsAttr = config.texts && config.texts.length > 0 
      ? ` :texts='${JSON.stringify(config.texts)}'` 
      : ''
    const pwdAttr = ` password="${escapeAttr(config.pwd)}"`
    const contentIdAttr = ` content-id="${contentId}"`
    const levelAttr = ` :level="${level}"`
    
    return `<EncryptedBlock${iconAttr}${titleAttr}${textsAttr}${pwdAttr}${contentIdAttr}${levelAttr}>\n\n${renderedContent}\n\n</EncryptedBlock>`
  }
}

module.exports = encryptedBlockPlugin
