import type MarkdownIt from 'markdown-it'
import type { PluginSimple } from 'markdown-it'

interface EncryptedBlockConfig {
  icon?: string
  title?: string
  texts?: string[]
  pwd?: string
}

// 生成唯一ID
function generateId(): string {
  return 'eb-' + Math.random().toString(36).substring(2, 11)
}

// 解析配置行
function parseConfigLine(line: string): { key: string; value: string } | null {
  // 匹配 "key":"value" 或 "key": "value" 格式
  const match = line.match(/^"([^"]+)"\s*:\s*"([^"]*)"$/)
  if (match) {
    return { key: match[1], value: match[2] }
  }
  return null
}

// 解析加密块内容
function parseEncryptedBlock(content: string): { config: EncryptedBlockConfig; mdContent: string } {
  const lines = content.split('\n')
  const config: EncryptedBlockConfig = {
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
          config.texts!.push(parsed.value)
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
function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const encryptedBlockPlugin: PluginSimple = (md: MarkdownIt) => {
  const defaultRender = md.renderer.rules.fence || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options)
  }
  
  // 自定义块规则
  md.block.ruler.before('fence', 'encrypted_block', (state, startLine, endLine, silent) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine]
    const maxPos = state.eMarks[startLine]
    
    // 检查是否以 %%% 开头
    if (state.src.slice(startPos, startPos + 3) !== '%%%') {
      return false
    }
    
    // 检查整行是否只有 %%%
    const lineContent = state.src.slice(startPos, maxPos).trim()
    if (lineContent !== '%%%') {
      return false
    }
    
    if (silent) {
      return true
    }
    
    // 查找结束标记 %%%
    let nextLine = startLine + 1
    let found = false
    
    while (nextLine < endLine) {
      const lineStartPos = state.bMarks[nextLine] + state.tShift[nextLine]
      const lineEndPos = state.eMarks[nextLine]
      const line = state.src.slice(lineStartPos, lineEndPos).trim()
      
      if (line === '%%%') {
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
    token.markup = '%%%'
    
    state.line = nextLine + 1
    
    return true
  })
  
  // 渲染规则
  md.renderer.rules.encrypted_block = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const { config, mdContent } = parseEncryptedBlock(token.content)
    
    // 如果没有密码，直接渲染内容
    if (!config.pwd) {
      return md.render(mdContent)
    }
    
    const contentId = generateId()
    
    // 渲染内部 Markdown 内容
    const renderedContent = md.render(mdContent)
    
    // 构建组件属性
    const iconAttr = config.icon ? ` icon="${escapeAttr(config.icon)}"` : ''
    const titleAttr = config.title ? ` title="${escapeAttr(config.title)}"` : ''
    const textsAttr = config.texts && config.texts.length > 0 
      ? ` :texts='${JSON.stringify(config.texts)}'` 
      : ''
    const pwdAttr = ` password="${escapeAttr(config.pwd)}"`
    const contentIdAttr = ` content-id="${contentId}"`
    
    return `<EncryptedBlock${iconAttr}${titleAttr}${textsAttr}${pwdAttr}${contentIdAttr}>\n\n${renderedContent}\n\n</EncryptedBlock>`
  }
}

export default encryptedBlockPlugin