import { useState, useRef, useEffect } from "react";
import MD from "./src/MD";
import { Http } from "@capacitor-community/http";

// 环境检测 - 检查是否在 Capacitor 环境中
const isCapacitor = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNative;

// 获取模型 URL - 根据环境返回正确的 URL
const getModelUrl = (providerKey, directUrl, path) => {
  if (isCapacitor) {
    // Capacitor 环境使用直接 URL
    return directUrl + path;
  }
  // Web 开发环境使用代理
  return `/api/${providerKey}${path}`;
};

// 模型配置
const DEFAULT_MODELS = {
  "anthropic-claude": {
    name: "Claude (Anthropic)",
    getUrl: () => getModelUrl('anthropic', 'https://api.anthropic.com', '/v1/messages'),
    keyPlaceholder: "sk-ant-...",
    defaultModel: "claude-sonnet-4-20250514",
  },
  "openai-gpt4": {
    name: "GPT-4 (OpenAI)",
    getUrl: () => getModelUrl('openai', 'https://api.openai.com', '/v1/chat/completions'),
    keyPlaceholder: "sk-...",
    defaultModel: "gpt-4-turbo",
  },
  "groq-llama": {
    name: "Llama (Groq)",
    getUrl: () => getModelUrl('groq', 'https://api.groq.com', '/openai/v1/chat/completions'),
    keyPlaceholder: "gsk_...",
    defaultModel: "llama-3.3-70b-versatile",
  },
  "deepseek-chat": {
    name: "DeepSeek (DeepSeek)",
    getUrl: () => getModelUrl('deepseek', 'https://api.deepseek.com', '/chat/completions'),
    keyPlaceholder: "sk-...",
    defaultModel: "deepseek-chat",
  },
  "qwen-turbo": {
    name: "Qwen (DashScope)",
    getUrl: () => getModelUrl('dashscope', 'https://dashscope.aliyuncs.com', '/compatible-mode/v1/chat/completions'),
    keyPlaceholder: "sk-...",
    defaultModel: "qwen-turbo",
  },
  "minimax": {
    name: "MiniMax (海螺)",
    getUrl: () => getModelUrl('minimax', 'https://api.minimaxi.com', '/v1/text/chatcompletion_v2'),
    keyPlaceholder: "eyJh...",
    defaultModel: "M2-her",
  },
  "siliconflow": {
    name: "SiliconFlow (硅基流动)",
    getUrl: () => getModelUrl('siliconflow', 'https://api.siliconflow.cn', '/v1/chat/completions'),
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
    getUrl: () => "",
    keyPlaceholder: "API Key",
    defaultModel: "",
  },
};
const ASCII_WIRING_EXAMPLE = String.raw`
                    ┌─────────┐
    VIN ───────────┤    LDO   ├───┬── VDD (3.3V)
                    │  AMS1117 ├───┘
                    └─────────┘
                         │
                        GND
`;
const MODES = [
  { id:"vibe_spec", icon:"⚡", color:"#00E5FF", label:"Vibe Coding 规格", sublabel:"for Claude Code / Cursor", desc:"可直接投喂给 AI 编程助手的执行规格",
    clarifyQuestions:[{ key:"stack", q:"技术栈偏好？", opts:["Next.js + Supabase","FastAPI + React","Python CLI","纯前端","不限"] },{ key:"scope", q:"期望实现规模？", opts:["1天 MVP","1周完整版","长期产品"] },{ key:"agent", q:"主要使用哪个 AI 编程工具？", opts:["Claude Code","Cursor","Windsurf","通用"] }],
    systemPrompt:(ctx)=>`你是专为 AI 编程 Agent 编写规格文档的专家。`,
  },
  { id:"prd_full", icon:"▦", color:"#A78BFA", label:"PRD 文档", sublabel:"Product Requirements", desc:"专业级产品需求文档",
    clarifyQuestions:[{ key:"prd_type", q:"PRD 类型？", opts:["新功能","MVP 产品","概念验证 POC","系统重构"] },{ key:"audience", q:"主要读者？", opts:["AI 编程助手","工程师团队","投资人/决策层"] },{ key:"depth", q:"深度要求？", opts:["快速草稿","标准版","企业级详尽版"] }],
    systemPrompt:(ctx)=>`你是资深产品经理。`,
  },
  { id:"project", icon:"⬡", color:"#34D399", label:"完整项目", sublabel:"Project Blueprint", desc:"技术架构、目录结构、核心模块设计、数据流、分阶段开发路线图",
    clarifyQuestions:[{ key:"type", q:"项目类型？", opts:["Web App","CLI 工具","Telegram Bot","API 服务","桌面应用"] },{ key:"stack_pref", q:"技术偏好？", opts:["Python 后端","Node/Next.js","全栈一体","不限"] },{ key:"timeline", q:"时间线？", opts:["极速原型 2天","MVP 1-2周","完整产品 1月+"] }],
    systemPrompt:(ctx)=>`你是顶级系统架构师。`,
  },
  { id:"rfc", icon:"◈", color:"#FB923C", label:"RFC 分解", sublabel:"Request for Changes", desc:"将想法/PRD 拆解为可独立实现的 RFC 单元",
    clarifyQuestions:[{ key:"granularity", q:"任务粒度？", opts:["半天任务","1-2天任务","周级任务"] },{ key:"format", q:"输出格式？", opts:["RFC 文档","JIRA 风格","GitHub Issues 风格"] },{ key:"include_tests", q:"包含测试用例？", opts:["是，详细","是，简要","否"] }],
    systemPrompt:(ctx)=>`你是工程规划专家。`,
  },
  { id:"skill", icon:"◉", color:"#F472B6", label:"Skill 文件", sublabel:"Agent Skill Spec", desc:"生成可直接用于 Claude Code Agent 的完整 SKILL.md 文件",
    clarifyQuestions:[{ key:"complexity", q:"Skill 复杂度？", opts:["简单单步","多阶段工作流","带工具调用"] },{ key:"output_type", q:"主要输出？", opts:["文件/代码","分析报告","操作指令","混合输出"] },{ key:"error_handling", q:"错误处理？", opts:["基础","详细","含回滚策略"] }],
    systemPrompt:(ctx)=>`你是 Claude Code Agent Skills 专家。`,
  },
  { id:"prompt_suite", icon:"⟐", color:"#FBBF24", label:"提示词套件", sublabel:"Full Prompt Suite", desc:"完整五件套",
    clarifyQuestions:[{ key:"target_ai", q:"目标 AI 工具？", opts:["Claude Code","ChatGPT","Cursor","通用 LLM"] },{ key:"style", q:"指令风格？", opts:["强约束指令式","协作对话式","角色扮演式"] },{ key:"stories_count", q:"用户故事数量？", opts:["5-8条精华","10-15条完整","20条+详尽"] }],
    systemPrompt:(ctx)=>`你是顶级提示词工程师。`,
  },
  { id:"mvp", icon:"◎", color:"#EF4444", label:"MVP 规划", sublabel:"Lean Startup Plan", desc:"核心假设验证 → 最小功能集 → 2周冲刺 → 用户获取 → 决策树",
    clarifyQuestions:[{ key:"solo_team", q:"开发资源？", opts:["独立开发者","2-3人小团队","有预算外包"] },{ key:"has_users", q:"已有目标用户？", opts:["有，已联系","有想法未联系","完全从零"] },{ key:"monetize", q:"商业化目标？", opts:["验证付费意愿","先积累用户","内部工具"] }],
    systemPrompt:(ctx)=>`你是精益创业顾问。`,
  },
  { id:"marketing", icon:"◇", color:"#EC4899", label:"营销文案", sublabel:"Go-to-Market Copy", desc:"Landing Page + 社媒矩阵 + 冷启动邮件序列 + 产品 Pitch",
    clarifyQuestions:[{ key:"channel", q:"主要渠道？", opts:["开发者社区","国内社媒（小红书/即刻）","海外（Twitter/PH）","B2B 销售"] },{ key:"tone", q:"品牌调性？", opts:["极客技术范","简洁专业","活泼亲切","高端商务"] },{ key:"stage", q:"产品阶段？", opts:["预热期","内测期","公开发布"] }],
    systemPrompt:(ctx)=>`你是顶级科技产品文案策划师。`,
  },
  { id:"research", icon:"⬢", color:"#84CC16", label:"调研报告", sublabel:"Market Research", desc:"TAM/SAM/SOM 市场规模、竞争格局 4象限、用户洞察、进入策略",
    clarifyQuestions:[{ key:"focus", q:"调研重点？", opts:["市场机会验证","竞品深度分析","用户需求挖掘","商业模式探索"] },{ key:"geo", q:"目标市场？", opts:["中国市场","全球市场","东南亚","北美/欧洲"] },{ key:"output_for", q:"报告用途？", opts:["个人决策","团队对齐","投资人展示"] }],
    systemPrompt:(ctx)=>`你是市场研究分析师。`,
  },
  { id:"comic", icon:"🎨", color:"#FF6B9D", label:"漫画大师", sublabel:"Comic Creator", desc:"从业30年的资深漫画家",
    clarifyQuestions:[{ key:"comic_style", q:"漫画风格？", opts:["少年热血(JUMP系)","少女浪漫","美式超英","日式写实","古风武侠","搞笑日常"] },{ key:"bubble_style", q:"语言气泡？", opts:["经典对话泡","现代简洁气泡","手绘涂鸦风","无文字纯画面"] },{ key:"panel_count", q:"分镜数量？", opts:["4格短篇","8格短篇","16格中篇","32格长篇"] },{ key:"color_pref", q:"色彩风格？", opts:["全彩","黑白","淡彩上色"] }],
    systemPrompt:(ctx)=>`你是从业30年的顶级漫画大师。`,
  },
  { id:"electrical", icon:"⚡", color:"#FFD700", label:"全能电气工程师", sublabel:"Electrical Engineer", desc:"40年经验的全能电气工程师",
    clarifyQuestions:[{ key:"circuit_type", q:"电路类型？", opts:["数字电路","模拟电路","混合电路","单片机系统","电源设计","传感器接口","通信模块"] },{ key:"complexity", q:"复杂程度？", opts:["入门级（<10元件）","初级（10-30元件）","中级（30-100元件）","高级（>100元件）"] },{ key:"output_format", q:"输出格式？", opts:["详细原理图+接线图","简洁接线表","完整技术文档","全套BOM清单"] },{ key:"voltage_level", q:"电压等级？", opts:["3.3V低压电路","5V标准电路","12V/24V工业电","220V交流电","多电压混合"] }],
    systemPrompt:(ctx)=>`你是从业40年的顶级电气工程师。`,
  },
];

