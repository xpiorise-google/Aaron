import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { AnalysisSchema, Task, UserContext } from "../types";

// Lazy initialization of Gemini Client
let ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI | null => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. AI features will be disabled.");
    return null;
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

const ContextSchema = {
  type: Type.OBJECT,
  properties: {
    reportingTo: { type: Type.STRING, description: "Who this role typically reports to." },
    quarterlyGoal: { type: Type.STRING, description: "A realistic, high-impact quarterly OKR." },
    annualGoal: { type: Type.STRING, description: "A visionary annual strategic goal." },
    directTeamSize: { type: Type.NUMBER, description: "Estimated direct report count." },
    directTeamSkills: { type: Type.STRING, description: "Key skills needed in the direct team." },
    collabTeamSize: { type: Type.NUMBER, description: "Estimated extended/collaborative team size." },
    collabTeamSkills: { type: Type.STRING, description: "Key skills needed in the collaborative team." },
  },
  required: ["reportingTo", "quarterlyGoal", "annualGoal", "directTeamSize", "directTeamSkills", "collabTeamSize", "collabTeamSkills"],
};

export const analyzeTaskInitiative = async (rawInput: string, context?: UserContext): Promise<Partial<Task>> => {
  const modelId = "gemini-3-flash-preview";
  
  // Construct a context-aware persona
  let contextString = "";
  if (context) {
    contextString = `
    【用户背景档案】
    - 职位: ${context.jobTitle} (汇报给: ${context.reportingTo})
    - 季度核心目标: ${context.quarterlyGoal}
    - 年度战略目标: ${context.annualGoal}
    - 直接管理团队: ${context.directTeamSize}人 (技能: ${context.directTeamSkills})
    - 可调用协作资源: ${context.collabTeamSize}人 (技能: ${context.collabTeamSkills})
    
    【决策原则】
    1. 如果任务与“季度/年度目标”无关，给予极低的 Impact Score。
    2. 如果任务可以由“直接团队”或“协作资源”完成，Strategic Advice 必须建议“委派/Delegate”，不要建议用户亲力亲为。
    3. 如果用户没有团队且任务繁重，建议“外包”或“使用工具自动化”。
    4. 站在用户的职位高度思考，CEO关注战略，专员关注执行。
    `;
  }

  const prompt = `
    你是一位服务于高效能管理者的首席运营官(COO)。
    
    ${contextString}

    用户提出了以下待办提案: "${rawInput}".
    
    请分析该提案：
    - 预估 'Impact Score' (影响力评分：收入、增长、长期价值) 范围 1-10。
    - 预估 'Effort Score' (耗时评分：时间、认知负担、资源投入) 范围 1-10。
    - 提供一句 'Strategic Advice' (战略建议)：例如“立即执行”、“委派给[具体角色]”、“自动化处理”或“直接砍掉”。
    - 'subTasks': 请务必返回空数组 []。具体的执行步骤由用户稍后自行规划，不要代劳。
    
    请务必无情。低价值的任务必须给低影响力分。所有文本内容请使用中文。
  `;

  const client = getAI();
  if (!client) {
    // Fallback when API key is not set
    return {
      title: rawInput,
      description: "手动输入 (API Key 未配置)",
      impactScore: 5,
      effortScore: 5,
      strategicAdvice: "请谨慎推进。",
      subTasks: []
    };
  }

  try {
    const response = await client.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: AnalysisSchema,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } // Speed is key for the executive
      },
    });

    const text = response.text;
    if (!text) throw new Error("No analysis returned from AI COO.");

    const data = JSON.parse(text);

    return {
      title: data.title,
      description: data.description,
      impactScore: data.impactScore,
      effortScore: data.effortScore,
      strategicAdvice: data.strategicAdvice,
      subTasks: [] // Force empty array on client side as well to be safe
    };

  } catch (error) {
    console.error("COO Analysis Failed:", error);
    // Fallback for offline or error
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
  const modelId = "gemini-3-flash-preview";

  const prompt = `
    作为世界顶级的组织架构与战略顾问。
    
    用户填写了一个职位头衔: "${jobTitle}"。
    
    请根据这个职位，推演并生成一份高标准的“战略背景档案” (Executive Profile)。
    内容包括：
    1. reportingTo: 通常向谁汇报？
    2. quarterlyGoal: 一个典型的、高影响力的季度 OKR (Objective)。
    3. annualGoal: 一个具有远见卓识的年度战略目标。
    4. directTeamSize: 预估的直接下属人数。
    5. directTeamSkills: 核心团队应具备的关键技能 (逗号分隔)。
    6. collabTeamSize: 预估的协作/外包团队规模。
    7. collabTeamSkills: 需要调用的外部技能资源 (逗号分隔)。

    请使用中文回答，确保内容专业、具体且符合该职位的层级。
  `;

  const client = getAI();
  if (!client) {
    // Fallback when API key is not set
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

  try {
    const response = await client.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: ContextSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No context generated.");

    return JSON.parse(text);
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