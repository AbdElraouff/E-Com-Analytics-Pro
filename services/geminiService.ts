import { GoogleGenerativeAI } from "@google/generative-ai";
import { CampaignMetrics } from "../types";

const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || "";

const ai = new GoogleGenerativeAI(apiKey);

export const analyzeCampaignData = async (data: CampaignMetrics[]): Promise<string> => {
  if (!apiKey) {
    return "API Key missing. Please configure your environment.";
  }

  // Summarize data to keep prompt efficient
  const summary = data.map(c => ({
    name: c.campaignName,
    platform: c.platform,
    spend: c.spend,
    roas: c.roas,
    cpa: c.costPerPurchase,
    ctr: c.ctr
  }));

  const prompt = `
    بصفتك خبيرًا في التسويق الرقمي والتجارة الإلكترونية، قم بتحليل بيانات الحملات التالية وقدم ملخصًا تنفيذيًا قصيرًا باللغة العربية.
    ركز على:
    1. الحملة الأفضل أداءً ولماذا.
    2. الحملة التي تحتاج إلى إيقاف أو تحسين فوري.
    3. نصيحة عامة لتحسين الـ ROAS.
    
    البيانات:
    ${JSON.stringify(summary, null, 2)}
    
    الرجاء تنسيق الإجابة كنقاط واضحة ومباشرة.
  `;

  try {
    const model = ai.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.text() || "لم يتم استلام أي تحليل.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "حدث خطأ أثناء تحليل البيانات. يرجى المحاولة لاحقاً.";
  }
};
