import { GoogleGenAI, Type, ThinkingLevel, Modality } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is missing from environment variables. AI features will not work until set.');
    }
    // Pass a dummy key if undefined to prevent crashing on boot, though API calls will fail later.
    aiInstance = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-to-prevent-crash' });
  }
  return aiInstance;
};

export interface ScanResult {
  name: string;
  confidence: number;
  description: string;
  details: string;
  recommendations: string[];
  type: 'plant' | 'animal' | 'human' | 'object' | 'other';
  banglaName?: string;
  // New Next-Level Features
  healthScore?: number;
  hydrationScore?: number;
  sunlightScore?: number;
  dnaInsight?: {
    growthType: string;
    lifespan: string;
    idealEnvironment: string;
  };
  careKit?: {
    items: { name: string; price: string; reason: string }[];
  };
  problemHighlights?: {
    x: number;
    y: number;
    label: string;
    description: string;
  }[];
  // Advanced Features
  rootCause?: string;
  confidenceExplanation?: string;
  multiStepGuide?: {
    step: number;
    title: string;
    description: string;
  }[];
  predictedIssues?: {
    issue: string;
    timeframe: string;
    prevention: string;
  }[];
}

export const analyzeImage = async (
  base64Image: string, 
  isBangladeshMode: boolean, 
  language: 'en' | 'bn' = 'en',
  plantNetData?: any,
  userQuery?: string,
  quality: 'high' | 'standard' = 'high'
): Promise<ScanResult> => {
  const ai = getAI();
  const modelName = quality === 'high' ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview";
  
  const model = ai.models.generateContent({
    model: modelName,
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          {
            text: `Identify what is in this image. It could be a plant, animal, human, object, or anything else.
            ${userQuery ? `CRITICAL: The user has a specific question or input: "${userQuery}". You MUST answer this question directly in your description and details.` : ""}
            ${plantNetData ? `Additional PlantNet Data for context: ${JSON.stringify(plantNetData)}` : ""}
            
            Provide:
            1. Name of the subject.
            2. Confidence level (0-1).
            3. A brief description (Address the user's query here if provided).
            4. Specific details (e.g., if it's a plant, mention health; if an animal, mention breed/species; if an object, mention its use).
            5. Recommendations or interesting facts.
            6. The type of subject (plant, animal, human, object, or other).
            7. The name in Bangla (if applicable).
            
            If it's a PLANT, also provide these NEXT-LEVEL insights:
            8. Health Score (0-100), Hydration Score (0-100), Sunlight Score (0-100).
            9. DNA Insight: Growth type (e.g., Perennial, Annual), Lifespan, Ideal environment.
            10. Care Kit: A list of 3 essential products (name, estimated price in BDT if BD mode, reason) to fix or maintain the plant.
            11. Problem Highlights: If there are visible issues (yellow spots, pests, dry edges), provide their coordinates (x, y as percentages 0-100) and a short label/description.
            12. Root Cause: Explain WHY the plant is in its current state (e.g., "Overwatering caused root stress leading to yellow leaves").
            13. Confidence Explanation: Explain why you are confident in your identification (e.g., "95% confident because leaf pattern matches fungal infection").
            14. Multi-step Guide: A step-by-step recovery plan (Step 1, Step 2, Step 3).
            15. Predicted Issues: Predict potential future issues based on current state and provide prevention tips.

            Language: Respond in ${language === 'bn' ? 'Bangla' : 'English'}.
            ${isBangladeshMode ? "The user is in Bangladesh. If relevant, provide localized context or facts specific to Bangladesh." : ""}
            Return the result in JSON format.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          description: { type: Type.STRING },
          details: { type: Type.STRING },
          recommendations: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          type: { 
            type: Type.STRING,
            enum: ['plant', 'animal', 'human', 'object', 'other']
          },
          banglaName: { type: Type.STRING },
          healthScore: { type: Type.NUMBER },
          hydrationScore: { type: Type.NUMBER },
          sunlightScore: { type: Type.NUMBER },
          dnaInsight: {
            type: Type.OBJECT,
            properties: {
              growthType: { type: Type.STRING },
              lifespan: { type: Type.STRING },
              idealEnvironment: { type: Type.STRING },
            }
          },
          careKit: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    price: { type: Type.STRING },
                    reason: { type: Type.STRING },
                  }
                }
              }
            }
          },
          problemHighlights: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
                label: { type: Type.STRING },
                description: { type: Type.STRING },
              }
            }
          },
          rootCause: { type: Type.STRING },
          confidenceExplanation: { type: Type.STRING },
          multiStepGuide: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                step: { type: Type.NUMBER },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
              }
            }
          },
          predictedIssues: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                issue: { type: Type.STRING },
                timeframe: { type: Type.STRING },
                prevention: { type: Type.STRING },
              }
            }
          }
        },
        required: ["name", "confidence", "description", "details", "recommendations", "type"],
      },
      tools: [{ googleSearch: {} }],
      toolConfig: { includeServerSideToolInvocations: true }
    },
  });

  const response = await model;
  const text = response.text;
  console.log('Gemini raw response text:', text);

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  try {
    // Clean up the response text in case it's wrapped in markdown code blocks
    const cleanedText = text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error('Failed to parse Gemini response as JSON:', text);
    throw new Error("Invalid response format from Gemini.");
  }
};

export const visualizeGrowth = async (
  plantName: string,
  currentCondition: string
): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `A high-quality, realistic photo of a healthy, lush, and fully grown ${plantName}. 
          The plant is thriving in a beautiful pot, with vibrant green leaves and perfect health. 
          Background: A cozy, sunlit modern home interior. 
          Context: This is a visualization of how the plant will look after 6 months of perfect care, 
          recovering from its current condition: ${currentCondition}.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image generated");
};

export type ChatMode = 'general' | 'complex' | 'fast';

export const getChatResponse = async (
  message: string, 
  history: { role: 'user' | 'model', content: string }[],
  language: 'en' | 'bn' = 'en',
  mode: ChatMode = 'general',
  scanContext?: ScanResult,
  audioBase64?: string
) => {
  const ai = getAI();
  let modelName = "gemini-3-flash-preview";
  
  let systemInstruction = `You are "Leafy AI", a friendly, smart, and helpful personal plant doctor. 
    Your personality:
    - Friendly and encouraging (e.g., "Hmm... looks like your plant needs more sunlight ☀️", "Don't worry, we can fix this 🌿").
    - Smart and expert-level botanical knowledge.
    - MOOD DETECTION: If the user seems sad, worried, or frustrated about their plant (e.g., "My plant is dying 😭"), respond with empathy and reassurance before giving advice.
    - TEACHING MODE: If the user asks to learn (e.g., "Teach me plant care"), provide structured lessons, interesting facts, and occasionally a small fun quiz to test their knowledge.
    - MULTI-STEP GUIDANCE: For complex problems, provide a guided journey: Step 1 (Diagnose), Step 2 (Fix), Step 3 (Monitor).
    - Not robotic, not too formal.
    - Provide step-by-step treatment (e.g., "Use neem oil 2 times per week", "Keep in sunlight for 4-5 hours").
    - Ask clarifying questions to be more accurate (e.g., "Is it indoor or outdoor?", "How often do you water?").
    - Aware of Bangladesh's climate 🇧🇩 (Rain 🌧️, Heat ☀️, Local plants). If it's rainy season in BD, suggest reducing watering.
    - If you recommend a product (like fertilizer or neem oil), mention that the user can find related products in the app.
    - If the user is in "Emergency Mode", be urgent but reassuring, providing immediate first-aid steps for the plant.
    - VOICE INPUT: If the user provides a voice message, listen carefully and respond to their request.
    
    Language: Respond in ${language === 'bn' ? 'Bangla' : 'English'}.`;

  if (scanContext) {
    systemInstruction += `\n\nCONTEXT: The user just scanned a ${scanContext.name} (${scanContext.type}). 
    Details: ${scanContext.description} ${scanContext.details}. 
    Recommendations: ${scanContext.recommendations?.join(', ') || 'N/A'}.
    Health Score: ${scanContext.healthScore || 'N/A'}.
    Please use this information to provide more personalized advice.`;
  }

  let config: any = {
    systemInstruction,
    tools: [{ googleSearch: {} }],
  };

  if (mode === 'complex') {
    modelName = "gemini-3.1-pro-preview";
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  } else if (mode === 'fast') {
    modelName = "gemini-3.1-flash-lite-preview";
  }

  const parts: any[] = [{ text: message }];
  if (audioBase64) {
    parts.unshift({
      inlineData: {
        mimeType: "audio/wav",
        data: audioBase64.split(',')[1] || audioBase64
      }
    });
  }

  const chat = ai.chats.create({
    model: modelName,
    config: config,
    history: history.length > 0 ? history.map(h => ({
      role: h.role,
      parts: [{ text: h.content }]
    })) : undefined
  });

  const response = await chat.sendMessage({
    message: parts
  });

  const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.filter(chunk => chunk.web?.uri)
    .map(chunk => ({ uri: chunk.web!.uri, title: chunk.web!.title }));

  return {
    text: response.text,
    links: links || []
  };
};

export const deepAnalyze = async (
  base64Image: string,
  subjectName: string,
  language: 'en' | 'bn' = 'en'
): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          {
            text: `Provide a deep, expert-level botanical analysis of this ${subjectName}. 
            Include:
            1. Full scientific classification (Kingdom to Species).
            2. Detailed morphological characteristics.
            3. Specific soil, light, and humidity requirements in quantitative terms (e.g., lux, pH levels).
            4. Potential pests and diseases specific to this species and how to prevent them.
            5. Interesting historical or cultural facts.
            
            Language: Respond in ${language === 'bn' ? 'Bangla' : 'English'}.
            Use Markdown for formatting.`,
          },
        ],
      },
    ],
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      tools: [{ googleSearch: {} }],
    },
  });

  return response.text;
};

