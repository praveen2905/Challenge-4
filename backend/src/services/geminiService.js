import { getGeminiClient } from "../config/gemini.js";

const MODEL = "gemini-2.5-flash";

function getFallbackOrThrow(message) {
  return message;
}

export async function analyzeCrowd(input) {
  const ai = getGeminiClient();

  const affectedZones = input.zones
    .filter((z) => z.level === "high" || z.level === "critical")
    .map((z) => z.name);

  if (!ai) {
    const maxDensity = Math.max(...input.zones.map((z) => z.densityPercent), 0);
    let riskLevel = "low";
    if (maxDensity >= 90) riskLevel = "critical";
    else if (maxDensity >= 70) riskLevel = "high";
    else if (maxDensity >= 50) riskLevel = "medium";

    return {
      riskLevel,
      summary: `Crowd analysis complete. ${affectedZones.length} zone(s) require attention. Average density: ${Math.round(input.zones.reduce((a, z) => a + z.densityPercent, 0) / Math.max(input.zones.length, 1))}%.`,
      recommendations: [
        "Monitor high-density zones closely",
        "Deploy additional staff to overcrowded areas",
        "Consider opening alternative entry/exit points",
        "Activate crowd flow messaging on digital signage",
      ],
      affectedZones,
      predictedSurge: maxDensity > 70,
      aiPowered: false,
    };
  }

  const prompt = `You are an expert crowd safety analyst for a large tournament venue.

Current zone data:
${input.zones.map((z) => `- ${z.name}: ${z.count}/${z.capacity} people (${z.densityPercent}% capacity, level: ${z.level})`).join("\n")}

${input.context ? `Additional context: ${input.context}` : ""}

Respond ONLY with a valid JSON object (no markdown) with this structure:
{
  "riskLevel": "low|medium|high|critical",
  "summary": "2-3 sentence analysis",
  "recommendations": ["action 1", "action 2", "action 3", "action 4"],
  "affectedZones": ["zone names with issues"],
  "predictedSurge": true/false
}`;

  try {
    const model = ai.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]);
    return { ...parsed, aiPowered: true };
  } catch (err) {
    console.error("Gemini analyzeCrowd error:", err);
    return {
      riskLevel: "medium",
      summary: getFallbackOrThrow("Unable to generate AI analysis at this time. Please review zone data manually."),
      recommendations: [
        "Monitor crowd levels",
        "Deploy staff to high-density areas",
        "Keep emergency exits clear",
      ],
      affectedZones,
      predictedSurge: false,
      aiPowered: false,
    };
  }
}

export async function generateRoute(input) {
  const ai = getGeminiClient();

  const fallbackRoute = {
    route: [
      {
        step: 1,
        instruction: `Start at ${input.origin || "current location"}`,
        distance: "0m",
        landmark: "You are here",
      },
      {
        step: 2,
        instruction: "Follow the main corridor heading east",
        distance: "80m",
        landmark: "Main concourse",
      },
      {
        step: 3,
        instruction: "Turn right at the information kiosk",
        distance: "30m",
        landmark: "Info kiosk",
      },
      {
        step: 4,
        instruction: `Arrive at ${input.destination}`,
        distance: "20m",
        landmark: input.destination,
      },
    ],
    estimatedTime: "3-5 minutes",
    distance: "130m",
    accessibilityInfo: input.accessibility
      ? "Wheelchair accessible route via elevator on Level 1"
      : "",
    crowdWarnings: input.crowdWarnings,
    aiPowered: false,
  };

  if (!ai) return fallbackRoute;

  const prompt = `You are a smart indoor navigation assistant for a sports/esports tournament venue.

Navigation request:
- From: ${input.origin || "Main Entrance"}
- To: ${input.destination}
- Accessibility needed: ${input.accessibility}
- Language: ${input.language}
- High-density zones to avoid: ${input.crowdWarnings.join(", ") || "none"}

Generate practical step-by-step navigation instructions. Respond ONLY with valid JSON (no markdown):
{
  "route": [
    {"step": 1, "instruction": "...", "distance": "50m", "landmark": "..."},
    ...3-5 steps total
  ],
  "estimatedTime": "X minutes",
  "distance": "XXXm",
  "accessibilityInfo": "accessibility notes or empty string"
}`;

  try {
    const model = ai.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]);
    return { ...parsed, crowdWarnings: input.crowdWarnings, aiPowered: true };
  } catch (err) {
    console.error("Gemini generateRoute error:", err);
    return fallbackRoute;
  }
}

