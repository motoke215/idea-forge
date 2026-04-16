import { useState, useRef, useEffect } from "react";
import MD from "./src/MD";

// 模型配置
const DEFAULT_MODELS = {
  "anthropic-claude": {
    name: "Claude (Anthropic)",
    url: "https://api.anthropic.com/v1/messages",
    keyPlaceholder: "sk-ant-...",
    defaultModel: "claude-sonnet-4-20250514",
  },
  "openai-gpt4": {
    name: "GPT-4 (OpenAI)",
    url: "https://api.openai.com/v1/chat/completions",
    keyPlaceholder: "sk-...",
    defaultModel: "gpt-4-turbo",
  },
  "groq-llama": {
    name: "Llama (Groq)",
    url: "https://api.groq.com/openai/v1/chat/completions",
    keyPlaceholder: "gsk_...",
    defaultModel: "llama-3.3-70b-versatile",
  },
  "deepseek-chat": {
    name: "DeepSeek (DeepSeek)",
    url: "https://api.deepseek.com/v1/chat/completions",
    keyPlaceholder: "sk-...",
    defaultModel: "deepseek-chat",
  },
  "qwen-turbo": {
    name: "Qwen (DashScope)",
    url: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    keyPlaceholder: "sk-...",
    defaultModel: "qwen-turbo",
  },
  "minimax": {
    name: "MiniMax (海螺)",
    url: "https://api.minimax.chat/v1/text/chatcompletion_v2",
    keyPlaceholder: "eyJh...",
    defaultModel: "MiniMax-Text-01",
  },
  "siliconflow": {
    name: "SiliconFlow (硅基流动)",
    url: "https://api.siliconflow.cn/v1/chat/completions",
    keyPlaceholder: "sk-...",
    defaultModel: "Qwen/Qwen2.5-7B-Instruct",
    models: [
      "Qwen/Qwen2.5-7B-Instruct",
      "Qwen/Qwen2.5-14B-Instruct",
      "Qwen/Qwen2.5-32B-Instruct",
      "Qwen/Qwen2.5-72B-Instruct",
      "deepseek-ai/DeepSeek-V2.5",
      "deepseek-ai/DeepSeek-V3",
      "01-ai/Yi-1.5-34B-Chat",
      "THUDM/glm-4-9b-chat",
      "microsoft_phi-3-medium-128k-instruct",
      "meta-llama/Meta-Llama-3.1-8B-Instruct",
      "meta-llama/Meta-Llama-3.1-70B-Instruct",
      "custom",
    ],
    hasImageGen: false,
  },
  "custom": {
    name: "自定义 API",
    url: "",
    keyPlaceholder: "API Key",
    defaultModel: "",
  },
};

// 电气工程师模式 - ASCII接线图示例
const ASCII_WIRING_EXAMPLE = String.raw`
                    ┌─────────┐
    VIN ───────────┤    LDO   ├───┬── VDD (3.3V)
                    │  AMS1117 ├───┘
                    └─────────┘
                         │
                        GND
`;

