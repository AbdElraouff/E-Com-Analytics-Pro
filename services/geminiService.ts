import { GoogleGenerativeAI } from "@google/generative-ai";
import { CampaignMetrics } from "../types";

// مفتاح Gemini يأتي من Vite وليس Node
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

if (!apiKey) {
  console.error("❌ ERROR: Missing VITE_GOOGLE_API_KEY");
}

const ai = new GoogleGenerativeAI(apiKey);

// دالة تحليل الحملات
export const analyzeCampaignData = async (data: CampaignMetrics[]): Promise<string> => {
  // تبسيط البيانات داخل prompt
  const summary = data.map(c => ({
    name: c.campaignName,
    platform: c.platform,
    spend: c.spend,
    roas: c.roas,
    cpa: c.costPerPurchase,
    ctr: c.ctr
  }));

  const prompt = `
قم بتحليل بيانات الحملات التالية:

${JSON.stringify(summary, null, 2)}

المطلوب:
1. أفضل حملة أداءً ولماذا.
2. أسوأ حملة ولماذا.
3. 3 توصيات عملية لتحسين ROAS.

التحليل يكون بشكل نقاط قصيرة ومباشرة.
  `;

  try {
    // الطريقة الصحيحة الرسمية لاختيار النموذج
    const model = ai.getGenerativeModel({ model: "gemini-pro" });

    // إرسال المحتوى إلى Gemini
    const result = await model.generateContent(prompt);

    // الحصول على الرد
    const response = await result.response;

    return response.text() || "لم يتم توليد تحليل.";
  } catch (error) {
    console.error("❌ Gemini Error:", error);
    return "حدث خطأ أثناء تحليل البيانات.";
  }
};
