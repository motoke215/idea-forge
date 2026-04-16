# Idea Forge - 项目记忆

## 基本信息
- **项目路径**: `D:\AI项目\想法实现工具`
- **技术栈**: React + Vite，单文件 JSX (`idea-forge.jsx`)
- **端口**: 6177（固定端口）
- **Dev Server**: `npm run dev`

## 项目概述
AI 驱动的需求文档生成器，将用户想法转化为结构化文档（PRD/RFC/Vibe Spec/Skill 等），并新增**漫画大师**模式支持从脚本到漫画的一站式生成。

## 开发历程

### 初始状态
- 黑色暗紫主题 (`#04040C`)
- 仅支持 Claude 官方 API
- 硬编码端口 5173

### 已完成的功能修改

#### 1. 主题变更
- 背景色：`#04040C` (深紫) → `#E8F4FC` (天蓝色)
- 文字色：`#A8A8C8` → `#000000`
- 所有深色边框/背景 → 天蓝色系 `#B0D4E8` / `#87CEEB`
- 卡片背景改为白色/浅蓝

#### 2. 端口变更
- `vite.config.js`: 6173 → 6177（固定）
- 一键启动脚本 `想法实现工具.bat` 直接打开 6177

#### 3. 模型配置系统
- **支持模型**:
  - Claude (Anthropic) - `/api/anthropic` 代理
  - GPT-4 (OpenAI) - `/api/openai` 代理
  - Llama (Groq) - `/api/groq` 代理
  - DeepSeek - `/api/deepseek` 代理
  - Qwen (DashScope) - `/api/dashscope` 代理
  - MiniMax (海螺) - `/api/minimax` 代理
  - SiliconFlow (硅基流动) - `/api/siliconflow` 代理
  - 自定义 API

- **配置特性**:
  - 每个模型独立 API Key 输入框
  - Key 值可切换显示/隐藏（👁/🔒）
  - 模型名称/URL 独立配置
  - SiliconFlow 支持下拉选择具体模型（Qwen/DeepSeek/Yi/GLM/Phi/Llama 等）
  - 配置持久化到 localStorage (`ideaforge_model_configs`)
  - 活跃模型持久化 (`ideaforge_active_model`)

#### 4. CORS 代理配置
- `vite.config.js` 配置了各 API 的代理
- 前端通过代理调用，避免 CORS 问题

### 代码结构
- `idea-forge.jsx` - 主组件（约 1000+ 行）
- `vite.config.js` - Vite 配置
- `src/main.jsx` - React 入口
- `src/theme.js` - 设计系统（新增）
- `src/MD.jsx` - Markdown 渲染组件（新增）
- `package.json` - 依赖配置

## 优化计划（已执行）

### 高优先级 ✅ 已完成
1. ✅ **流式输出修复** - 添加 `data: [DONE]` 终止信号处理，错误时显示具体信息
2. ✅ **重试机制** - Output 阶段添加「🔄 重试」按钮，保持参数不变
3. ✅ **加载状态** - 添加「正在连接...」状态显示，区分连接和流式传输阶段

### 中优先级 ✅ 已完成
4. **代码架构拆分** - 提取 MD 组件到 `src/MD.jsx`
5. **样式管理** - 提取主题配置到 `src/theme.js`
6. ✅ **预览/编辑切换** - Output 阶段添加「✏️ 编辑」和「📄 预览」切换按钮
7. ✅ **参数显示** - 已在 Output 阶段显示当前使用的参数

### 低优先级
9. Prompt 不可定制 - 建议支持 JSON 导入/导出模板
10. CORS 仍有限制 - 建议增加后端代理模式说明

## 最新变更（2026-04-12 下午）

### UI 布局优化
- **模型选择移至顶部**：与"导入文件"按钮同一行排列，使用 flexWrap 自动换行（位置不够自动生成两行）
- **想法输入框高度增加**：minHeight 120 → 180，使整体布局更协调
- **文件导入按钮**：移至模型选择行的右侧

### 电气工程师模式修复
- **问题**：ASCII 接线图中的 Unicode box-drawing 字符（┌ ─ ┬ ┐ │ └ ┘）导致 Babel 解析错误
- **修复**：将 ASCII 接线图提取为独立常量 `ASCII_WIRING_EXAMPLE = String.raw\`...\``，通过模板字符串插值引入