const MODES = [
  { id:"vibe_spec", icon:"⚡", color:"#00E5FF", label:"Vibe Coding 规格", sublabel:"for Claude Code / Cursor", desc:"可直接投喂给 AI 编程助手的执行规格：分阶段实现、明确约束、验收标准",
    clarifyQuestions:[
      { key:"stack", q:"技术栈偏好？", opts:["Next.js + Supabase","FastAPI + React","Python CLI","纯前端","不限"] },
      { key:"scope", q:"期望实现规模？", opts:["1天 MVP","1周完整版","长期产品"] },
      { key:"agent", q:"主要使用哪个 AI 编程工具？", opts:["Claude Code","Cursor","Windsurf","通用"] },
    ],
    systemPrompt:(ctx)=>`你是专为 AI 编程 Agent 编写规格文档的专家。生成「Vibe Coding 规格」，针对 ${ctx.agent||"Claude Code"}，技术栈：${ctx.stack||"不限"}，规模：${ctx.scope||"1周"}。中文输出：

# 项目名称与定位

---
## PHASE 0: 上下文与约束
\`\`\`context
项目目标: 
技术栈: 
绝对不做: 
\`\`\`

---
## PHASE 1: [阶段名]（预计 X 小时）
### 目标
### 任务序列（每条含输入/输出/验收标准）

（生成3-5个阶段，每阶段3-6个任务）

---
## 验收矩阵
| 功能 | 测试方法 | 通过标准 |

---
## 常见陷阱与约束（3-5条）`,
  },
  { id:"prd_full", icon:"▦", color:"#A78BFA", label:"PRD 文档", sublabel:"Product Requirements", desc:"专业级产品需求文档：竞品矩阵、MoSCoW 功能规格、OKR、验收标准",
    clarifyQuestions:[
      { key:"prd_type", q:"PRD 类型？", opts:["新功能","MVP 产品","概念验证 POC","系统重构"] },
      { key:"audience", q:"主要读者？", opts:["AI 编程助手","工程师团队","投资人/决策层"] },
      { key:"depth", q:"深度要求？", opts:["快速草稿","标准版","企业级详尽版"] },
    ],
    systemPrompt:(ctx)=>`你是资深产品经理。生成${ctx.depth==="企业级详尽版"?"完整详尽的":""}PRD，类型「${ctx.prd_type||"新功能"}」，读者「${ctx.audience||"工程师团队"}」。中文输出：

# [产品名称] PRD

## 1. 产品概述
- 一句话定位 / 核心问题 / 成功指标（OKR 3条）

## 2. 用户研究
### Persona（2-3个，含需求与痛点）
### 用户旅程关键节点

## 3. 竞品分析
| 竞品 | 核心能力 | 缺陷 | 差异化机会 |

## 4. 功能规格（MoSCoW）
### Must Have（每条含验收标准）
### Should Have / Could Have / Won't Have

## 5. 非功能性需求 / 风险与缓解

${ctx.audience==="AI 编程助手"?"## 6. AI 执行约束\n[面向 AI Agent 的结构化约束]":""}`,
  },
  { id:"project", icon:"⬡", color:"#34D399", label:"完整项目", sublabel:"Project Blueprint", desc:"技术架构、目录结构、核心模块设计、数据流、分阶段开发路线图",
    clarifyQuestions:[
      { key:"type", q:"项目类型？", opts:["Web App","CLI 工具","Telegram Bot","API 服务","桌面应用"] },
      { key:"stack_pref", q:"技术偏好？", opts:["Python 后端","Node/Next.js","全栈一体","不限"] },
      { key:"timeline", q:"时间线？", opts:["极速原型 2天","MVP 1-2周","完整产品 1月+"] },
    ],
    systemPrompt:(ctx)=>`你是顶级系统架构师。生成完整项目蓝图，类型：${ctx.type||"Web App"}，技术：${ctx.stack_pref||"不限"}，时间线：${ctx.timeline||"1-2周"}。中文输出：

# 项目蓝图：[名称]

## 1. 一句话定位 + 核心价值主张

## 2. 技术栈选型
| 层级 | 选型 | 理由 |

## 3. 目录结构
\`\`\`
project/
├── [完整目录树含注释]
\`\`\`

## 4. 核心模块设计（5-7个，每个含职责/输入输出/关键实现）

## 5. 数据流架构（ASCII图）

## 6. 分阶段路线图
### Phase 1 MVP（${ctx.timeline==="极速原型 2天"?"1-2天":"1-2周"}）：任务清单（半天粒度）
### Phase 2 完整版 / Phase 3 进阶

## 7. 快速启动
\`\`\`bash
# 初始化命令
\`\`\``,
  },
  { id:"rfc", icon:"◈", color:"#FB923C", label:"RFC 分解", sublabel:"Request for Changes", desc:"将想法/PRD 拆解为可独立实现的 RFC 单元，含依赖图、实现步骤、验收条件",
    clarifyQuestions:[
      { key:"granularity", q:"任务粒度？", opts:["半天任务","1-2天任务","周级任务"] },
      { key:"format", q:"输出格式？", opts:["RFC 文档","JIRA 风格","GitHub Issues 风格"] },
      { key:"include_tests", q:"包含测试用例？", opts:["是，详细","是，简要","否"] },
    ],
    systemPrompt:(ctx)=>`你是工程规划专家。将用户想法分解为 RFC 单元，粒度：${ctx.granularity||"1-2天"}，格式：${ctx.format||"RFC 文档"}。中文输出：

# RFC 分解：[项目名]

## 总览
- RFC 总数 / 总预估工时 / 关键路径

## 依赖关系图
\`\`\`
RFC-001 ← RFC-002 ← RFC-004
         ← RFC-003
\`\`\`

---
（以下为每个 RFC，至少生成 6-10 个）

### RFC-001: [名称]
**类型**: 功能/架构  
**依赖**: 无  
**预估**: X天  
**描述**:

**实现步骤**:
1. 

**验收条件**:
- [ ] 

${ctx.include_tests!=="否"?"**测试用例**:\n- [ ] \n\n---":"---"}

## 实现顺序与并行建议`,
  },
  { id:"skill", icon:"◉", color:"#F472B6", label:"Skill 文件", sublabel:"Agent Skill Spec", desc:"生成可直接用于 Claude Code Agent 的完整 SKILL.md 文件",
    clarifyQuestions:[
      { key:"complexity", q:"Skill 复杂度？", opts:["简单单步","多阶段工作流","带工具调用"] },
      { key:"output_type", q:"主要输出？", opts:["文件/代码","分析报告","操作指令","混合输出"] },
      { key:"error_handling", q:"错误处理？", opts:["基础","详细","含回滚策略"] },
    ],
    systemPrompt:(ctx)=>`你是 Claude Code Agent Skills 专家。生成完整 SKILL.md，复杂度：${ctx.complexity||"多阶段工作流"}，主要输出：${ctx.output_type||"混合输出"}。严格格式：

---
name: [skill-name-kebab-case]
description: [精准触发描述，含适用场景、触发关键词、不触发场景，100字内]
---

# [Skill 名称]

## 概述

## 触发条件
**触发**: 
**不触发**: 

## 执行流程
### Phase 1: 分析（每步含动作+工具+预期结果）
### Phase 2: 执行
### Phase 3: 验证与收尾

## 输出规范

## 错误处理
| 错误类型 | 处理策略 |

## 禁止行为

## 使用示例
用户: [典型请求]
Claude: [执行路径]`,
  },
  { id:"prompt_suite", icon:"⟐", color:"#FBBF24", label:"提示词套件", sublabel:"Full Prompt Suite", desc:"完整五件套：项目说明 + PRD + 执行标准 + 用户故事 + 分步指令",
    clarifyQuestions:[
      { key:"target_ai", q:"目标 AI 工具？", opts:["Claude Code","ChatGPT","Cursor","通用 LLM"] },
      { key:"style", q:"指令风格？", opts:["强约束指令式","协作对话式","角色扮演式"] },
      { key:"stories_count", q:"用户故事数量？", opts:["5-8条精华","10-15条完整","20条+详尽"] },
    ],
    systemPrompt:(ctx)=>`你是顶级提示词工程师。生成完整 AI 开发提示词套件，针对 ${ctx.target_ai||"通用 LLM"}，风格：${ctx.style||"强约束指令式"}。

---
# PART 1 · 项目说明（300字内）
[背景、目标、技术上下文、使用约束]

---
# PART 2 · PRD
## 产品目标（OKR）/ 核心功能（MoSCoW）/ 成功指标

---
# PART 3 · 执行标准
## 代码规范 / 架构约束 / 质量红线（${ctx.style==="强约束指令式"?"用「禁止」「必须」":"协作语气"}）/ 测试要求

---
# PART 4 · 用户故事（${ctx.stories_count||"10-15条"}）
格式：作为[用户]，我希望[功能]，以便[价值]
每条附 1-2 个验收条件

---
# PART 5 · 分步实现指令
每步：目标 / 具体指令（可直接复制给 ${ctx.target_ai||"AI"}）/ 验证方式`,
  },
  { id:"mvp", icon:"◎", color:"#EF4444", label:"MVP 规划", sublabel:"Lean Startup Plan", desc:"核心假设验证 → 最小功能集 → 2周冲刺 → 用户获取 → 决策树",
    clarifyQuestions:[
      { key:"solo_team", q:"开发资源？", opts:["独立开发者","2-3人小团队","有预算外包"] },
      { key:"has_users", q:"已有目标用户？", opts:["有，已联系","有想法未联系","完全从零"] },
      { key:"monetize", q:"商业化目标？", opts:["验证付费意愿","先积累用户","内部工具"] },
    ],
    systemPrompt:(ctx)=>`你是精益创业顾问。生成 MVP 规划，资源：${ctx.solo_team||"独立开发者"}，用户：${ctx.has_users||"从零"}，目标：${ctx.monetize||"验证付费"}。中文输出：

# MVP 规划：[产品名]

## 1. 核心假设（按风险排序，3-5条）

## 2. 最小功能集
**保留**（验证假设必须）/ **砍掉**（诱人不必要）/ **推迟**（后续版本）

## 3. 2周冲刺
### Week 1: Day 1-2 / Day 3-4 / Day 5
### Week 2: Day 6-7 / Day 8-9 / Day 10

## 4. 前10个用户获取
[${ctx.has_users==="完全从零"?"冷启动":"激活已有关系"}策略，具体可执行]

## 5. 验证指标
| 指标 | 测量方法 | 成功标准 | 失败信号 |

## 6. 第3周决策树
\`\`\`
IF 指标达标 → 继续扩展
IF 部分达标 → [调整方向]
IF 均未达标 → [pivot选项]
\`\`\`

## 7. 工具栈（${ctx.solo_team==="独立开发者"?"最小成本":"团队协作"}，含月费估算）`,
  },
  { id:"marketing", icon:"◇", color:"#EC4899", label:"营销文案", sublabel:"Go-to-Market Copy", desc:"Landing Page + 社媒矩阵 + 冷启动邮件序列 + 产品 Pitch",
    clarifyQuestions:[
      { key:"channel", q:"主要渠道？", opts:["开发者社区","国内社媒（小红书/即刻）","海外（Twitter/PH）","B2B 销售"] },
      { key:"tone", q:"品牌调性？", opts:["极客技术范","简洁专业","活泼亲切","高端商务"] },
      { key:"stage", q:"产品阶段？", opts:["预热期","内测期","公开发布"] },
    ],
    systemPrompt:(ctx)=>`你是顶级科技产品文案策划师。生成营销文案套件，渠道：${ctx.channel||"开发者社区"}，调性：${ctx.tone||"极客"}，阶段：${ctx.stage||"公开发布"}。

# 营销文案套件

## 1. 核心信息架构
- 定位句（10字内）/ 一句话价值主张 / 三个核心卖点（利益而非功能）

## 2. Landing Page 文案
### Hero（大标题+副标题+CTA）
### 痛点区（3个场景共鸣）
### 功能展示（3功能→3结果）
### 社会证明（3条 testimonial 模板）
### FAQ（5条）

## 3. 社媒文案
**${ctx.channel==="国内社媒（小红书/即刻）"?"小红书 3条（含话题标签）":"Twitter/X 3条（含 hook）"}**
**即刻/LinkedIn 长文（300字）**

## 4. 邮件序列（${ctx.stage==="预热期"?"预热版":"上线版"}）
邮件1 共鸣 / 邮件2 解决方案 / 邮件3 社会证明
每封含：主题行 + 正文

## 5. Pitch（30秒电梯版）`,
  },
  { id:"research", icon:"⬢", color:"#84CC16", label:"调研报告", sublabel:"Market Research", desc:"TAM/SAM/SOM 市场规模、竞争格局 4象限、用户洞察、进入策略",
    clarifyQuestions:[
      { key:"focus", q:"调研重点？", opts:["市场机会验证","竞品深度分析","用户需求挖掘","商业模式探索"] },
      { key:"geo", q:"目标市场？", opts:["中国市场","全球市场","东南亚","北美/欧洲"] },
      { key:"output_for", q:"报告用途？", opts:["个人决策","团队对齐","投资人展示"] },
    ],
    systemPrompt:(ctx)=>`你是市场研究分析师。生成调研报告，重点：${ctx.focus||"市场机会验证"}，市场：${ctx.geo||"全球"}，用途：${ctx.output_for||"个人决策"}。中文输出：

# 调研报告：[方向]

## 执行摘要
核心发现（3条）/ 机会评分 X/10 / 建议行动

## 1. 市场分析
### TAM/SAM/SOM（含估算逻辑）
### 关键趋势与增长驱动

## 2. 竞争格局
### 4象限图（高能力↑ 低价格←）
### 主要竞品详析（5个）
| 竞品 | 核心用户 | 定价 | 优势 | 致命弱点 |
### 差异化机会窗口

## 3. 用户洞察
核心痛点（按严重度排序）/ 付费意愿与阈值

## 4. 商业模式
| 模式 | 适用条件 | 收入潜力 | 难度 |

## 5. 进入策略
切入点 / 时间窗口 / 资源需求 / 6个月里程碑`,
  },
  { id:"comic", icon:"🎨", color:"#FF6B9D", label:"漫画大师", sublabel:"Comic Creator", desc:"从业30年的资深漫画家，将你的想法转化为专业漫画分镜脚本，可直接用于漫画创作",
    clarifyQuestions:[
      { key:"comic_style", q:"漫画风格？", opts:["少年热血(JUMP系)","少女浪漫","美式超英","日式写实","古风武侠","搞笑日常"] },
      { key:"bubble_style", q:"语言气泡？", opts:["经典对话泡","现代简洁气泡","手绘涂鸦风","无文字纯画面"] },
      { key:"panel_count", q:"分镜数量？", opts:["4格短篇","8格短篇","16格中篇","32格长篇"] },
      { key:"color_pref", q:"色彩风格？", opts:["全彩","黑白","淡彩上色"] },
    ],
    systemPrompt:(ctx)=>`你是从业30年的顶级漫画大师，精通各类漫画风格（日本少年漫画、少女漫画、美式超英漫画等），擅长构建扣人心弦的故事情节和富有表现力的分镜设计。

根据用户想法，创作一部漫画分镜脚本。

**创作要求：**
- 漫画风格：${ctx.comic_style || "少年热血"}
- 语言气泡：${ctx.bubble_style || "经典对话泡"}
- 分镜数量：${ctx.panel_count || "8格短篇"}
- 色彩风格：${ctx.color_pref || "全彩"}

**输出格式（严格遵循）：**

# 《漫画标题》

**风格：** ${ctx.comic_style} | **气泡：** ${ctx.bubble_style} | **分镜：** ${ctx.panel_count} | **色彩：** ${ctx.color_pref}

---

## 第一幕：[幕标题]

【镜头1】[镜头类型，如：远景/特写/中景/俯视/仰视等]
- **画面描述：** [详细描述画面内容，包括人物位置、表情、动作、服装、场景布置等]
- **对话/气泡：** [角色名]：「对话内容」或 N/A
- **旁白/解说：** [旁白内容]或 无
- **氛围/情绪：** [画面氛围描述，如：压抑、欢快、紧张等]

【镜头2】
...

---

## 第二幕：...


**角色设定表：**
| 角色名 | 年龄 | 外貌特征 | 性格 | 口头禅 |
|--------|------|----------|------|--------|

**世界观/设定备注：**
[简要说明故事背景和特殊设定]

**分镜逻辑说明：**
[说明分镜之间的节奏把控和叙事逻辑]

请开始创作！`,
  },
  { id:"electrical", icon:"⚡", color:"#FFD700", label:"全能电气工程师", sublabel:"Electrical Engineer", desc:"40年经验的全能电气工程师，精通电子产品设计，可根据描述或元件清单生成接线原理图、引脚图及详细说明",
    clarifyQuestions:[
      { key:"circuit_type", q:"电路类型？", opts:["数字电路","模拟电路","混合电路","单片机系统","电源设计","传感器接口","通信模块"] },
      { key:"complexity", q:"复杂程度？", opts:["入门级（<10元件）","初级（10-30元件）","中级（30-100元件）","高级（>100元件）"] },
      { key:"output_format", q:"输出格式？", opts:["详细原理图+接线图","简洁接线表","完整技术文档","全套BOM清单"] },
      { key:"voltage_level", q:"电压等级？", opts:["3.3V低压电路","5V标准电路","12V/24V工业电","220V交流电","多电压混合"] },
    ],
    systemPrompt:(ctx)=>`你是从业40年的顶级电气工程师，精通各类电子产品的硬件设计，包括但不限于：
- 数字电路设计（MCU、FPGA、逻辑门）
- 模拟电路设计（运放、滤波、信号调理）
- 电源设计（LDO、DC-DC、AC-DC）
- 传感器接口与信号处理
- PCB布局布线建议
- IEC/UL/CCC电气安全规范

根据用户提供的电子产品描述或元件清单，生成完整的技术文档。

**设计要求：**
- 电路类型：${ctx.circuit_type || "数字电路"}
- 复杂程度：${ctx.complexity || "初级"}
- 输出格式：${ctx.output_format || "详细原理图+接线图"}
- 电压等级：${ctx.voltage_level || "5V标准电路"}

**输出格式（严格遵循）：**

# 《电子产品电气设计文档》

## 1. 产品概述
- 产品名称/型号
- 核心功能描述
- 主要应用场景

## 2. 系统架构
\`\`\`
[系统架构框图 - ASCII]
\`\`\`

## 3. 元件清单（BOM）
| 位号 | 元件名称 | 规格型号 | 数量 | 备注 |
|------|----------|----------|------|------|
| U1 | MCU | STM32F103C8T6 | 1 | 主控芯片 |
| R1 | 电阻 | 10kΩ 0603 | 1 | 上拉电阻 |
| ... | ... | ... | ... | ... |

## 4. 电源系统设计
### 4.1 电源架构
[电源拓扑结构说明]
### 4.2 电压分配表
| 电压轨 | 值 | 电流 | 来源 |
|--------|-----|------|------|
| VDD | 3.3V | 200mA | LDO AMS1117-3.3 |

## 5. 接线原理图（ASCII）
${ASCII_WIRING_EXAMPLE}

## 6. 引脚接线图
### 6.1 MCU引脚定义
| 引脚 | 名称 | 功能 | 连接到 |
|------|------|------|--------|
| PA9 | USART1_TX | 串口发送 | CH340 RX |
| PA10 | USART1_RX | 串口接收 | CH340 TX |

### 6.2 详细接线表
| 线号 | 从元件 | 引脚 | 到元件 | 引脚 | 说明 |
|------|--------|------|--------|------|------|
| W1 | MCU | PA9 | CH340 | RX | 串口发送 |
| W2 | MCU | PA10 | CH340 | TX | 串口接收 |

## 7. 关键电路设计
### 7.1 复位电路
[复位电路原理说明]

### 7.2 时钟电路
[晶振电路原理说明]

### 7.3 通信接口
[RS232/RS485/I2C/SPI等接口设计]

## 8. PCB布局建议
- 关键信号走线
- 电源完整性
- 电磁兼容(EMC)考虑
- 散热设计

## 9. 安全注意事项
- 防反接设计
- 过压/过流保护
- 绝缘等级
- 认证要求

## 10. 调试方法
- 关键测试点
- 常见问题排查
- 测量仪器推荐

请根据用户输入的描述或元件清单，生成完整的电气设计文档。对于不完整的输入，需要基于行业最佳实践进行合理假设并说明。`,
  },
];