export interface GrowthAnalysis {
  healthScore: number;
  improvement: number;
  aiAnalysis: string;
  prediction: string;
}

export const compareGrowth = async (
  oldImageBase64: string | null,
  newImageBase64: string,
  language: 'en' | 'bn' = 'en'
): Promise<GrowthAnalysis> => {
  const parts: any[] = [
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: newImageBase64.split(',')[1] || newImageBase64,
      },
    },
  ];

  if (oldImageBase64) {
    parts.unshift({
      inlineData: {
        mimeType: "image/jpeg",
        data: oldImageBase64.split(',')[1] || oldImageBase64,
      },
    });
  }

  const prompt = oldImageBase64 
    ? `Compare these two images of the same plant. The first image is from the past, and the second image is the current state.
       Analyze the progress:
       1. Current Health Score (0-100).
       2. Improvement percentage compared to the previous state (can be negative if condition worsened).
       3. Detailed AI Analysis of changes (e.g., "New leaves detected", "Yellow spots reduced").
       4. Prediction for the next 7 days based on current care.
       
       Language: Respond in ${language === 'bn' ? 'Bangla' : 'English'}.
       Return the result in JSON format.`
    : `Analyze this plant image for the first time in a growth log.
       Provide:
       1. Current Health Score (0-100).
       2. Improvement percentage (set to 0 for the first entry).
       3. Detailed AI Analysis of the current state.
       4. Prediction for the next 7 days.
       
       Language: Respond in ${language === 'bn' ? 'Bangla' : 'English'}.
       Return the result in JSON format.`;

  parts.push({ text: prompt });

  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          healthScore: { type: Type.NUMBER },
          improvement: { type: Type.NUMBER },
          aiAnalysis: { type: Type.STRING },
          prediction: { type: Type.STRING },
        },
        required: ["healthScore", "improvement", "aiAnalysis", "prediction"],
      },
    },
  });

  const text = response.text;
  try {
    const cleanedText = text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error('Failed to parse growth analysis:', text);
    throw new Error("Invalid response format from Gemini.");
  }
};

