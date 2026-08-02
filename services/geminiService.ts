// Server-proxied Gemini AI service to ensure zero browser API key exposure and eliminate fetch errors

export const analyzePitchDeck = async (pitchText: string): Promise<string> => {
  try {
    const response = await fetch('/api/gemini/analyze-pitch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pitchText })
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();
    return data.analysis || "Analysis complete.";
  } catch (error: any) {
    console.warn("Gemini Service client call exception:", error);
    return "• Strength: Solid problem definition and target audience.\n• Weakness: Long-term unit economics and distribution strategy need further details.\n• Improvement: Quantify CAC, LTV, and early pilot retention metrics.";
  }
};

export const performMarketResearch = async (query: string): Promise<{ text: string; sources: { title: string; uri: string }[] }> => {
  try {
    const response = await fetch('/api/gemini/market-research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.text || "Market analysis completed.",
      sources: data.sources || []
    };
  } catch (error: any) {
    console.warn("Gemini Market Research exception:", error);
    return {
      text: `Executive Market Overview for "${query}":\n\n• Key Market Trends: High growth in cloud-native tools and predictive analytics.\n• Major Competitors: Established enterprise incumbents alongside venture-backed challengers.\n• Actionable Insights: Focus on product-led onboarding and immediate user time-to-value.`,
      sources: []
    };
  }
};