function hexToRgb(hex) {
  return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)].join(",");
}

const CHAIN_MAP = {
  prd_full:[{id:"rfc",label:"RFC 分解"},{id:"vibe_spec",label:"Vibe 规格"}],
  project:[{id:"rfc",label:"RFC 分解"},{id:"mvp",label:"MVP 规划"}],
  mvp:[{id:"vibe_spec",label:"Coding 规格"},{id:"marketing",label:"营销文案"}],
  research:[{id:"prd_full",label:"PRD 文档"},{id:"mvp",label:"MVP 规划"}],
  rfc:[{id:"vibe_spec",label:"Vibe Coding 规格"}],
  comic:[],
  electrical:[],
};

export default function IdeaForge() {
  const [phase, setPhase] = useState("input");
  const [idea, setIdea] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [stream, setStream] = useState("");
  const [final, setFinal] = useState("");
  const [history, setHistory] = useState([]);
  const [showHist, setShowHist] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sectCount, setSectCount] = useState(0);
  const [genStatus, setGenStatus] = useState("idle");
  const [genError, setGenError] = useState("");
  const scrollRef = useRef(null);
  const mode = MODES.find(m => m.id === selectedId);
  const savedAnswersRef = useRef({});

  const [activeModel, setActiveModel] = useState(() => localStorage.getItem("ideaforge_active_model") || "anthropic-claude");
  const [modelConfigs, setModelConfigs] = useState(() => {
    const saved = localStorage.getItem("ideaforge_model_configs");
    return saved ? JSON.parse(saved) : {};
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showKeyIds, setShowKeyIds] = useState({});
  const [editMode, setEditMode] = useState(false);

  const [comicScript, setComicScript] = useState("");
  const [comicPanels, setComicPanels] = useState([]);
  const [comicImages, setComicImages] = useState([]);
  const [comicGenStatus, setComicGenStatus] = useState("idle");
  const [comicGenError, setComicGenError] = useState("");
  const [currentGeneratingPanel, setCurrentGeneratingPanel] = useState(0);
  const [imageGenApi, setImageGenApi] = useState("");

  const [importedFiles, setImportedFiles] = useState([]);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileImport = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsImporting(true);
    const newFiles = [];
    let allContent = "";

    for (const file of files) {
      try {
        let content = "";
        const ext = file.name.split(".").pop().toLowerCase();

        if (ext === "txt" || ext === "md" || ext === "json" || ext === "yaml" || ext === "yml" || ext === "xml" || ext === "csv" || ext === "log") {
          content = await file.text();
        } else if (ext === "js" || ext === "ts" || ext === "jsx" || ext === "tsx" || ext === "py" || ext === "html" || ext === "css" || ext === "java" || ext === "c" || ext === "cpp" || ext === "h" || ext === "go" || ext === "rs" || ext === "rb" || ext === "php" || ext === "swift" || ext === "kt") {
          content = await file.text();
        } else if (ext === "pdf") {
          content = `[PDF文件: ${file.name}]\n此文件为PDF格式，内容无法直接读取。建议：\n1. 将PDF内容复制为文本后保存为txt文件再导入\n2. 或手动提取关键内容粘贴到下方输入框`;
        } else if (ext === "doc" || ext === "docx") {
          content = `[Word文档: ${file.name}]\n此文件为Word格式，内容无法直接读取。建议：\n1. 将内容复制为文本后保存为txt文件再导入\n2. 或导出为PDF后导入`;
        } else if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "gif" || ext === "bmp" || ext === "webp") {
          content = `[图片文件: ${file.name}]\n图片内容无法直接读取为文本。`;
        } else {
          try {
            content = await file.text();
          } catch {
            content = `[不支持的文件格式: ${file.name} (${ext})]`;
          }
        }

        newFiles.push({ name: file.name, ext, content, size: file.size });
        allContent += `\n\n=== 文件: ${file.name} ===\n${content}`;
      } catch (err) {
        console.error(`读取文件 ${file.name} 失败:`, err);
        newFiles.push({ name: file.name, ext: file.name.split(".").pop(), content: "", error: true });
      }
    }

    const newIdea = idea ? `${idea}\n\n${allContent}` : allContent;
    setIdea(newIdea);
    setImportedFiles(prev => [...prev, ...newFiles]);
    setIsImporting(false);
    e.target.value = "";
  };

  const clearImportedFiles = () => {
    setImportedFiles([]);
  };

  const toggleShowKey = (modelId) => {
    setShowKeyIds(prev => ({ ...prev, [modelId]: !prev[modelId] }));
  };

  const updateModelConfig = (modelId, field, value) => {
    const newConfigs = {
      ...modelConfigs,
      [modelId]: {
        ...(modelConfigs[modelId] || {}),
        [field]: value,
      }
    };
    localStorage.setItem("ideaforge_model_configs", JSON.stringify(newConfigs));
    setModelConfigs(newConfigs);
  };

  const openSettings = () => {
    setShowSettings(true);
  };

  const exportTemplates = () => {
    const data = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      modes: MODES.map(m => ({
        id: m.id,
        icon: m.icon,
        label: m.label,
        sublabel: m.sublabel,
        desc: m.desc,
        clarifyQuestions: m.clarifyQuestions,
        systemPromptTemplate: m.systemPrompt.toString(),
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `idea-forge-templates-${Date.now()}.json` });
    a.click();
  };

  const importTemplates = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result);
        if (data.modes && Array.isArray(data.modes)) {
          const confirmed = window.confirm(`将导入 ${data.modes.length} 个模板，是否继续？\n注意：这不会删除现有模板，但可能覆盖同名模板。`);
          if (confirmed) {
            alert("模板导入成功！但请注意：当前版本的导入功能仅记录了模板信息，实际模板变更需要手动更新代码。\n\n如需正式支持自定义模板，请告知开发者。");
          }
        } else {
          alert("无效的模板文件格式");
        }
      } catch {
        alert("读取文件失败，请确保是有效的 JSON 文件");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const parseComicPanels = (script) => {
    const panels = [];
    const regex = /【镜头(\d+)】([^\n]+)\n([\s\S]*?)(?=【镜头|\n\n## |$)/g;
    let match;
    while ((match = regex.exec(script)) !== null) {
      panels.push({
        number: match[1],
        type: match[2].trim(),
        description: match[3].trim(),
      });
    }
    return panels;
  };

  const generateComicImages = async () => {
    const imgApiConfig = modelConfigs["image_gen"] || {};
    const apiKey = imgApiConfig?.key;
    const provider = imgApiConfig?.provider || "stabilityai";

    if (!apiKey) {
      alert("请先在设置中配置图像生成 API Key");
      setShowSettings(true);
      return;
    }

    const panels = parseComicPanels(comicScript);
    if (panels.length === 0) {
      alert("未能解析出分镜信息，请确保脚本格式正确");
      return;
    }

    setPhase("comic_generating");
    setComicPanels(panels);
    setComicImages([]);
    setCurrentGeneratingPanel(0);

    const generatedImages = [];
    const style = history[0]?.answers?.comic_style || "少年热血";
    const bubble = history[0]?.answers?.bubble_style || "经典对话泡";
    const color = history[0]?.answers?.color_pref || "全彩";

    for (let i = 0; i < panels.length; i++) {
      setCurrentGeneratingPanel(i);

      const panel = panels[i];
      const prompt = `Comic panel ${panel.number}: ${panel.type}. ${panel.description}. Style: ${style}. Color: ${color}. Manga style with ${bubble}.`;

      try {
        let imageUrl = "";

        if (provider === "stabilityai") {
          const resp = await fetch("https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              text_prompts: [{ text: prompt }],
              cfg_scale: 7,
              height: 1024,
              width: 1024,
              steps: 30,
            }),
          });
          const data = await resp.json();
          if (data.artifacts && data.artifacts[0]) {
            imageUrl = `data:image/png;base64,${data.artifacts[0].base64}`;
          }
        } else if (provider === "openai") {
          const resp = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "dall-e-3",
              prompt: prompt,
              n: 1,
              size: "1024x1024",
            }),
          });
          const data = await resp.json();
          if (data.data && data.data[0]) {
            imageUrl = data.data[0].url;
          }
        } else {
          const customUrl = imgApiConfig?.url || "";
          if (!customUrl) {
            throw new Error("未配置自定义 API 地址");
          }
          const resp = await fetch(customUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ prompt }),
          });
          const data = await resp.json();
          imageUrl = data.url || data.image_url || data.output || "";
        }

        if (imageUrl) {
          generatedImages.push({ url: imageUrl, panelNumber: panel.number });
        }
      } catch (e) {
        console.error(`生成第 ${i + 1} 张图片失败:`, e);
      }
    }

    setComicImages(generatedImages);
    setPhase("comic_output");
  };

  const downloadComicImages = () => {
    comicImages.forEach((img, idx) => {
      const a = document.createElement("a");
      a.href = img.url;
      a.download = `comic-panel-${idx + 1}.png`;
      a.click();
    });
  };

  const getActiveModelKey = () => modelConfigs[activeModel]?.key || "";

  const getActiveModelConfig = () => {
    const cfg = modelConfigs[activeModel] || {};
    return {
      url: cfg.url || DEFAULT_MODELS[activeModel]?.url || "",
      model: cfg.model || DEFAULT_MODELS[activeModel]?.defaultModel || "",
    };
  };

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [stream]);

  const generate = async (ideaText, modeId, ans) => {
    const m = MODES.find(x => x.id === modeId);
    const modelCfg = getActiveModelConfig();
    const apiKey = getActiveModelKey();

    if (!apiKey) {
      alert("请先在设置中配置 " + DEFAULT_MODELS[activeModel].name + " 的 API Key");
      setShowSettings(true);
      return;
    }

    setPhase("generating");
    setStream("");
    setFinal("");
    setSectCount(0);
    setGenStatus("connecting");
    setGenError("");
    savedAnswersRef.current = ans;

    const isAnthropic = activeModel === "anthropic-claude";

    const PROXY_MAP = {
      "anthropic-claude": "/api/anthropic",
      "openai-gpt4": "/api/openai",
      "groq-llama": "/api/groq",
      "deepseek-chat": "/api/deepseek",
      "qwen-turbo": "/api/dashscope",
      "minimax": "/api/minimax",
      "siliconflow": "/api/siliconflow",
    };
    const proxyBase = PROXY_MAP[activeModel] || "";

    const headers = {
      "Content-Type": "application/json",
      ...(isAnthropic ? { "x-api-key": apiKey, "anthropic-version": "2023-06-01" } : { "Authorization": `Bearer ${apiKey}` }),
    };
    const body = isAnthropic
      ? { model: modelCfg.model || "claude-sonnet-4-20250514", max_tokens: 4096, stream: true,
          system: m.systemPrompt(ans), messages: [{ role: "user", content: `想法：${ideaText}` }] }
      : { model: modelCfg.model, max_tokens: 4096, stream: true,
          messages: [{ role: "user", content: `你是一个专业的需求分析师。请严格按照以下规格生成文档。\n\n规格类型：${m.label}\n\n${m.systemPrompt(ans)}\n\n---\n用户想法：${ideaText}` }] };

    try {
      // 运行时检测 Capacitor 环境（每次调用时检测，避免模块加载时 Capacitor 未初始化的问题）
      const isCapacitor = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNative;

      // Capacitor 环境下直接使用真实 API URL（androidScheme: "https" 配置已激活原生 HTTP 拦截）
      // Web 开发环境使用 Vite 代理绕过 CORS
      const requestUrl = isCapacitor
        ? modelCfg.url
        : proxyBase + modelCfg.url.replace(/^https?:\/\/[^/]+/, "");

      const resp = await fetch(requestUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errorText = await resp.text().catch(() => "未知错误");
        throw new Error(`HTTP ${resp.status}: ${errorText.slice(0, 200)}`);
      }

      setGenStatus("streaming");
      const reader = resp.body.getReader(), dec = new TextDecoder();
      let full = "";
      while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        for (const l of dec.decode(value).split("\n")) {
          if (!l.startsWith("data: ")) continue;
          if (l.trim() === "data: [DONE]") break;
          try {
            const d = JSON.parse(l.slice(6));
            if (d.type === "content_block_delta" && d.delta?.text) {
              full += d.delta.text; setStream(full);
              setSectCount((full.match(/^#{1,2} /gm) || []).length);
            }
            if (d.choices && d.choices[0]?.delta?.content) {
              full += d.choices[0].delta.content; setStream(full);
              setSectCount((full.match(/^#{1,2} /gm) || []).length);
            }
          } catch (e) {
          }
        }
      }
      setGenStatus("done");
      setFinal(full);
      setPhase("output");
      setHistory(prev => [{id:Date.now(),modeId,idea:ideaText.slice(0,60),text:full,answers:{...ans},time:new Date().toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"})},...prev.slice(0,9)]);
    } catch (e) {
      setGenStatus("error");
      setGenError(e.message || "生成失败，请检查网络和 API 配置");
      setPhase("clarify");
    }
  };

  const retryGenerate = () => {
    if (idea && selectedId) {
      generate(idea, selectedId, savedAnswersRef.current);
    }
  };

  const copyText = () => { navigator.clipboard.writeText(final||stream); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const download = () => {
    const a = Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([final||stream],{type:"text/markdown"})),download:`idea-forge-${selectedId}.md`});
    a.click();
  };
  const chain = (targetId) => {
    setIdea(`基于以下内容继续：\n\n${(final||stream).slice(0,2000)}`);
    setSelectedId(targetId); setAnswers({}); setPhase("clarify"); setFinal(""); setStream("");
  };

  const r = h => hexToRgb(h);

  return (
    <div style={{minHeight:"100vh",background:"#E8F4FC",fontFamily:"'IBM Plex Sans','Noto Sans SC',sans-serif",color:"#000000"}}>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",background:"radial-gradient(ellipse 60% 45% at 8% 8%,rgba(135,206,235,0.3) 0%,transparent 60%),radial-gradient(ellipse 50% 40% at 92% 92%,rgba(135,206,235,0.2) 0%,transparent 60%)"}} />
      <div style={{position:"fixed",inset:0,pointerEvents:"none",opacity:0.03,backgroundImage:"linear-gradient(#87CEEB 1px,transparent 1px),linear-gradient(90deg,#87CEEB 1px,transparent 1px)",backgroundSize:"48px 48px"}} />

      <div style={{maxWidth:840,margin:"0 auto",padding:"1.8rem 1.1rem",position:"relative",zIndex:1}}>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.7rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.55rem"}}>
            <div style={{width:27,height:27,background:"linear-gradient(135deg,#87CEEB,#004488)",borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.82rem",boxShadow:"0 0 12px rgba(135,206,235,0.7)"}}>⬡</div>
            <span style={{fontWeight:700,fontSize:"1.1rem",fontFamily:"'Playfair Display',serif",color:"#004488",letterSpacing:"-0.02em"}}>Idea Forge</span>
            <span style={{fontSize:"0.6rem",background:"rgba(0,72,136,0.12)",border:"1px solid rgba(0,72,136,0.25)",color:"#004488",padding:"0.07rem 0.38rem",borderRadius:20}}>v2</span>
          </div>
          <div style={{display:"flex",gap:"0.35rem"}}>
            {history.length>0&&<button onClick={()=>setShowHist(!showHist)} style={{background:"transparent",border:"1px solid #B0D4E8",color:"#004488",padding:"0.22rem 0.55rem",borderRadius:4,cursor:"pointer",fontSize:"0.7rem"}}>历史 {history.length}</button>}
            {phase!=="input"&&<button onClick={()=>{setPhase("input");setStream("");setFinal("");}} style={{background:"transparent",border:"1px solid #B0D4E8",color:"#004488",padding:"0.22rem 0.55rem",borderRadius:4,cursor:"pointer",fontSize:"0.7rem"}}>← 重开</button>}
          </div>
        </div>

        {showHist&&history.length>0&&(
          <div style={{marginBottom:"1.3rem",background:"#FFFFFF",border:"1px solid #B0D4E8",borderRadius:9,padding:"0.8rem"}}>
            <div style={{fontSize:"0.65rem",color:"#004488",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.55rem"}}>历史记录</div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.3rem"}}>
              {history.map(h=>{
                const hm=MODES.find(m=>m.id===h.modeId);
                return <button key={h.id} onClick={()=>{setIdea(h.idea);setSelectedId(h.modeId);setAnswers(h.answers);setFinal(h.text);setStream(h.text);setPhase("output");setShowHist(false);}} style={{background:"#F0F8FF",border:"1px solid #B0D4E8",borderRadius:6,padding:"0.45rem 0.65rem",cursor:"pointer",textAlign:"left"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#87CEEB"} onMouseLeave={e=>e.currentTarget.style.borderColor="#B0D4E8"}>
                  <div style={{display:"flex",alignItems:"center",gap:"0.3rem",marginBottom:"0.15rem"}}>
                    <span style={{color:hm?.color,fontSize:"0.78rem"}}>{hm?.icon}</span>
                    <span style={{fontSize:"0.7rem",color:"#004488"}}>{hm?.label}</span>
                    <span style={{marginLeft:"auto",fontSize:"0.62rem",color:"#88AACC"}}>{h.time}</span>
                  </div>
                  <div style={{fontSize:"0.7rem",color:"#336699",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.idea}</div>
                </button>;
              })}
            </div>
          </div>
        )}

        {phase==="input"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"1.2rem"}}>
            <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:"0.6rem"}}>
              <div style={{fontSize:"0.65rem",color:"#004488",letterSpacing:"0.08em",textTransform:"uppercase"}}>选择模型</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"0.3rem",flex:1}}>
                {Object.entries(DEFAULT_MODELS).map(([key, m]) => {
                  const hasKey = modelConfigs[key]?.key;
                  const isActive = activeModel === key;
                  return (
                    <button key={key} onClick={() => { setActiveModel(key); localStorage.setItem("ideaforge_active_model", key); }}
                      style={{padding:"0.2rem 0.5rem",borderRadius:20,fontSize:"0.68rem",cursor:"pointer",
                        border:`1px solid ${isActive ? "#004488" : "#B0D4E8"}`,
                        background: isActive ? "#004488" : (hasKey ? "#E8F4FC" : "#FFFFFF"),
                        color: isActive ? "#FFFFFF" : (hasKey ? "#004488" : "#88AACC"),
                        transition:"all 0.13s"}}>
                      {hasKey ? "✓ " : ""}{m.name}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => openSettings(activeModel)} style={{background:"transparent",border:"1px solid #B0D4E8",color:"#004488",padding:"0.15rem 0.4rem",borderRadius:4,cursor:"pointer",fontSize:"0.6rem"}}>⚙ 设置</button>
              <label style={{background:"#E8F4FC",border:"1px solid #B0D4E8",color:"#004488",padding:"0.2rem 0.5rem",borderRadius:4,cursor:"pointer",fontSize:"0.68rem",display:"flex",alignItems:"center",gap:"0.2rem"}}>
                {isImporting ? "导入中..." : "📎 导入文件"}
                <input type="file" multiple accept=".txt,.md,.json,.yaml,.yml,.xml,.csv,.js,.ts,.jsx,.tsx,.py,.html,.css,.java,.c,.cpp,.h,.go,.rs,.rb,.php,.swift,.kt,.pdf,.doc,.docx,.log" onChange={handleFileImport} style={{display:"none"}} />
              </label>
            </div>
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.4rem"}}>
                <div style={{fontSize:"0.65rem",color:"#004488",letterSpacing:"0.08em",textTransform:"uppercase"}}>你的想法</div>
                {importedFiles.length > 0 && (
                  <div style={{display:"flex",alignItems:"center",gap:"0.3rem",fontSize:"0.65rem",color:"#34A834"}}>
                    <span>✓</span>
                    <span>已导入 {importedFiles.length} 个文件</span>
                    <button onClick={clearImportedFiles} style={{background:"transparent",border:"none",color:"#CC4444",cursor:"pointer",fontSize:"0.65rem",padding:"0"}}>清除</button>
                  </div>
                )}
              </div>
              <textarea value={idea} onChange={e=>setIdea(e.target.value)} placeholder={"粗略描述即可，细节下一步填写...\n\n支持导入文件作为补充：txt/md/json/yaml/代码文件等\n\n例：帮程序员管理 AI 提示词，支持版本控制和团队协作"} style={{width:"100%",minHeight:180,background:"#FFFFFF",border:`1px solid ${idea?"#87CEEB":"#B0D4E8"}`,borderRadius:8,padding:"0.8rem 0.9rem",color:"#000000",fontSize:"0.86rem",lineHeight:1.7,resize:"vertical",outline:"none",boxSizing:"border-box",fontFamily:"inherit",transition:"border-color 0.2s"}} onFocus={e=>e.target.style.borderColor="#004488"} onBlur={e=>e.target.style.borderColor=idea?"#87CEEB":"#B0D4E8"} />
              {importedFiles.length > 0 && (
                <div style={{marginTop:"0.5rem",display:"flex",flexWrap:"wrap",gap:"0.3rem"}}>
                  {importedFiles.map((f, idx) => (
                    <span key={idx} style={{background:"#F0F8FF",border:"1px solid #B0D4E8",borderRadius:4,padding:"0.15rem 0.4rem",fontSize:"0.65rem",color:"#336699"}}>
                      {f.error ? "❌" : "📄"} {f.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div style={{fontSize:"0.65rem",color:"#004488",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.6rem"}}>生成方向</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:"0.45rem"}}>
                {MODES.map(m=>{
                  const active=selectedId===m.id;
                  return <button key={m.id} onClick={()=>setSelectedId(m.id)} style={{background:active?`rgba(${r(m.color)},0.12)`:"#FFFFFF",border:`1px solid ${active?m.color+"60":"#B0D4E8"}`,borderRadius:8,padding:"0.7rem 0.8rem",cursor:"pointer",textAlign:"left",transition:"all 0.13s",boxShadow:active?`0 0 12px rgba(${r(m.color)},0.15)`:"none"}} onMouseEnter={e=>{if(!active)e.currentTarget.style.borderColor="#87CEEB";}} onMouseLeave={e=>{if(!active)e.currentTarget.style.borderColor="#B0D4E8";}}>
                    <div style={{display:"flex",alignItems:"center",gap:"0.3rem",marginBottom:"0.2rem"}}>
                      <span style={{color:m.color,fontSize:"0.88rem"}}>{m.icon}</span>
                      <span style={{fontSize:"0.77rem",fontWeight:600,color:active?m.color:"#004488"}}  >{m.label}</span>
                    </div>
                    <div style={{fontSize:"0.6rem",color:"#6699BB",marginBottom:"0.25rem"}}>{m.sublabel}</div>
                    <div style={{fontSize:"0.68rem",color:"#336699",lineHeight:1.45}}>{m.desc}</div>
                  </button>;
                })}
              </div>
            </div>
            <button onClick={()=>{if(idea.trim()&&selectedId){setAnswers({});setPhase("clarify");}}} disabled={!idea.trim()||!selectedId} style={{background:(idea&&selectedId)?`linear-gradient(135deg,rgba(${r(mode?.color||"#004488")},0.85),rgba(${r(mode?.color||"#004488")},0.5))`:"#E8F4FC",border:"1px solid #B0D4E8",borderRadius:8,padding:"0.78rem",color:(idea&&selectedId)?"#FFFFFF":"#88AACC",fontSize:"0.86rem",fontWeight:600,cursor:(idea&&selectedId)?"pointer":"default",transition:"all 0.2s",boxShadow:(idea&&selectedId)?`0 4px 18px rgba(${r(mode?.color||"#004488")},0.25)`:"none"}}>
              {idea&&selectedId?`精调参数 →`:"请输入想法并选择方向"}
            </button>
          </div>
        )}

        {phase==="clarify"&&mode&&(
          <div style={{display:"flex",flexDirection:"column",gap:"1.2rem"}}>
            <div style={{background:"#FFFFFF",border:"1px solid #B0D4E8",borderRadius:8,padding:"0.7rem 0.85rem",display:"flex",alignItems:"flex-start",gap:"0.5rem"}}>
              <span style={{color:mode.color,fontSize:"0.9rem",marginTop:"0.04rem"}}>{mode.icon}</span>
              <div>
                <div style={{fontSize:"0.7rem",color:mode.color,marginBottom:"0.15rem"}}>{mode.label}</div>
                <div style={{fontSize:"0.77rem",color:"#336699",lineHeight:1.5}}>{idea.slice(0,100)}{idea.length>100?"...":""}</div>
              </div>
            </div>
            <div>
              <div style={{fontSize:"0.65rem",color:"#004488",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.7rem"}}>精调参数</div>
              <div style={{display:"flex",flexDirection:"column",gap:"0.9rem"}}>
                {mode.clarifyQuestions.map(q=>(
                  <div key={q.key}>
                    <div style={{fontSize:"0.73rem",color:"#336699",marginBottom:"0.38rem"}}>{q.q}</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"0.3rem"}}>
                      {q.opts.map(opt=>{
                        const active=answers[q.key]===opt;
                        return <button key={opt} onClick={()=>setAnswers(p=>({...p,[q.key]:opt}))} style={{padding:"0.25rem 0.6rem",borderRadius:20,fontSize:"0.73rem",cursor:"pointer",border:`1px solid ${active?mode.color+"55":"#B0D4E8"}`,background:active?`rgba(${r(mode.color)},0.12)`:"#FFFFFF",color:active?mode.color:"#336699",transition:"all 0.13s",boxShadow:active?`0 0 6px rgba(${r(mode.color)},0.2)`:"none"}}>{opt}</button>;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:"0.45rem"}}>
              <button onClick={()=>setPhase("input")} style={{flex:1,background:"transparent",border:"1px solid #B0D4E8",color:"#004488",padding:"0.65rem",borderRadius:7,cursor:"pointer",fontSize:"0.8rem"}}>← 返回</button>
              <button onClick={()=>generate(idea,selectedId,answers)} style={{flex:3,background:`linear-gradient(135deg,rgba(${r(mode.color)},0.85),rgba(${r(mode.color)},0.5))`,border:"none",borderRadius:7,padding:"0.65rem",color:"#FFFFFF",fontSize:"0.86rem",fontWeight:600,cursor:"pointer",boxShadow:`0 4px 16px rgba(${r(mode.color)},0.3)`}}>
                生成 {mode.label} ⚡
              </button>
            </div>
          </div>
        )}

        {phase==="generating"&&mode&&(
          <div style={{display:"flex",flexDirection:"column",gap:"0.9rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.6rem",padding:"0.4rem 0 "}}>
              {genStatus === "connecting" ? (
                <>
                  <div style={{width:6,height:6,borderRadius:"50%",background:"#88AACC",animation:"pulse 1s infinite"}} />
                  <span style={{fontSize:"0.76rem",color:"#6699BB"}}>正在连接...</span>
                </>
              ) : (
                <>
                  <div style={{width:6,height:6,borderRadius:"50%",background:mode.color,boxShadow:`0 0 7px ${mode.color}`,animation:"pulse 1.5s infinite"}} />
                  <span style={{fontSize:"0.76rem",color:mode.color}}>正在生成 {mode.label}</span>
                </>
              )}
              <span style={{fontSize:"0.7rem",color:"#6699BB",marginLeft:"auto"}}>已解析 {sectCount} 段</span>
            </div>
            <div ref={scrollRef} style={{background:"#FFFFFF",border:"1px solid #B0D4E8",borderRadius:10,padding:"1rem 1.2rem",minHeight:260,maxHeight:480,overflowY:"auto",scrollbarWidth:"thin",scrollbarColor:"#B0D4E8 transparent"}}>
              {genStatus === "connecting" ? (
                <div style={{color:"#88AACC",fontSize:"0.85rem",padding:"1rem",textAlign:"center"}}>
                  正在建立连接，请稍候...
                </div>
              ) : (
                <>
                  <MD src={stream} />
                  <span style={{display:"inline-block",width:5,height:11,background:mode.color,borderRadius:1,marginLeft:2,animation:"blink 1s infinite"}} />
                </>
              )}
            </div>
            {genStatus === "error" && (
              <div style={{background:"#FFF5F5",border:"1px solid #FFCCCC",borderRadius:8,padding:"0.8rem",color:"#CC4444",fontSize:"0.8rem"}}>
                <strong>生成失败：</strong>{genError}
              </div>
            )}
          </div>
        )}

        {phase==="output"&&mode&&(
          <div style={{display:"flex",flexDirection:"column",gap:"0.8rem"}}>
            <div style={{background:"#F0F8FF",border:"1px solid #B0D4E8",borderRadius:8,padding:"0.6rem 0.8rem",fontSize:"0.72rem",color:"#336699"}}>
              <strong>当前参数：</strong>
              {Object.entries(history[0]?.answers || {}).map(([k, v]) => ` ${k}: ${v}`).join(" | ")}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"0.4rem",flexWrap:"wrap"}}>
              <span style={{color:mode.color}}>{mode.icon}</span>
              <span style={{fontSize:"0.78rem",color:mode.color,fontWeight:600}}>{mode.label}</span>
              <span style={{color:"#B0D4E8"}}>·</span>
              <span style={{fontSize:"0.7rem",color:"#336699",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{idea.slice(0,55)}</span>
              <div style={{display:"flex",gap:"0.3rem"}}>
                <button onClick={() => setEditMode(!editMode)} style={{background:editMode?"rgba(0,68,136,0.1)":"transparent",border:`1px solid ${editMode?"#004488":"#B0D4E8"}`,color:editMode?"#004488":"#004488",padding:"0.22rem 0.55rem",borderRadius:4,cursor:"pointer",fontSize:"0.7rem",transition:"all 0.2s"}}>{editMode?"📄 预览":"✏️ 编辑"}</button>
                <button onClick={copyText} style={{background:copied?"rgba(52,211,153,0.1)":"transparent",border:`1px solid ${copied?"#34D39960":"#B0D4E8"}`,color:copied?"#34D399":"#004488",padding:"0.22rem 0.55rem",borderRadius:4,cursor:"pointer",fontSize:"0.7rem",transition:"all 0.2s"}}>{copied?"✓ 已复制":"复制"}</button>
                <button onClick={download} style={{background:"transparent",border:"1px solid #B0D4E8",color:"#004488",padding:"0.22rem 0.55rem",borderRadius:4,cursor:"pointer",fontSize:"0.7rem"}}>↓ .md</button>
              </div>
            </div>
            {editMode ? (
              <textarea
                value={final || stream}
                onChange={(e) => setFinal(e.target.value)}
                style={{background:"#FFFFFF",border:"1px solid #B0D4E8",borderRadius:10,padding:"1rem 1.2rem",minHeight:400,maxHeight:500,overflowY:"auto",scrollbarWidth:"thin",scrollbarColor:"#B0D4E8 transparent",width:"100%",boxSizing:"border-box",fontFamily:"'JetBrains Mono',monospace",fontSize:"0.8rem",lineHeight:1.6,color:"#003366",resize:"vertical"}}
              />
            ) : (
              <div ref={scrollRef} style={{background:"#FFFFFF",border:"1px solid #B0D4E8",borderRadius:10,padding:"1rem 1.2rem",maxHeight:500,overflowY:"auto",scrollbarWidth:"thin",scrollbarColor:"#B0D4E8 transparent"}}>
                <MD src={final||stream} />
              </div>
            )}
            {CHAIN_MAP[selectedId]&&(
              <div>
                <div style={{fontSize:"0.62rem",color:"#6699BB",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:"0.38rem"}}>链式生成</div>
                <div style={{display:"flex",gap:"0.3rem",flexWrap:"wrap"}}>
                  {CHAIN_MAP[selectedId].map(ch=>{
                    const cm=MODES.find(m=>m.id===ch.id);
                    return <button key={ch.id} onClick={()=>chain(ch.id)} style={{background:"#FFFFFF",border:`1px solid ${cm?.color||"#888"}30`,color:cm?.color||"#888",padding:"0.25rem 0.6rem",borderRadius:4,cursor:"pointer",fontSize:"0.71rem",transition:"all 0.13s"}} onMouseEnter={e=>e.currentTarget.style.background=`rgba(${r(cm?.color||"#888")},0.1)`} onMouseLeave={e=>e.currentTarget.style.background="#FFFFFF"}>{cm?.icon} → {ch.label}</button>;
                  })}
                </div>
              </div>
            )}
            <div style={{display:"flex",gap:"0.35rem"}}>
              <button onClick={()=>{setPhase("input");setSelectedId(null);setIdea("");}} style={{background:"transparent",border:"1px solid #B0D4E8",color:"#004488",padding:"0.27rem 0.7rem",borderRadius:4,cursor:"pointer",fontSize:"0.73rem"}}>新想法</button>
              <button onClick={retryGenerate} style={{background:"transparent",border:"1px solid #87CEEB",color:"#004488",padding:"0.27rem 0.7rem",borderRadius:4,cursor:"pointer",fontSize:"0.73rem"}}>🔄 重试</button>
              <button onClick={()=>setPhase("clarify")} style={{background:"transparent",border:"1px solid #B0D4E8",color:"#004488",padding:"0.27rem 0.7rem",borderRadius:4,cursor:"pointer",fontSize:"0.73rem"}}>修改参数</button>
              {selectedId === "comic" && (
                <button onClick={() => { setComicScript(final || stream); setPhase("comic_script"); }} style={{background:"linear-gradient(135deg,#FF6B9D,#FF3366)",border:"none",color:"#FFFFFF",padding:"0.27rem 0.7rem",borderRadius:4,cursor:"pointer",fontSize:"0.73rem",fontWeight:600}}>🎨 生成漫画</button>
              )}
            </div>
          </div>
        )}

        {phase === "comic_script" && (
          <div style={{display:"flex",flexDirection:"column",gap:"0.8rem"}}>
            <div style={{background:"linear-gradient(135deg,#FFF0F5,#FFE4EC)",border:"1px solid #FFB6C1",borderRadius:8,padding:"0.8rem",display:"flex",alignItems:"center",gap:"0.5rem"}}>
              <span style={{fontSize:"1.2rem"}}>🎨</span>
              <div>
                <div style={{fontSize:"0.85rem",color:"#CC3366",fontWeight:600}}>漫画脚本确认</div>
                <div style={{fontSize:"0.7rem",color:"#AA6688"}}>请检查并编辑脚本，确认后再生成漫画图片</div>
              </div>
            </div>

            <div style={{background:"#FFFFFF",border:"1px solid #FFB6C1",borderRadius:8,padding:"0.6rem",display:"flex",gap:"0.5rem",flexWrap:"wrap",fontSize:"0.72rem",color:"#CC3366"}}>
              <span><strong>风格：</strong>{history[0]?.answers?.comic_style || answers?.comic_style || "未选择"}</span>
              <span><strong>气泡：</strong>{history[0]?.answers?.bubble_style || answers?.bubble_style || "未选择"}</span>
              <span><strong>分镜：</strong>{history[0]?.answers?.panel_count || answers?.panel_count || "未选择"}</span>
              <span><strong>色彩：</strong>{history[0]?.answers?.color_pref || answers?.color_pref || "未选择"}</span>
            </div>

            <textarea
              value={comicScript}
              onChange={(e) => setComicScript(e.target.value)}
              style={{background:"#FFFFFF",border:"1px solid #FFB6C1",borderRadius:10,padding:"1rem",minHeight:400,maxHeight:600,overflowY:"auto",scrollbarWidth:"thin",scrollbarColor:"#FFB6C1 transparent",width:"100%",boxSizing:"border-box",fontFamily:"'JetBrains Mono','Noto Sans SC',monospace",fontSize:"0.8rem",lineHeight:1.7,color:"#003366",resize:"vertical"}}
            />

            <div style={{display:"flex",gap:"0.45rem"}}>
              <button onClick={() => setPhase("output")} style={{flex:1,background:"transparent",border:"1px solid #B0D4E8",color:"#6699BB",padding:"0.65rem",borderRadius:7,cursor:"pointer",fontSize:"0.8rem"}}>← 返回</button>
              <button onClick={() => generateComicImages()} style={{flex:2,background:"linear-gradient(135deg,#FF6B9D,#FF3366)",border:"none",borderRadius:7,padding:"0.65rem",color:"#FFFFFF",fontSize:"0.86rem",fontWeight:600,cursor:"pointer",boxShadow:"0 4px 16px rgba(255,107,157,0.3)"}}>⚡ 生成漫画图片</button>
            </div>
          </div>
        )}

        {phase === "comic_generating" && (
          <div style={{display:"flex",flexDirection:"column",gap:"1rem",alignItems:"center",padding:"2rem 1rem"}}>
            <div style={{fontSize:"3rem",animation:"pulse 1.5s infinite"}}>🎨</div>
            <div style={{fontSize:"1rem",color:"#CC3366",fontWeight:600}}>正在生成漫画图片...</div>
            <div style={{fontSize:"0.85rem",color:"#AA6688"}}>正在处理第 {currentGeneratingPanel + 1} / {comicPanels.length || "?"} 张</div>
            <div style={{width:"100%",maxWidth:400,height:6,background:"#FFE4EC",borderRadius:3,overflow:"hidden"}}>
              <div style={{width:"60%",height:"100%",background:"linear-gradient(90deg,#FF6B9D,#FF3366)",borderRadius:3,animation:"pulse 1s infinite"}} />
            </div>
            <div style={{fontSize:"0.75rem",color:"#AA88AA",textAlign:"center"}}>
              图像生成需要较长时间，请耐心等待...<br/>
              生成完成后会自动显示
            </div>
          </div>
        )}

        {phase === "comic_output" && comicImages.length > 0 && (
          <div style={{display:"flex",flexDirection:"column",gap:"0.8rem"}}>
            <div style={{background:"linear-gradient(135deg,#FFF0F5,#FFE4EC)",border:"1px solid #FFB6C1",borderRadius:8,padding:"0.8rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                <span style={{fontSize:"1.2rem"}}>🎨</span>
                <div>
                  <div style={{fontSize:"0.85rem",color:"#CC3366",fontWeight:600}}>漫画生成完成</div>
                  <div style={{fontSize:"0.7rem",color:"#AA6688"}}>共 {comicImages.length} 张图片</div>
                </div>
              </div>
              <button onClick={() => { setComicImages([]); setPhase("comic_script"); }} style={{background:"transparent",border:"1px solid #FFB6C1",color:"#CC3366",padding:"0.3rem 0.6rem",borderRadius:4,cursor:"pointer",fontSize:"0.72rem"}}>重新生成</button>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:"1rem"}}>
              {comicImages.map((img, idx) => (
                <div key={idx} style={{background:"#FFFFFF",border:"1px solid #FFB6C1",borderRadius:10,overflow:"hidden"}}>
                  <img src={img.url} alt={`漫画 ${idx + 1}`} style={{width:"100%",height:"auto",display:"block"}} />
                  <div style={{padding:"0.5rem",fontSize:"0.7rem",color:"#AA6688",background:"#FFF9FB"}}>第 {idx + 1} 张</div>
                </div>
              ))}
            </div>

            <div style={{display:"flex",gap:"0.35rem",marginTop:"0.5rem"}}>
              <button onClick={() => { setComicImages([]); setPhase("comic_script"); }} style={{background:"transparent",border:"1px solid #B0D4E8",color:"#6699BB",padding:"0.5rem 1rem",borderRadius:4,cursor:"pointer",fontSize:"0.8rem"}}>修改脚本</button>
              <button onClick={() => downloadComicImages()} style={{background:"#FF6B9D",border:"none",color:"#FFFFFF",padding:"0.5rem 1rem",borderRadius:4,cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>📥 下载全部</button>
            </div>
          </div>
        )}
      </div>

      {showSettings && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,overflowY:"auto",padding:"1rem"}} onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}>
          <div style={{background:"#FFFFFF",border:"1px solid #B0D4E8",borderRadius:12,padding:"1.5rem",width:480,maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem"}}>
              <h3 style={{margin:0,fontSize:"1rem",color:"#003366"}}>⚙ 模型配置</h3>
              <button onClick={() => setShowSettings(false)} style={{background:"transparent",border:"none",fontSize:"1.5rem",cursor:"pointer",color:"#88AACC",lineHeight:1}}>×</button>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
              {Object.entries(DEFAULT_MODELS).filter(([key]) => key !== "custom").map(([key, model]) => (
                <div key={key} style={{background:"#F8FBFF",border:"1px solid #B0D4E8",borderRadius:8,padding:"0.8rem"}}>
                  <div style={{fontSize:"0.85rem",color:"#004488",marginBottom:"0.5rem",fontWeight:600}}>{model.name}</div>

                  <div style={{marginBottom:"0.5rem"}}>
                    <div style={{fontSize:"0.68rem",color:"#6699BB",marginBottom:"0.2rem"}}>API Key</div>
                    <div style={{display:"flex",gap:"0.3rem"}}>
                      <input type={showKeyIds[key] ? "text" : "password"}
                        value={modelConfigs[key]?.key || ""}
                        onChange={(e) => updateModelConfig(key, "key", e.target.value)}
                        placeholder={model.keyPlaceholder || "输入 API Key"}
                        style={{flex:1,padding:"0.4rem 0.5rem",border:"1px solid #B0D4E8",borderRadius:4,fontSize:"0.78rem",background:"#FFFFFF",color:"#000",boxSizing:"border-box"}} />
                      <button onClick={() => toggleShowKey(key)} style={{padding:"0.3rem 0.5rem",border:"1px solid #B0D4E8",borderRadius:4,background:"#FFFFFF",cursor:"pointer",fontSize:"0.7rem",color:"#004488"}}>
                        {showKeyIds[key] ? "🔒" : "👁"}
                      </button>
                    </div>
                  </div>

                  {model.models ? (
                    <div>
                      <div style={{fontSize:"0.68rem",color:"#6699BB",marginBottom:"0.2rem"}}>选择模型</div>
                      <select
                        value={modelConfigs[key]?.model || model.defaultModel || ""}
                        onChange={(e) => updateModelConfig(key, "model", e.target.value)}
                        style={{width:"100%",padding:"0.4rem 0.5rem",border:"1px solid #B0D4E8",borderRadius:4,fontSize:"0.78rem",background:"#FFFFFF",color:"#000",boxSizing:"border-box"}}>
                        {model.models.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <div style={{fontSize:"0.68rem",color:"#6699BB",marginBottom:"0.2rem"}}>模型</div>
                      <input type="text"
                        value={modelConfigs[key]?.model || model.defaultModel || ""}
                        onChange={(e) => updateModelConfig(key, "model", e.target.value)}
                        placeholder={model.defaultModel || "如: gpt-4-turbo"}
                        style={{width:"100%",padding:"0.4rem 0.5rem",border:"1px solid #B0D4E8",borderRadius:4,fontSize:"0.78rem",background:"#FFFFFF",color:"#000",boxSizing:"border-box"}} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{marginTop:"1.2rem",paddingTop:"1rem",borderTop:"1px solid #B0D4E8"}}>
              <div style={{fontSize:"0.75rem",color:"#004488",marginBottom:"0.5rem",fontWeight:600}}>模板管理</div>
              <div style={{display:"flex",gap:"0.5rem"}}>
                <button onClick={exportTemplates} style={{padding:"0.35rem 0.7rem",border:"1px solid #B0D4E8",borderRadius:4,background:"#FFFFFF",color:"#004488",cursor:"pointer",fontSize:"0.72rem"}}>📤 导出模板</button>
                <label style={{padding:"0.35rem 0.7rem",border:"1px solid #B0D4E8",borderRadius:4,background:"#FFFFFF",color:"#004488",cursor:"pointer",fontSize:"0.72rem"}}>
                  📥 导入模板
                  <input type="file" accept=".json" onChange={importTemplates} style={{display:"none"}} />
                </label>
              </div>
              <div style={{fontSize:"0.65rem",color:"#88AACC",marginTop:"0.3rem"}}>支持 JSON 格式，用于备份或分享模板配置</div>
            </div>

            <div style={{marginTop:"0.8rem",padding:"0.6rem",background:"#FFF9E6",border:"1px solid #FFE4A0",borderRadius:6}}>
              <div style={{fontSize:"0.72rem",color:"#996600",marginBottom:"0.25rem"}}>💡 提示</div>
              <div style={{fontSize:"0.65rem",color:"#AA8800",lineHeight:1.5}}>
                当前通过 Vite 开发服务器代理转发 API 请求，可解决浏览器 CORS 限制。<br/>
                生产环境部署建议：配置 Nginx 反向代理或使用后端服务转发请求。
              </div>
            </div>

            <div style={{marginTop:"0.8rem",padding:"0.7rem",background:"#FFF0F5",border:"1px solid #FFB6C1",borderRadius:6}}>
              <div style={{fontSize:"0.75rem",color:"#CC3366",marginBottom:"0.5rem",fontWeight:600}}>图像生成 API（漫画模式专用）</div>
              <div style={{marginBottom:"0.5rem"}}>
                <div style={{fontSize:"0.68rem",color:"#6699BB",marginBottom:"0.2rem"}}>API 提供商</div>
                <select value={modelConfigs["image_gen"]?.provider || "stabilityai"} onChange={(e) => updateModelConfig("image_gen", "provider", e.target.value)} style={{width:"100%",padding:"0.35rem 0.5rem",border:"1px solid #FFB6C1",borderRadius:4,fontSize:"0.75rem",background:"#FFFFFF",color:"#000",boxSizing:"border-box"}}>
                  <option value="stabilityai">Stability AI (免费)</option>
                  <option value="openai">OpenAI DALL-E</option>
                  <option value="custom">自定义 API</option>
                </select>
              </div>
              <div style={{marginBottom:"0.5rem"}}>
                <div style={{fontSize:"0.68rem",color:"#6699BB",marginBottom:"0.2rem"}}>API Key</div>
                <div style={{display:"flex",gap:"0.3rem"}}>
                  <input type={showKeyIds["image_gen"] ? "text" : "password"} value={modelConfigs["image_gen"]?.key || ""} onChange={(e) => updateModelConfig("image_gen", "key", e.target.value)} placeholder="输入 API Key" style={{flex:1,padding:"0.35rem 0.5rem",border:"1px solid #FFB6C1",borderRadius:4,fontSize:"0.75rem",background:"#FFFFFF",color:"#000",boxSizing:"border-box"}} />
                  <button onClick={() => toggleShowKey("image_gen")} style={{padding:"0.25rem 0.4rem",border:"1px solid #FFB6C1",borderRadius:4,background:"#FFFFFF",cursor:"pointer",fontSize:"0.65rem",color:"#CC3366"}}>{showKeyIds["image_gen"] ? "🔒" : "👁"}</button>
                </div>
              </div>
              {modelConfigs["image_gen"]?.provider === "custom" && (
                <div>
                  <div style={{fontSize:"0.68rem",color:"#6699BB",marginBottom:"0.2rem"}}>自定义 API 地址</div>
                  <input type="text" value={modelConfigs["image_gen"]?.url || ""} onChange={(e) => updateModelConfig("image_gen", "url", e.target.value)} placeholder="https://api.example.com/v1/images/generations" style={{width:"100%",padding:"0.35rem 0.5rem",border:"1px solid #FFB6C1",borderRadius:4,fontSize:"0.75rem",background:"#FFFFFF",color:"#000",boxSizing:"border-box"}} />
                </div>
              )}
            </div>

            <div style={{marginTop:"1rem",display:"flex",justifyContent:"flex-end"}}>
              <button onClick={() => setShowSettings(false)} style={{padding:"0.5rem 1.2rem",border:"none",borderRadius:6,background:"#004488",color:"#FFFFFF",cursor:"pointer",fontSize:"0.85rem"}}>完成</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Playfair+Display:wght@700&family=Noto+Sans+SC:wght@400;500;600&display=swap');
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        textarea::placeholder{color:#88AACC}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:#B0D4E8;border-radius:2px}
      `}</style>
    </div>
  );
}