export const findNearbyNurseries = async (lat: number, lng: number, language: 'en' | 'bn' = 'en') => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Find nearby plant nurseries or garden centers around my location. 
    Provide a list of at least 3 places with their names, addresses, and why they are good.
    Language: Respond in ${language === 'bn' ? 'Bangla' : 'English'}.`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      }
    },
  });

  const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.filter(chunk => chunk.maps?.uri)
    .map(chunk => ({ uri: chunk.maps!.uri, title: chunk.maps!.title }));

  return {
    text: response.text,
    links: urls || []
  };
};

export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      // Gemini TTS returns raw PCM (16-bit, mono, 24kHz). 
      // We need to wrap it in a WAV header to make it playable in an <audio> element.
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const wavHeader = new Uint8Array(44);
      const view = new DataView(wavHeader.buffer);

      // RIFF identifier
      view.setUint32(0, 0x52494646, false); // "RIFF"
      // file length
      view.setUint32(4, 36 + len, true);
      // RIFF type
      view.setUint32(8, 0x57415645, false); // "WAVE"
      // format chunk identifier
      view.setUint32(12, 0x666d7420, false); // "fmt "
      // format chunk length
      view.setUint32(16, 16, true);
      // sample format (raw)
      view.setUint16(20, 1, true);
      // channel count
      view.setUint16(22, 1, true);
      // sample rate
      view.setUint32(24, 24000, true);
      // byte rate (sample rate * block align)
      view.setUint32(28, 24000 * 2, true);
      // block align (channel count * bytes per sample)
      view.setUint16(32, 2, true);
      // bits per sample
      view.setUint16(34, 16, true);
      // data chunk identifier
      view.setUint32(36, 0x64617461, false); // "data"
      // data chunk length
      view.setUint32(40, len, true);

      const combined = new Uint8Array(wavHeader.length + bytes.length);
      combined.set(wavHeader);
      combined.set(bytes, wavHeader.length);

      const blob = new Blob([combined], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    }
    throw new Error("No audio generated");
  } catch (error: any) {
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn("TTS Quota exceeded, skipping speech generation.");
      throw new Error("QUOTA_EXCEEDED");
    }
    throw error;
  }
};