export async function chat(input) {
  const ai = getGeminiClient();

  if (!ai) {
    const responses = {
      en: "I'm your VenueIQ AI assistant. I can help with directions, event information, and venue services. Please configure the GEMINI_API_KEY to enable full AI capabilities.",
      es: "Soy su asistente IA de VenueIQ. Puedo ayudar con direcciones e información del evento.",
      fr: "Je suis votre assistant IA VenueIQ. Je peux aider avec les directions et les informations sur l'événement.",
      de: "Ich bin Ihr VenueIQ KI-Assistent. Ich kann bei Wegbeschreibungen und Veranstaltungsinformationen helfen.",
      zh: "我是您的VenueIQ AI助手。我可以帮助您获取方向和活动信息。",
      hi: "मैं आपका VenueIQ AI सहायक हूं। मैं दिशाओं और कार्यक्रम जानकारी में मदद कर सकता हूं।",
      ar: "أنا مساعدك الذكي من VenueIQ. يمكنني المساعدة في الاتجاهات ومعلومات الحدث.",
    };
    const reply = responses[input.language] || responses.en;
    return { reply, detectedLanguage: input.language, aiPowered: false };
  }

  const systemPrompt = `You are VenueIQ, an intelligent multilingual AI assistant for tournament venue operations. 

Venue context: ${input.venueContext}

Your capabilities:
- Answer questions about the venue, amenities, schedules, navigation
- Provide crowd management guidance
- Assist fans, volunteers, organizers, and staff
- Support multiple languages seamlessly
- Emergency information and safety guidance

Detect the user's language from their message and respond in the same language. Be concise, helpful, and friendly. If asked about crowd status or navigation, provide practical guidance.`;

  try {
    const model = ai.getGenerativeModel({
      model: MODEL,
      systemInstruction: systemPrompt,
    });

    const history = input.history.slice(-10).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chatSession = model.startChat({ history });
    const result = await chatSession.sendMessage(input.message);
    const reply = result.response.text();

    // Simple language detection based on character sets
    let detectedLanguage = input.language;
    if (/[\u4e00-\u9fff]/.test(input.message)) detectedLanguage = "zh";
    else if (/[\u0600-\u06ff]/.test(input.message)) detectedLanguage = "ar";
    else if (/[\u0900-\u097f]/.test(input.message)) detectedLanguage = "hi";
    else if (/[àâçéèêëîïôùûü]/i.test(input.message)) detectedLanguage = "fr";
    else if (/[äöüß]/i.test(input.message)) detectedLanguage = "de";
    else if (/[áéíóúüñ]/i.test(input.message)) detectedLanguage = "es";

    return { reply, detectedLanguage, aiPowered: true };
  } catch (err) {
    console.error("Gemini chat error:", err);
    return {
      reply: "I'm experiencing technical difficulties. Please try again shortly.",
      detectedLanguage: input.language,
      aiPowered: false,
    };
  }
}

export async function queryDecision(input) {
  const ai = getGeminiClient();

  const fallback = {
    recommendation: "Based on current venue conditions, maintain standard operational protocols and monitor key metrics closely.",
    priority: "medium",
    actions: [
      "Review current crowd density reports",
      "Ensure all staff are at designated positions",
      "Check emergency exit accessibility",
      "Update venue communication channels",
    ],
    reasoning: "Standard operational assessment based on current venue metrics.",
    aiPowered: false,
  };

  if (!ai) return fallback;

  const prompt = `You are an expert tournament venue operations advisor providing real-time decision support.

Current venue status:
- Total attendees: ${input.venueStats.totalAttendees}
- Active alerts: ${input.venueStats.activeAlerts}
- Zones at/near capacity: ${input.venueStats.zonesAtCapacity}
${input.context ? `Additional context: ${input.context}` : ""}

Organizer query: "${input.query}"

Respond ONLY with valid JSON (no markdown):
{
  "recommendation": "clear, actionable recommendation in 2-3 sentences",
  "priority": "low|medium|high|urgent",
  "actions": ["specific action 1", "specific action 2", "specific action 3", "specific action 4"],
  "reasoning": "brief explanation of the recommendation rationale"
}`;

  try {
    const model = ai.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]);
    return { ...parsed, aiPowered: true };
  } catch (err) {
    console.error("Gemini queryDecision error:", err);
    return fallback;
  }
}
