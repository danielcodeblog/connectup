
import { GoogleGenAI } from "@google/genai";

// API key is handled via environment variables as per guidelines
export const analyzePitchDeck = async (pitchText: string): Promise<string> => {
  try {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await (window as any).aistudio.openSelectKey();
        }
    }
    
    // Initialize GoogleGenAI right before usage
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this startup pitch summary and provide 3 brief bullet points of feedback (Strengths, Weaknesses, Improvements) for an investor audience:\n\n${pitchText}`,
    });
    
    // Access the .text property directly
    return response.text || "Analysis failed.";
  } catch (error: any) {
    // If key missing/invalid, reset key selection
    if (error.message?.includes("Requested entity was not found.")) {
        if (typeof window !== 'undefined' && (window as any).aistudio) {
            await (window as any).aistudio.openSelectKey();
        }
    }
    console.error("Gemini API Error:", error);
    return "Error generating analysis.";
  }
};

export const performMarketResearch = async (query: string): Promise<{ text: string; sources: { title: string; uri: string }[] }> => {
  try {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await (window as any).aistudio.openSelectKey();
        }
    }

    // Initialize GoogleGenAI right before usage
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform a market research analysis based on the following query: "${query}". 
      
      Provide a structured executive summary that includes:
      - Key Market Trends
      - Major Competitors (if relevant)
      - Actionable Insights for a Startup Founder
      
      Keep the tone professional, concise, and data-driven.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Access the .text property directly
    const text = response.text || "No results found.";
    
    // Extract sources from grounding chunks as per search grounding guidelines
    const sources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    chunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({
          title: chunk.web.title || "Source",
          uri: chunk.web.uri || "#"
        });
      }
    });

    return { text, sources };
  } catch (error: any) {
    // If key missing/invalid, reset key selection
    if (error.message?.includes("Requested entity was not found.")) {
        if (typeof window !== 'undefined' && (window as any).aistudio) {
            await (window as any).aistudio.openSelectKey();
        }
    }
    console.error("Gemini Search Error:", error);
    return { text: "Error performing research.", sources: [] };
  }
};
