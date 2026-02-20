import { Task, UserContext } from "../types";
import { AI_BASE_URL, API_BASE_URL, API_PATHS, AI_API_KEY, AI_MODEL, isDev } from "../config";

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream: boolean;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
    index: number;
  }>;
  model: string;
  id: string;
  usage?: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * 调用 AI 基座接口
 * 开发环境：通过 Vite 代理直接调用（路径与示例一致）
 * 生产环境：通过后端代理调用
 */
async function callAIBase(messages: ChatMessage[]): Promise<string> {
  try {
    const requestBody: ChatCompletionRequest = {
      model: AI_MODEL,
      messages,
      stream: false,
    };

    // 统一使用 fetch，确保始终携带 AI API Key 的 Authorization header
    const url = isDev ? AI_BASE_URL : `${API_BASE_URL}${API_PATHS.AI.CHAT_COMPLETIONS}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': AI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`);
    }

    const data: ChatCompletionResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from AI');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI Base API call failed:', error);
    throw error;
  }
}

/**
 * 解析 JSON 响应（处理可能的 markdown 代码块）
 */
function parseJSONResponse(text: string): any {
  // 尝试直接解析
  try {
    return JSON.parse(text);
  } catch (e) {
    // 如果失败，尝试提取代码块中的 JSON
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e2) {
        console.error('Failed to parse JSON from code block:', e2);
      }
    }
    throw new Error('Invalid JSON response from AI');
  }
}

export const analyzeTaskInitiative = async (rawInput: string, context?: UserContext): Promise<Partial<Task>> => {
  // 构造人物画像信息
  let personaInfo = "";
  if (context) {
    personaInfo = `
人物画像
职位/职级：${context.jobTitle}
汇报对象：${context.reportingTo}
季度目标 OKR：${context.quarterlyGoal}
年度目标 ORK/OKR：${context.annualGoal}
直接领导人数与构成：${context.directTeamSize}人，${context.directTeamSkills}
间接领导团队人数与构成：${context.collabTeamSize}人，${context.collabTeamSkills}`;
  } else {
    personaInfo = `
人物画像
职位/职级：未指定
汇报对象：未指定
季度目标 OKR：未指定
年度目标 ORK/OKR：未指定
直接领导人数与构成：未指定
间接领导团队人数与构成：未指定`;
  }

  // 构造待评估任务信息
  const taskInfo = `
待评估任务
任务名称：${rawInput}
任务描述（做什么/交付物/完成标准）：${rawInput}
期望完成时间（或截止日期）：未指定
涉及协作方/依赖：待确认
资源边界（预算/权限/可用人力）：待确认`;

  const systemPrompt = `你是一个"组织绩效量化评审官"。请基于我提供的岗位与目标信息，对【单个任务】进行定量评估，输出 Impact（收益，1-10） 与 Effort（成本，1-10），并给出可审计的理由与假设。评分必须可对比、可复用、可解释，不要给泛泛而谈的描述。

2) 评分口径（必须严格遵守）

A. Impact（收益，1-10）
Impact 衡量"任务对该岗位的目标达成与组织价值的贡献"，以 OKR 对齐 为主轴，综合以下维度打分（给出权重式判断，但无需写数学公式）：
OKR/关键结果对齐度（最关键）：是否直接推动季度/年度关键结果；是"核心KR"还是"边缘优化"
价值量级：对收入/成本/效率/风险/质量/合规/客户体验的改善幅度（用相对量级：小/中/大/极大，并说明依据）
作用范围：影响的人群/系统/流程覆盖面（个人→小组→部门→跨部门→公司级）
持续性：一次性收益 vs 可复利的长期能力/机制沉淀
杠杆效应（与团队规模相关）：是否提升直接/间接团队产能、决策质量或协作效率
风险与机会窗口：是否规避重大风险、抓住窗口期（错过会显著损失）

Impact （请据此校准）：
1-2：几乎不影响 OKR；个人体验/小修小补；收益难以观察
3-4：对某个局部流程有改善；对 OKR 贡献弱或间接
5-6：明确支持至少一个 KR；对小团队或单条业务线有可见收益
7-8：直接推动核心 KR；跨团队可见收益或显著降本增效/降风险
9-10：公司级或关键战役级；决定性影响核心目标、显著复利或重大风险规避

B. Effort（成本，1-10）
Effort 衡量"实现该任务所需的总投入与难度"，不仅是工时，还包括不确定性与协作摩擦。综合以下维度打分：
工作量/周期：人天、人周、人月量级（给出你推断的区间）
复杂度：技术/业务复杂度、方案设计难度
不确定性/探索性：需求不清、试错成本、验证成本
依赖与协作成本：跨团队数量、对外部资源/审批的依赖强度
风险：失败概率、返工概率、上线风险、合规风险
机会成本：对本岗位更重要工作产生的挤占程度

Effort 评分锚点（请据此校准）：
1-2：0.5–2 天；几乎无依赖；低风险
3-4：3–10 天；少量协作；方案清晰
5-6：2–6 周；多步骤交付；存在关键依赖或中等不确定性
7-8：1–3 个月；跨团队推进明显；不确定性较高或系统级改动
9-10：3 个月以上或高失败风险；强依赖/强审批/强变更，牵一发动全身

3) 输出要求（强制格式）
请用 JSON 输出，字段如下（不要输出多余字段）：
{
  "title": "任务标题（简洁的执行摘要）",
  "description": "简要的战略描述，包含 Impact 和 Effort 的评分理由（2-3句话）",
  "impactScore": 数字（1-10，必须严格按照上述标准评分）,
  "effortScore": 数字（1-10，必须严格按照上述标准评分）,
  "strategicAdvice": "一句战略建议（例如：立即执行、委派给[具体角色]、自动化处理、直接砍掉）。如果任务可以由直接团队或协作资源完成，必须建议委派。",
  "subTasks": []（必须返回空数组，具体执行步骤由用户稍后自行规划）
}

请务必严格遵循评分标准，给出可审计、可解释的评分。所有文本内容请使用中文。`;

  const userPrompt = `
1) 输入信息
${personaInfo}
${taskInfo}

请基于以上信息，对该任务进行定量评估，并返回 JSON 格式的结果。`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    const responseText = await callAIBase(messages);
    const data = parseJSONResponse(responseText);

    // 验证并返回结果
    return {
      title: data.title || rawInput,
      description: data.description || '',
      impactScore: typeof data.impactScore === 'number' ? Math.max(1, Math.min(10, data.impactScore)) : 5,
      effortScore: typeof data.effortScore === 'number' ? Math.max(1, Math.min(10, data.effortScore)) : 5,
      strategicAdvice: data.strategicAdvice || '请谨慎推进。',
      subTasks: [] // 强制返回空数组
    };

  } catch (error) {
    console.error("COO Analysis Failed:", error);
    // 回退方案
    return {
      title: rawInput,
      description: "手动输入 (AI 分析失败)",
      impactScore: 5,
      effortScore: 5,
      strategicAdvice: "请谨慎推进。",
      subTasks: []
    };
  }
};