function hexToRgb(hex) { return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)].join(","); }

const CHAIN_MAP = {
  prd_full:[{id:"rfc",label:"RFC 分解"},{id:"vibe_spec",label:"Vibe 规格"}],
  project:[{id:"rfc",label:"RFC 分解"},{id:"mvp",label:"MVP 规划"}],
  mvp:[{id:"vibe_spec",label:"Coding 规格"},{id:"marketing",label:"营销文案"}],
  research:[{id:"prd_full",label:"PRD 文档"},{id:"mvp",label:"MVP 规划"}],
  rfc:[{id:"vibe_spec",label:"Vibe Coding 规格"}],
  comic:[], electrical:[],
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
  const [debugInfo, setDebugInfo] = useState("");
  const scrollRef = useRef(null);
  const mode = MODES.find(m => m.id === selectedId);
  const savedAnswersRef = useRef({});

  const [activeModel, setActiveModel] = useState(() => localStorage.getItem("ideaforge_active_model") || "anthropic-claude");
  const [modelConfigs, setModelConfigs] = useState(() => { const saved = localStorage.getItem("ideaforge_model_configs"); return saved ? JSON.parse(saved) : {}; });
  const [showSettings, setShowSettings] = useState(false);
  const [showKeyIds, setShowKeyIds] = useState({});
  const [editMode, setEditMode] = useState(false);

  const [comicScript, setComicScript] = useState("");
  const [comicPanels, setComicPanels] = useState([]);
  const [comicImages, setComicImages] = useState([]);
  const [comicGenStatus, setComicGenStatus] = useState("idle");
  const [comicGenError, setComicGenError] = useState("");
  const [currentGeneratingPanel, setCurrentGeneratingPanel] = useState(0);

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
        if (ext === "txt" || ext === "md" || ext === "json" || ext === "yaml" || ext === "yml" || ext === "xml" || ext === "csv" || ext === "log") { content = await file.text(); }
        else if (ext === "js" || ext === "ts" || ext === "jsx" || ext === "tsx" || ext === "py" || ext === "html" || ext === "css" || ext === "java" || ext === "c" || ext === "cpp" || ext === "h" || ext === "go" || ext === "rs" || ext === "rb" || ext === "php" || ext === "swift" || ext === "kt") { content = await file.text(); }
        else if (ext === "pdf") { content = `[PDF文件: ${file.name}]\n此文件为PDF格式，建议将内容复制为txt后导入`; }
        else if (ext === "doc" || ext === "docx") { content = `[Word文档: ${file.name}]\n此文件为Word格式，建议导出为txt后导入`; }
        else if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "gif" || ext === "bmp" || ext === "webp") { content = `[图片文件: ${file.name}]\n图片内容无法直接读取`; }
        else { try { content = await file.text(); } catch { content = `[不支持的文件: ${file.name}]`; } }
        newFiles.push({ name: file.name, ext, content, size: file.size });
        allContent += `\n\n=== 文件: ${file.name} ===\n${content}`;
      } catch (err) { newFiles.push({ name: file.name, ext: file.name.split(".").pop(), content: "", error: true }); }
    }
    setIdea(idea ? `${idea}\n\n${allContent}` : allContent);
    setImportedFiles(prev => [...prev, ...newFiles]);
    setIsImporting(false);
    e.target.value = "";
  };

  const clearImportedFiles = () => setImportedFiles([]);
  const toggleShowKey = (modelId) => setShowKeyIds(prev => ({ ...prev, [modelId]: !prev[modelId] }));
  const updateModelConfig = (modelId, field, value) => {
    const newConfigs = { ...modelConfigs, [modelId]: { ...(modelConfigs[modelId] || {}), [field]: value } };
    localStorage.setItem("ideaforge_model_configs", JSON.stringify(newConfigs));
    setModelConfigs(newConfigs);
  };
  const openSettings = () => setShowSettings(true);

  const exportTemplates = () => {
    const data = { version: "1.0", exportDate: new Date().toISOString(), modes: MODES.map(m => ({ id: m.id, icon: m.icon, label: m.label, sublabel: m.sublabel, desc: m.desc, clarifyQuestions: m.clarifyQuestions, systemPromptTemplate: m.systemPrompt.toString() })) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `idea-forge-templates-${Date.now()}.json` }); a.click();
  };

  const importTemplates = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result);
        if (data.modes && Array.isArray(data.modes)) { alert(`将导入 ${data.modes.length} 个模板（当前版本仅记录信息，实际模板需手动更新代码）`); }
        else { alert("无效的模板文件格式"); }
      } catch { alert("读取文件失败"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const parseComicPanels = (script) => {
    const panels = [];
    const regex = /【镜头(\d+)】([^\n]+)\n([\s\S]*?)(?=【镜头|\n\n## |$)/g;
    let match;
    while ((match = regex.exec(script)) !== null) { panels.push({ number: match[1], type: match[2].trim(), description: match[3].trim() }); }
    return panels;
  };

  const generateComicImages = async () => {
    const imgApiConfig = modelConfigs["image_gen"] || {};
    const apiKey = imgApiConfig?.key;
    const provider = imgApiConfig?.provider || "stabilityai";
    if (!apiKey) { alert("请先在设置中配置图像生成 API Key"); setShowSettings(true); return; }
    const panels = parseComicPanels(comicScript);
    if (panels.length === 0) { alert("未能解析出分镜信息"); return; }
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
      const prompt = `Comic panel ${panel.number}: ${panel.type}. ${panel.description}. Style: ${style}. Color: ${color}.`;
      try {
        let imageUrl = "";
        if (provider === "stabilityai") {
          const resp = await fetch("https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` }, body: JSON.stringify({ text_prompts: [{ text: prompt }], cfg_scale: 7, height: 1024, width: 1024, steps: 30 }) });
          const data = await resp.json();
          if (data.artifacts && data.artifacts[0]) imageUrl = `data:image/png;base64,${data.artifacts[0].base64}`;
        } else if (provider === "openai") {
          const resp = await fetch("https://api.openai.com/v1/images/generations", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` }, body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size: "1024x1024" }) });
          const data = await resp.json();
          if (data.data && data.data[0]) imageUrl = data.data[0].url;
        } else {
          const customUrl = imgApiConfig?.url;
          if (!customUrl) throw new Error("未配置自定义 API");
          const resp = await fetch(customUrl, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` }, body: JSON.stringify({ prompt }) });
          const data = await resp.json();
          imageUrl = data.url || data.image_url || data.output || "";
        }
        if (imageUrl) generatedImages.push({ url: imageUrl, panelNumber: panel.number });
      } catch (e) { console.error(`生成第 ${i + 1} 张图片失败:`, e); }
    }
    setComicImages(generatedImages);
    setPhase("comic_output");
  };

  const downloadComicImages = () => { comicImages.forEach((img, idx) => { const a = document.createElement("a"); a.href = img.url; a.download = `comic-panel-${idx + 1}.png`; a.click(); }); };
  const getActiveModelKey = () => modelConfigs[activeModel]?.key || "";
  const getActiveModelConfig = () => {
    const cfg = modelConfigs[activeModel] || {};
    const defaultModel = DEFAULT_MODELS[activeModel];
    return {
      url: cfg.url || (defaultModel?.getUrl ? defaultModel.getUrl() : ""),
      model: cfg.model || defaultModel?.defaultModel || "",
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
    setDebugInfo("正在初始化...");
    savedAnswersRef.current = ans;

    const isAnthropic = activeModel === "anthropic-claude";

    const headers = {
      "Content-Type": "application/json",
      ...(isAnthropic ? { "x-api-key": apiKey, "anthropic-version": "2023-06-01" } : { "Authorization": `Bearer ${apiKey}` }),
    };

    const body = isAnthropic
      ? { model: modelCfg.model || "claude-sonnet-4-20250514", max_tokens: 4096, stream: false,
          system: m.systemPrompt(ans), messages: [{ role: "user", content: `想法：${ideaText}` }] }
      : { model: modelCfg.model, max_tokens: 4096, stream: false,
          messages: [{ role: "user", content: `你是一个专业的需求分析师。请严格按照以下规格生成文档。\n\n规格类型：${m.label}\n\n${m.systemPrompt(ans)}\n\n---\n用户想法：${ideaText}` }] };

    try {
      setGenStatus("connecting");
      const dbg = `【调试信息】\n请求URL: ${modelCfg.url}\n模型: ${DEFAULT_MODELS[activeModel]?.name}\nAPI Key: ${apiKey ? '已配置 ✓' : '未配置 ✗'}\nCapacitor: ${isCapacitor ? '是 ✓' : '否 (使用代理)'}`;
      setDebugInfo(dbg);

      const resp = await Http.request({
        url: modelCfg.url,
        method: "POST",
        headers,
        data: body,
      });

      if (resp.status < 200 || resp.status >= 300) {
        throw new Error(`HTTP ${resp.status}: ${JSON.stringify(resp.data).slice(0, 200)}`);
      }

      setGenStatus("done");
      let full = "";

      // Anthropic 格式
      if (isAnthropic && resp.data?.content?.[0]?.text) {
        full = resp.data.content[0].text;
      }
      // OpenAI/Groq/DeepSeek 格式
      else if (resp.data?.choices?.[0]?.message?.content) {
        full = resp.data.choices[0].message.content;
      } else {
        throw new Error("无法解析响应格式: " + JSON.stringify(resp.data).slice(0, 200));
      }

      setFinal(full);
      setStream(full);
      setSectCount((full.match(/^#{1,2} /gm) || []).length);
      setPhase("output");
      setDebugInfo(dbg + `\n\n✓ 生成完成！`);
      setHistory(prev => [{id:Date.now(),modeId,idea:ideaText.slice(0,60),text:full,answers:{...ans},time:new Date().toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"})},...prev.slice(0,9)]);
    } catch (e) {
      setGenStatus("error");
      setGenError(e.message || "生成失败，请检查网络和 API 配置");
      setPhase("clarify");
      setDebugInfo(prev => prev + `\n\n❌ 错误: ${e.message}`);
    }
  };

  const retryGenerate = () => { if (idea && selectedId) generate(idea, selectedId, savedAnswersRef.current); };
  const copyText = () => { navigator.clipboard.writeText(final||stream); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const download = () => { const a = Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([final||stream],{type:"text/markdown"})),download:`idea-forge-${selectedId}.md`}); a.click(); };
  const chain = (targetId) => { setIdea(`基于以下内容继续：\n\n${(final||stream).slice(0,2000)}`); setSelectedId(targetId); setAnswers({}); setPhase("clarify"); setFinal(""); setStream(""); };
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
            {phase!=="input"&&<button onClick={()=>{setPhase("input");setStream("");setFinal("");setDebugInfo("");}} style={{background:"transparent",border:"1px solid #B0D4E8",color:"#004488",padding:"0.22rem 0.55rem",borderRadius:4,cursor:"pointer",fontSize:"0.7rem"}}>← 重开</button>}
          </div>
        </div>

        {showHist&&history.length>0&&(
          <div style={{marginBottom:"1.3rem",background:"#FFFFFF",border:"1px solid #B0D4E8",borderRadius:9,padding:"0.8rem"}}>
            <div style={{fontSize:"0.65rem",color:"#004488",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.55rem"}}>历史记录</div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.3rem"}}>
              {history.map((h) => { const hm = MODES.find(m => m.id === h.modeId); return (<button key={h.id} onClick={() => { setIdea(h.idea); setSelectedId(h.modeId); setAnswers(h.answers); setFinal(h.text); setStream(h.text); setPhase("output"); setShowHist(false); }} style={{background:"#F0F8FF",border:"1px solid #B0D4E8",borderRadius:6,padding:"0.45rem 0.65rem",cursor:"pointer",textAlign:"left"}} onMouseEnter={e => e.currentTarget.style.borderColor = "#87CEEB"} onMouseLeave={e => e.currentTarget.style.borderColor = "#B0D4E8"}><div style={{display:"flex",alignItems:"center",gap:"0.3rem",marginBottom:"0.15rem"}}><span style={{color:hm?.color,fontSize:"0.78rem"}}>{hm?.icon}</span><span style={{fontSize:"0.7rem",color:"#004488"}}>{hm?.label}</span><span style={{marginLeft:"auto",fontSize:"0.62rem",color:"#88AACC"}}>{h.time}</span></div><div style={{fontSize:"0.7rem",color:"#336699",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.idea}</div></button>); })}
            </div>
          </div>
        )}

        {phase==="input"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"1.2rem"}}>
            <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:"0.6rem"}}>
              <div style={{fontSize:"0.65rem",color:"#004488",letterSpacing:"0.08em",textTransform:"uppercase"}}>选择模型</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"0.3rem",flex:1}}>
                {Object.entries(DEFAULT_MODELS).map(([key, m]) => { const hasKey = modelConfigs[key]?.key; const isActive = activeModel === key; return <button key={key} onClick={() => { setActiveModel(key); localStorage.setItem("ideaforge_active_model", key); }} style={{padding:"0.2rem 0.5rem",borderRadius:20,fontSize:"0.68rem",cursor:"pointer",border:`1px solid ${isActive ? "#004488" : "#B0D4E8"}`,background: isActive ? "#004488" : (hasKey ? "#E8F4FC" : "#FFFFFF"),color: isActive ? "#FFFFFF" : (hasKey ? "#004488" : "#88AACC"),transition:"all 0.13s"}}>{hasKey ? "✓ " : ""}{m.name}</button>; })}
              </div>
              <button onClick={() => openSettings(activeModel)} style={{background:"transparent",border:"1px solid #B0D4E8",color:"#004488",padding:"0.15rem 0.4rem",borderRadius:4,cursor:"pointer",fontSize:"0.6rem"}}>⚙ 设置</button>
              <label style={{background:"#E8F4FC",border:"1px solid #B0D4E8",color:"#004488",padding:"0.2rem 0.5rem",borderRadius:4,cursor:"pointer",fontSize:"0.68rem",display:"flex",alignItems:"center",gap:"0.2rem"}}>{isImporting ? "导入中..." : "📎 导入文件"}<input type="file" multiple accept=".txt,.md,.json,.yaml,.yml,.xml,.csv,.js,.ts,.jsx,.tsx,.py,.html,.css,.java,.c,.cpp,.h,.go,.rs,.rb,.php,.swift,.kt,.pdf,.doc,.docx,.log" onChange={handleFileImport} style={{display:"none"}} /></label>
            </div>
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.4rem"}}><div style={{fontSize:"0.65rem",color:"#004488",letterSpacing:"0.08em",textTransform:"uppercase"}}>你的想法</div>{importedFiles.length > 0 && (<div style={{display:"flex",alignItems:"center",gap:"0.3rem",fontSize:"0.65rem",color:"#34A834"}}><span>✓</span><span>已导入 {importedFiles.length} 个文件</span><button onClick={clearImportedFiles} style={{background:"transparent",border:"none",color:"#CC4444",cursor:"pointer",fontSize:"0.65rem",padding:"0"}}>清除</button></div>)}</div>
              <textarea value={idea} onChange={e=>setIdea(e.target.value)} placeholder={"粗略描述即可，细节下一步填写...\n\n支持导入文件作为补充"} style={{width:"100%",minHeight:180,background:"#FFFFFF",border:`1px solid ${idea?"#87CEEB":"#B0D4E8"}`,borderRadius:8,padding:"0.8rem 0.9rem",color:"#000000",fontSize:"0.86rem",lineHeight:1.7,resize:"vertical",outline:"none",boxSizing:"border-box",fontFamily:"inherit",transition:"border-color 0.2s"}} onFocus={e=>e.target.style.borderColor="#004488"} onBlur={e=>e.target.style.borderColor=idea?"#87CEEB":"#B0D4E8"} />
              {importedFiles.length > 0 && (<div style={{marginTop:"0.5rem",display:"flex",flexWrap:"wrap",gap:"0.3rem"}}>{importedFiles.map((f, idx) => (<span key={idx} style={{background:"#F0F8FF",border:"1px solid #B0D4E8",borderRadius:4,padding:"0.15rem 0.4rem",fontSize:"0.65rem",color:"#336699"}}>{f.error ? "❌" : "📄"} {f.name}</span>))}</div>)}
            </div>
            <div>
              <div style={{fontSize:"0.65rem",color:"#004488",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.6rem"}}>生成方向</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:"0.45rem"}}>
                {MODES.map(m=>{ const active=selectedId===m.id; return <button key={m.id} onClick={()=>setSelectedId(m.id)} style={{background:active?`rgba(${r(m.color)},0.12)`:"#FFFFFF",border:`1px solid ${active?m.color+"60":"#B0D4E8"}`,borderRadius:8,padding:"0.7rem 0.8rem",cursor:"pointer",textAlign:"left",transition:"all 0.13s",boxShadow:active?`0 0 12px rgba(${r(m.color)},0.15)`:"none"}} onMouseEnter={e=>{if(!active)e.currentTarget.style.borderColor="#87CEEB";}} onMouseLeave={e=>{if(!active)e.currentTarget.style.borderColor="#B0D4E8";}}><div style={{display:"flex",alignItems:"center",gap:"0.3rem",marginBottom:"0.2rem"}}><span style={{color:m.color,fontSize:"0.88rem"}}>{m.icon}</span><span style={{fontSize:"0.77rem",fontWeight:600,color:active?m.color:"#004488"}}>{m.label}</span></div><div style={{fontSize:"0.6rem",color:"#6699BB",marginBottom:"0.25rem"}}>{m.sublabel}</div><div style={{fontSize:"0.68rem",color:"#336699",lineHeight:1.45}}>{m.desc}</div></button>; })}
              </div>
            </div>
            <button onClick={()=>{if(idea.trim()&&selectedId){setAnswers({});setPhase("clarify");}}} disabled={!idea.trim()||!selectedId} style={{background:(idea&&selectedId)?`linear-gradient(135deg,rgba(${r(mode?.color||"#004488")},0.85),rgba(${r(mode?.color||"#004488")},0.5))`:"#E8F4FC",border:"1px solid #B0D4E8",borderRadius:8,padding:"0.78rem",color:(idea&&selectedId)?"#FFFFFF":"#88AACC",fontSize:"0.86rem",fontWeight:600,cursor:(idea&&selectedId)?"pointer":"default",transition:"all 0.2s",boxShadow:(idea&&selectedId)?`0 4px 18px rgba(${r(mode?.color||"#004488")},0.25)`:"none"}}>{idea&&selectedId?`精调参数 →`:"请输入想法并选择方向"}</button>
          </div>
        )}

        {phase==="clarify"&&mode&&(
          <div style={{display:"flex",flexDirection:"column",gap:"1.2rem"}}>
            <div style={{background:"#FFFFFF",border:"1px solid #B0D4E8",borderRadius:8,padding:"0.7rem 0.85rem",display:"flex",alignItems:"flex-start",gap:"0.5rem"}}><span style={{color:mode.color,fontSize:"0.9rem",marginTop:"0.04rem"}}>{mode.icon}</span><div><div style={{fontSize:"0.7rem",color:mode.color,marginBottom:"0.15rem"}}>{mode.label}</div><div style={{fontSize:"0.77rem",color:"#336699",lineHeight:1.5}}>{idea.slice(0,100)}{idea.length>100?"...":""}</div></div></div>
            <div><div style={{fontSize:"0.65rem",color:"#004488",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.7rem"}}>精调参数</div><div style={{display:"flex",flexDirection:"column",gap:"0.9rem"}}>{mode.clarifyQuestions.map(q=>(<div key={q.key}><div style={{fontSize:"0.73rem",color:"#336699",marginBottom:"0.38rem"}}>{q.q}</div><div style={{display:"flex",flexWrap:"wrap",gap:"0.3rem"}}>{q.opts.map(opt=>{ const active=answers[q.key]===opt; return <button key={opt} onClick={()=>setAnswers(p=>({...p,[q.key]:opt}))} style={{padding:"0.25rem 0.6rem",borderRadius:20,fontSize:"0.73rem",cursor:"pointer",border:`1px solid ${active?mode.color+"55":"#B0D4E8"}`,background:active?`rgba(${r(mode.color)},0.12)`:"#FFFFFF",color:active?mode.color:"#336699",transition:"all 0.13s",boxShadow:active?`0 0 6px rgba(${r(mode.color)},0.2)`:"none"}}>{opt}</button>; })}</div></div>))}</div></div>
            <div style={{display:"flex",gap:"0.45rem"}}><button onClick={()=>setPhase("input")} style={{flex:1,background:"transparent",border:"1px solid #B0D4E8",color:"#004488",padding:"0.65rem",borderRadius:7,cursor:"pointer",fontSize:"0.8rem"}}>← 返回</button><button onClick={()=>generate(idea,selectedId,answers)} style={{flex:3,background:`linear-gradient(135deg,rgba(${r(mode.color)},0.85),rgba(${r(mode.color)},0.5))`,border:"none",borderRadius:7,padding:"0.65rem",color:"#FFFFFF",fontSize:"0.86rem",fontWeight:600,cursor:"pointer",boxShadow:`0 4px 16px rgba(${r(mode.color)},0.3)`}}>生成 {mode.label} ⚡</button></div>
          </div>
        )}

        {phase==="generating"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"0.9rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.6rem",padding:"0.4rem 0 "}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:mode?.color||"#004488",boxShadow:`0 0 7px ${mode?.color||"#004488"}`,animation:"pulse 1.5s infinite"}} />
              <span style={{fontSize:"0.76rem",color:mode?.color||"#004488"}}>正在生成 {mode?.label || ''}...</span>
              <span style={{fontSize:"0.7rem",color:"#6699BB",marginLeft:"auto"}}>已解析 {sectCount} 段</span>
            </div>
            <div ref={scrollRef} style={{background:"#FFFFFF",border:"1px solid #B0D4E8",borderRadius:10,padding:"1rem 1.2rem",minHeight:260,maxHeight:480,overflowY:"auto",scrollbarWidth:"thin",scrollbarColor:"#B0D4E8 transparent"}}>
              <MD src={stream} /><span style={{display:"inline-block",width:5,height:11,background:mode?.color||"#004488",borderRadius:1,marginLeft:2,animation:"blink 1s infinite"}} />
            </div>
            {/* 调试信息面板（始终显示） */}
            <div style={{background:"#1a1a2e",border:"1px solid #444",borderRadius:8,padding:"0.7rem",fontSize:"0.7rem",fontFamily:"'Courier New',monospace"}}>
              <div style={{color:"#888",marginBottom:"0.3rem"}}>🔧 调试信息</div>
              <pre style={{margin:0,whiteSpace:"pre-wrap",wordBreak:"break-all",color:"#0f0"}}>{debugInfo || '正在初始化...'}</pre>
            </div>
            {genStatus === "error" && (
              <div style={{background:"#FFF5F5",border:"1px solid #FFCCCC",borderRadius:8,padding:"0.8rem",color:"#CC4444",fontSize:"0.8rem"}}><strong>❌ 生成失败：</strong><br/>{genError}</div>
            )}
          </div>
        )}

        {phase==="output"&&mode&&(
          <div style={{display:"flex",flexDirection:"column",gap:"0.8rem"}}>
            <div style={{background:"#F0F8FF",border:"1px solid #B0D4E8",borderRadius:8,padding:"0.6rem 0.8rem",fontSize:"0.72rem",color:"#336699"}}><strong>当前参数：</strong>{Object.entries(history[0]?.answers || {}).map(([k, v]) => ` ${k}: ${v}`).join(" | ")}</div>
            <div style={{display:"flex",alignItems:"center",gap:"0.4rem",flexWrap:"wrap"}}><span style={{color:mode.color}}>{mode.icon}</span><span style={{fontSize:"0.78rem",color:mode.color,fontWeight:600}}>{mode.label}</span><span style={{color:"#B0D4E8"}}>·</span><span style={{fontSize:"0.7rem",color:"#336699",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{idea.slice(0,55)}</span><div style={{display:"flex",gap:"0.3rem"}}><button onClick={() => setEditMode(!editMode)} style={{background:editMode?"rgba(0,68,136,0.1)":"transparent",border:`1px solid ${editMode?"#004488":"#B0D4E8"}`,color:"#004488",padding:"0.22rem 0.55rem",borderRadius:4,cursor:"pointer",fontSize:"0.7rem"}}>{editMode?"📄 预览":"✏️ 编辑"}</button><button onClick={copyText} style={{background:copied?"rgba(52,211,153,0.1)":"transparent",border:`1px solid ${copied?"#34D39960":"#B0D4E8"}`,color:copied?"#34D399":"#004488",padding:"0.22rem 0.55rem",borderRadius:4,cursor:"pointer",fontSize:"0.7rem"}}>{copied?"✓ 已复制":"复制"}</button><button onClick={download} style={{background:"transparent",border:"1px solid #B0D4E8",color:"#004488",padding:"0.22rem 0.55rem",borderRadius:4,cursor:"pointer",fontSize:"0.7rem"}}>↓ .md</button></div></div>
            {editMode ? (<textarea value={final || stream} onChange={(e) => setFinal(e.target.value)} style={{background:"#FFFFFF",border:"1px solid #B0D4E8",borderRadius:10,padding:"1rem 1.2rem",minHeight:400,maxHeight:500,overflowY:"auto",scrollbarWidth:"thin",scrollbarColor:"#B0D4E8 transparent",width:"100%",boxSizing:"border-box",fontFamily:"'JetBrains Mono',monospace",fontSize:"0.8rem",lineHeight:1.6,color:"#003366",resize:"vertical"}} />) : (<div ref={scrollRef} style={{background:"#FFFFFF",border:"1px solid #B0D4E8",borderRadius:10,padding:"1rem 1.2rem",maxHeight:500,overflowY:"auto",scrollbarWidth:"thin",scrollbarColor:"#B0D4E8 transparent"}}><MD src={final||stream} /></div>)}
            {CHAIN_MAP[selectedId]&&(<div><div style={{fontSize:"0.62rem",color:"#6699BB",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:"0.38rem"}}>链式生成</div><div style={{display:"flex",gap:"0.3rem",flexWrap:"wrap"}}>{CHAIN_MAP[selectedId].map(ch=>{ const cm=MODES.find(m=>m.id===ch.id); return <button key={ch.id} onClick={()=>chain(ch.id)} style={{background:"#FFFFFF",border:`1px solid ${cm?.color||"#888"}30`,color:cm?.color||"#888",padding:"0.25rem 0.6rem",borderRadius:4,cursor:"pointer",fontSize:"0.71rem"}}>{cm?.icon} → {ch.label}</button>; })}</div></div>)}
            <div style={{display:"flex",gap:"0.35rem"}}><button onClick={()=>{setPhase("input");setSelectedId(null);setIdea("");setDebugInfo("");}} style={{background:"transparent",border:"1px solid #B0D4E8",color:"#004488",padding:"0.27rem 0.7rem",borderRadius:4,cursor:"pointer",fontSize:"0.73rem"}}>新想法</button><button onClick={retryGenerate} style={{background:"transparent",border:"1px solid #87CEEB",color:"#004488",padding:"0.27rem 0.7rem",borderRadius:4,cursor:"pointer",fontSize:"0.73rem"}}>🔄 重试</button><button onClick={()=>setPhase("clarify")} style={{background:"transparent",border:"1px solid #B0D4E8",color:"#004488",padding:"0.27rem 0.7rem",borderRadius:4,cursor:"pointer",fontSize:"0.73rem"}}>修改参数</button>{selectedId === "comic" && (<button onClick={() => { setComicScript(final || stream); setPhase("comic_script"); }} style={{background:"linear-gradient(135deg,#FF6B9D,#FF3366)",border:"none",color:"#FFFFFF",padding:"0.27rem 0.7rem",borderRadius:4,cursor:"pointer",fontSize:"0.73rem",fontWeight:600}}>🎨 生成漫画</button>)}</div>
          </div>
        )}

        {phase === "comic_script" && (
          <div style={{display:"flex",flexDirection:"column",gap:"0.8rem"}}>
            <div style={{background:"linear-gradient(135deg,#FFF0F5,#FFE4EC)",border:"1px solid #FFB6C1",borderRadius:8,padding:"0.8rem"}}><span style={{fontSize:"1.2rem"}}>🎨</span><div><div style={{fontSize:"0.85rem",color:"#CC3366",fontWeight:600}}>漫画脚本确认</div><div style={{fontSize:"0.7rem",color:"#AA6688"}}>请检查并编辑脚本，确认后再生成</div></div></div>
            <textarea value={comicScript} onChange={(e) => setComicScript(e.target.value)} style={{background:"#FFFFFF",border:"1px solid #FFB6C1",borderRadius:10,padding:"1rem",minHeight:400,maxHeight:600,overflowY:"auto",width:"100%",boxSizing:"border-box",fontSize:"0.8rem",lineHeight:1.7,resize:"vertical"}} />
            <div style={{display:"flex",gap:"0.45rem"}}><button onClick={() => setPhase("output")} style={{flex:1,background:"transparent",border:"1px solid #B0D4E8",color:"#6699BB",padding:"0.65rem",borderRadius:7,cursor:"pointer",fontSize:"0.8rem"}}>← 返回</button><button onClick={() => generateComicImages()} style={{flex:2,background:"linear-gradient(135deg,#FF6B9D,#FF3366)",border:"none",borderRadius:7,padding:"0.65rem",color:"#FFFFFF",fontSize:"0.86rem",fontWeight:600}}>⚡ 生成漫画图片</button></div>
          </div>
        )}
        {phase === "comic_generating" && (<div style={{display:"flex",flexDirection:"column",gap:"1rem",alignItems:"center",padding:"2rem 1rem"}}><div style={{fontSize:"3rem",animation:"pulse 1.5s infinite"}}>🎨</div><div style={{fontSize:"1rem",color:"#CC3366",fontWeight:600}}>正在生成漫画图片...</div><div style={{fontSize:"0.85rem",color:"#AA6688"}}>第 {currentGeneratingPanel + 1} / {comicPanels.length || "?"} 张</div></div>)}
        {phase === "comic_output" && comicImages.length > 0 && (
          <div style={{display:"flex",flexDirection:"column",gap:"0.8rem"}}>
            <div style={{background:"linear-gradient(135deg,#FFF0F5,#FFE4EC)",border:"1px solid #FFB6C1",borderRadius:8,padding:"0.8rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}><div><div style={{fontSize:"0.85rem",color:"#CC3366",fontWeight:600}}>漫画生成完成</div><div style={{fontSize:"0.7rem",color:"#AA6688"}}>共 {comicImages.length} 张</div></div><button onClick={() => { setComicImages([]); setPhase("comic_script"); }} style={{background:"transparent",border:"1px solid #FFB6C1",color:"#CC3366",padding:"0.3rem 0.6rem",borderRadius:4,cursor:"pointer",fontSize:"0.72rem"}}>重新生成</button></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:"1rem"}}>{comicImages.map((img, idx) => (<div key={idx} style={{background:"#FFFFFF",border:"1px solid #FFB6C1",borderRadius:10,overflow:"hidden"}}><img src={img.url} alt={`漫画 ${idx + 1}`} style={{width:"100%",display:"block"}} /><div style={{padding:"0.5rem",fontSize:"0.7rem",color:"#AA6688",background:"#FFF9FB"}}>第 {idx + 1} 张</div></div>))}</div>
            <div style={{display:"flex",gap:"0.35rem"}}><button onClick={() => { setComicImages([]); setPhase("comic_script"); }} style={{background:"transparent",border:"1px solid #B0D4E8",color:"#6699BB",padding:"0.5rem 1rem",borderRadius:4,cursor:"pointer",fontSize:"0.8rem"}}>修改脚本</button><button onClick={downloadComicImages} style={{background:"#FF6B9D",border:"none",color:"#FFFFFF",padding:"0.5rem 1rem",borderRadius:4,cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>📥 下载全部</button></div>
          </div>
        )}
      </div>

      {showSettings && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,overflowY:"auto",padding:"1rem"}} onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}>
          <div style={{background:"#FFFFFF",border:"1px solid #B0D4E8",borderRadius:12,padding:"1.5rem",width:480,maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem"}}><h3 style={{margin:0,fontSize:"1rem",color:"#003366"}}>⚙ 模型配置</h3><button onClick={() => setShowSettings(false)} style={{background:"transparent",border:"none",fontSize:"1.5rem",cursor:"pointer",color:"#88AACC"}}>×</button></div>
            <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
              {Object.entries(DEFAULT_MODELS).filter(([key]) => key !== "custom").map(([key, model]) => (
                <div key={key} style={{background:"#F8FBFF",border:"1px solid #B0D4E8",borderRadius:8,padding:"0.8rem"}}>
                  <div style={{fontSize:"0.85rem",color:"#004488",marginBottom:"0.5rem",fontWeight:600}}>{model.name}</div>
                  <div style={{marginBottom:"0.5rem"}}><div style={{fontSize:"0.68rem",color:"#6699BB",marginBottom:"0.2rem"}}>API Key</div><div style={{display:"flex",gap:"0.3rem"}}><input type={showKeyIds[key] ? "text" : "password"} value={modelConfigs[key]?.key || ""} onChange={(e) => updateModelConfig(key, "key", e.target.value)} placeholder={model.keyPlaceholder || "输入 API Key"} style={{flex:1,padding:"0.4rem 0.5rem",border:"1px solid #B0D4E8",borderRadius:4,fontSize:"0.78rem",background:"#FFFFFF",color:"#000",boxSizing:"border-box"}} /><button onClick={() => toggleShowKey(key)} style={{padding:"0.3rem 0.5rem",border:"1px solid #B0D4E8",borderRadius:4,background:"#FFFFFF",cursor:"pointer",fontSize:"0.7rem",color:"#004488"}}>{showKeyIds[key] ? "🔒" : "👁"}</button></div></div>
                  <div style={{marginBottom:"0.5rem"}}><div style={{fontSize:"0.68rem",color:"#6699BB",marginBottom:"0.2rem"}}>API 地址 <span style={{fontSize:"0.6rem",color:"#88AACC"}}>（选填，使用默认则留空）</span></div><input type="text" value={modelConfigs[key]?.url || (model.getUrl ? model.getUrl() : "") || ""} onChange={(e) => updateModelConfig(key, "url", e.target.value)} placeholder={model.getUrl ? model.getUrl() : ""} style={{width:"100%",padding:"0.4rem 0.5rem",border:"1px solid #B0D4E8",borderRadius:4,fontSize:"0.78rem",background:"#FFFFFF",color:"#000",boxSizing:"border-box"}} /></div>
                  {model.models ? (<div><div style={{fontSize:"0.68rem",color:"#6699BB",marginBottom:"0.2rem"}}>选择模型</div><select value={modelConfigs[key]?.model || model.defaultModel || ""} onChange={(e) => updateModelConfig(key, "model", e.target.value)} style={{width:"100%",padding:"0.4rem 0.5rem",border:"1px solid #B0D4E8",borderRadius:4,fontSize:"0.78rem",background:"#FFFFFF",color:"#000",boxSizing:"border-box"}}>{model.models.map(m => <option key={m} value={m}>{m}</option>)}</select></div>) : (<div><div style={{fontSize:"0.68rem",color:"#6699BB",marginBottom:"0.2rem"}}>模型</div><input type="text" value={modelConfigs[key]?.model || model.defaultModel || ""} onChange={(e) => updateModelConfig(key, "model", e.target.value)} placeholder={model.defaultModel || "如: gpt-4-turbo"} style={{width:"100%",padding:"0.4rem 0.5rem",border:"1px solid #B0D4E8",borderRadius:4,fontSize:"0.78rem",background:"#FFFFFF",color:"#000",boxSizing:"border-box"}} /></div>)}
                </div>
              ))}
            </div>
            <div style={{marginTop:"1.2rem",paddingTop:"1rem",borderTop:"1px solid #B0D4E8"}}><div style={{fontSize:"0.75rem",color:"#004488",marginBottom:"0.5rem",fontWeight:600}}>模板管理</div><div style={{display:"flex",gap:"0.5rem"}}><button onClick={exportTemplates} style={{padding:"0.35rem 0.7rem",border:"1px solid #B0D4E8",borderRadius:4,background:"#FFFFFF",color:"#004488",cursor:"pointer",fontSize:"0.72rem"}}>📤 导出模板</button><label style={{padding:"0.35rem 0.7rem",border:"1px solid #B0D4E8",borderRadius:4,background:"#FFFFFF",color:"#004488",cursor:"pointer",fontSize:"0.72rem"}}>📥 导入模板<input type="file" accept=".json" onChange={importTemplates} style={{display:"none"}} /></label></div></div>
            <div style={{marginTop:"0.8rem",padding:"0.7rem",background:"#FFF0F5",border:"1px solid #FFB6C1",borderRadius:6}}><div style={{fontSize:"0.75rem",color:"#CC3366",marginBottom:"0.5rem",fontWeight:600}}>图像生成 API（漫画模式专用）</div><div style={{marginBottom:"0.5rem"}}><div style={{fontSize:"0.68rem",color:"#6699BB",marginBottom:"0.2rem"}}>API 提供商</div><select value={modelConfigs["image_gen"]?.provider || "stabilityai"} onChange={(e) => updateModelConfig("image_gen", "provider", e.target.value)} style={{width:"100%",padding:"0.35rem 0.5rem",border:"1px solid #FFB6C1",borderRadius:4,fontSize:"0.75rem",background:"#FFFFFF"}}><option value="stabilityai">Stability AI</option><option value="openai">OpenAI DALL-E</option><option value="custom">自定义 API</option></select></div><div><div style={{fontSize:"0.68rem",color:"#6699BB",marginBottom:"0.2rem"}}>API Key</div><div style={{display:"flex",gap:"0.3rem"}}><input type={showKeyIds["image_gen"] ? "text" : "password"} value={modelConfigs["image_gen"]?.key || ""} onChange={(e) => updateModelConfig("image_gen", "key", e.target.value)} placeholder="输入 API Key" style={{flex:1,padding:"0.35rem 0.5rem",border:"1px solid #FFB6C1",borderRadius:4,fontSize:"0.75rem",background:"#FFFFFF"}} /><button onClick={() => toggleShowKey("image_gen")} style={{padding:"0.25rem 0.4rem",border:"1px solid #FFB6C1",borderRadius:4,background:"#FFFFFF",cursor:"pointer",fontSize:"0.65rem",color:"#CC3366"}}>{showKeyIds["image_gen"] ? "🔒" : "👁"}</button></div></div></div>
            <div style={{marginTop:"1rem",display:"flex",justifyContent:"flex-end"}}><button onClick={() => setShowSettings(false)} style={{padding:"0.5rem 1.2rem",border:"none",borderRadius:6,background:"#004488",color:"#FFFFFF",cursor:"pointer",fontSize:"0.85rem"}}>完成</button></div>
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