### 启动脚本
- 新增 `想法实现工具.bat` 一键启动脚本

## 架构拆分（2026-04-12 上午）

### 架构拆分
- 新增 `src/theme.js` - 设计系统统一管理颜色/字体/阴影等 token
- 新增 `src/MD.jsx` - Markdown 渲染组件独立文件
- `idea-forge.jsx` 现在导入 `MD` 从 `./src/MD`

### 预览/编辑功能
- 新增 `editMode` 状态（预览/编辑切换）
- Output 阶段新增「✏️ 编辑」按钮切换到文本编辑模式
- 编辑模式下显示 textarea，可直接修改生成内容
- 复制/下载操作使用编辑后的内容

### 漫画大师模式 🎨
新增「漫画大师」生成方向：

**参数选项：**
- 漫画风格：少年热血(JUMP系)/少女浪漫/美式超英/日式写实/古风武侠/搞笑日常
- 语言气泡：经典对话泡/现代简洁气泡/手绘涂鸦风/无文字纯画面
- 分镜数量：4格/8格/16格/32格
- 色彩风格：全彩/黑白/淡彩上色

**流程：**
1. 生成漫画脚本（分镜描述、对话、氛围等）
2. 用户可编辑修改脚本
3. 点击「生成漫画」调用图像生成API
4. 显示生成的漫画图片

**图像生成API支持：**
- Stability AI (免费)
- OpenAI DALL-E
- 自定义 API

**新状态变量：**
- `comicScript` - 漫画脚本
- `comicPanels` - 分镜列表
- `comicImages` - 生成的图片
- `comicGenStatus` - 生成状态
- `image_gen` - 图像生成API配置

### 全能电气工程师模式 ⚡
新增「全能电气工程师」生成方向（40年经验）：

**参数选项：**
- 电路类型：数字电路/模拟电路/混合电路/单片机系统/电源设计/传感器接口/通信模块
- 复杂程度：入门级(<10元件)/初级(10-30元件)/中级(30-100元件)/高级(>100元件)
- 输出格式：详细原理图+接线图/简洁接线表/完整技术文档/全套BOM清单
- 电压等级：3.3V/5V/12V-24V/220V交流/多电压混合

**输出内容：**
- 产品概述与系统架构
- 完整BOM元件清单
- 电源系统设计
- ASCII接线原理图
- 详细引脚接线图
- 关键电路设计说明
- PCB布局建议
- 安全注意事项
- 调试方法

### 文件导入功能 📎
主界面输入框增加文件导入功能：

**支持格式：**
- 文本文件：txt, md, json, yaml, xml, csv, log
- 代码文件：js, ts, jsx, tsx, py, html, css, java, c, cpp, h, go, rs, rb, php, swift, kt
- 说明：PDF/Word文档会提示内容无法直接读取，建议转换格式

**交互：**
- 点击「📎 导入文件」按钮选择文件
- 支持多文件同时导入
- 已导入文件显示在输入框下方
- 可清除已导入的文件

## 文件结构
```
idea-forge/
├── idea-forge.jsx      # 主组件
├── vite.config.js      # Vite 配置
├── 想法实现工具.bat     # 一键启动脚本
├── src/
│   ├── main.jsx        # React 入口
│   ├── theme.js        # 设计系统
│   └── MD.jsx          # Markdown 渲染
├── package.json
└── MEMORY.md           # 项目记忆
```

## 模型配置默认值
```javascript
DEFAULT_MODELS = {
  "anthropic-claude": { model: "claude-sonnet-4-20250514" },
  "openai-gpt4": { model: "gpt-4-turbo" },
  "groq-llama": { model: "llama-3.3-70b-versatile" },
  "deepseek-chat": { model: "deepseek-chat" },
  "qwen-turbo": { model: "qwen-turbo" },
  "minimax": { model: "MiniMax-Text-01" },
  "siliconflow": { model: "Qwen/Qwen2.5-7B-Instruct" },
}
```

## localStorage Keys
- `ideaforge_active_model` - 当前选中的模型 ID
- `ideaforge_model_configs` - 所有模型的配置 JSON