export const generateStrategicContext = async (jobTitle: string): Promise<Partial<UserContext>> => {
  const systemPrompt = `作为世界顶级的组织架构与战略顾问。请根据用户提供的职位头衔，生成一份高标准的"战略背景档案"。

返回格式必须严格遵循以下 JSON Schema：
{
  "reportingTo": "通常向谁汇报",
  "quarterlyGoal": "一个典型的、高影响力的季度 OKR (Objective)",
  "annualGoal": "一个具有远见卓识的年度战略目标",
  "directTeamSize": 数字（预估的直接下属人数）,
  "directTeamSkills": "核心团队应具备的关键技能（逗号分隔）",
  "collabTeamSize": 数字（预估的协作/外包团队规模）,
  "collabTeamSkills": "需要调用的外部技能资源（逗号分隔）"
}

请使用中文回答，确保内容专业、具体且符合该职位的层级。`;

  const userPrompt = `用户填写了一个职位头衔: "${jobTitle}"。

请根据这个职位，推演并生成一份高标准的"战略背景档案" (Executive Profile)。`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    const responseText = await callAIBase(messages);
    const data = parseJSONResponse(responseText);

    return {
      reportingTo: data.reportingTo || "上级主管",
      quarterlyGoal: data.quarterlyGoal || "提升业务核心指标",
      annualGoal: data.annualGoal || "实现可持续增长",
      directTeamSize: typeof data.directTeamSize === 'number' ? data.directTeamSize : 5,
      directTeamSkills: data.directTeamSkills || "执行力, 沟通",
      collabTeamSize: typeof data.collabTeamSize === 'number' ? data.collabTeamSize : 10,
      collabTeamSkills: data.collabTeamSkills || "行政支持, 技术支持"
    };
  } catch (error) {
    console.error("Context Generation Failed:", error);
    return {
      reportingTo: "上级主管",
      quarterlyGoal: "提升业务核心指标",
      annualGoal: "实现可持续增长",
      directTeamSize: 5,
      directTeamSkills: "执行力, 沟通",
      collabTeamSize: 10,
      collabTeamSkills: "行政支持, 技术支持"
    };
  }
};
