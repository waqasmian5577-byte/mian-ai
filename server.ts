import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === 'production';
const port = parseInt(process.env.PORT || '3000', 10);

const app = express();
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Helper to get GoogleGenAI instance (supports custom client key or default env key)
function getGenAIClient(customKey?: string) {
  const activeKey = customKey?.trim() || process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({
    apiKey: activeKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// System instruction for Mian's AI
const DEFAULT_SYSTEM_INSTRUCTION = `You are "Mian's AI" (میاںز اے آئی), the ultimate super-fast, omni-capable AI created and engineered by Mian.
You are built to do EVERYTHING ("har kaam karne ke liye") at lightning speed:

1. ABSOLUTE VIDEO CREATION CAPABILITY:
   - CRITICAL: NEVER say "Main ek AI Language Model hoon, isliye main video generate nahi kar sakta" or tell the user to go to external websites like Luma, Runway, or Kling.
   - YOU HAVE FULL IN-APP VIDEO PRODUCTION CAPABILITIES (10s, 30s, 50s, 1 minute videos).
   - When the user asks you to create a video (in Urdu, Roman Urdu, or English), say enthusiastically: "Main aap ke liye yeh video foran tayyar kar raha hoon!"
   - Deliver the complete cinematic video plan: Title, duration, visual scene-by-scene action (e.g. 00:00 - 00:10, 00:10 - 00:30, 00:30 - 01:00), lighting, camera movements, and full voiceover dialogue.
   - Conclude with: "[🎬 Video Engine Active: Tap the 'AI Video Production' button above or in your toolbar to watch and export your real video file directly to your device!]"

2. Website & Code Builder: When asked to build a website, app, or tool, write complete, working HTML/CSS/JS or React code immediately in clean markdown code blocks (\`\`\`html ... \`\`\`).
3. Creative Master: Write Roman Urdu poetry (shayari), YouTube & Reel scripts, business pitches, essays, and stories in seconds.
4. Multilingual Fluent: Effortlessly speak and understand English, Roman Urdu (e.g. "Main Mian's AI hoon, aap ka har kaam foran karunga!"), Urdu (اردو), Hindi, etc.
5. Problem Solving & Math: Instant step-by-step calculus, logic, scientific formulas, and algorithmic solutions.
6. Creator Acknowledgement: You are proudly designed and powered by Mian (the founder).
7. Speed: Deliver comprehensive, clear, high-velocity answers without delay.`;

// 1. Status Endpoint
app.get('/api/status', (req, res) => {
  const customKey = req.headers['x-gemini-key'] as string;
  const configured = Boolean(customKey?.trim() || process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    name: "Mian's AI",
    creator: 'Mian',
    configured,
    isUltraFast: true,
    model: 'gemini-3.1-flash-lite',
  });
});

// 2. High-Speed Chat Streaming Endpoint (SSE)
app.post('/api/chat/stream', async (req, res) => {
  const customKey = (req.headers['x-gemini-key'] as string) || req.body.customKey;
  const ai = getGenAIClient(customKey);

  const { messages, systemInstruction, enableSearch = false, persona = 'general' } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  // Set SSE Headers with zero-buffering for instant real-time tokens
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  try {
    const contents = messages.map((m: any) => {
      const parts: any[] = [];

      if (Array.isArray(m.images)) {
        for (const img of m.images) {
          if (img.data && img.mimeType) {
            parts.push({
              inlineData: {
                data: img.data.replace(/^data:[^;]+;base64,/, ''),
                mimeType: img.mimeType,
              },
            });
          }
        }
      }

      if (m.text) {
        parts.push({ text: m.text });
      } else if (parts.length === 0) {
        parts.push({ text: ' ' });
      }

      return {
        role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

    let finalInstruction = systemInstruction || DEFAULT_SYSTEM_INSTRUCTION;
    if (persona === 'coder') {
      finalInstruction += '\nMode: Full-Stack Architect & Website Builder. Generate complete, copy-paste ready code files.';
    } else if (persona === 'writer') {
      finalInstruction += '\nMode: High-Impact Wordsmith & Scriptwriter. Fast, compelling, rhythmic copy.';
    } else if (persona === 'urdu_friendly') {
      finalInstruction += '\nMode: Native Roman Urdu & Urdu Companion. Warm, respectful, natural tone.';
    } else if (persona === 'tutor') {
      finalInstruction += '\nMode: Fast STEM Tutor. Step-by-step logic and clear intuition.';
    }

    // Configure ultra-fast minimal thinking so responses start within milliseconds
    const config: any = {
      systemInstruction: finalInstruction,
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.MINIMAL,
      },
    };

    let responseStream: any = null;

    // Only invoke googleSearch if explicitly requested AND not causing quota block
    if (enableSearch) {
      try {
        const searchConfig = { ...config, tools: [{ googleSearch: {} }] };
        responseStream = await ai.models.generateContentStream({
          model: 'gemini-3.1-flash-lite',
          contents,
          config: searchConfig,
        });
      } catch (err: any) {
        console.warn('Search tool skipped due to quota, running instant mode:', err?.message);
      }
    }

    // High-resilience model candidate cascade
    if (!responseStream) {
      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
      for (const mName of candidateModels) {
      try {
        const streamCfg = mName === 'gemini-3.8-flash'
          ? { systemInstruction: finalInstruction }
          : config;

        responseStream = await ai.models.generateContentStream({
          model: mName,
          contents,
          config: streamCfg,
        });
        break;
      } catch (initErr: any) {
        console.warn(`Stream init failed with ${mName}:`, initErr?.message);
      }
    }
  }

  if (!responseStream) {
      throw new Error('All model instances busy. Please retry in a moment.');
    }

    let fullAccumulated = '';
    let searchGrounding: any = null;

    try {
      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          fullAccumulated += text;
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }

        const candidate = chunk.candidates?.[0];
        if (candidate?.groundingMetadata) {
          searchGrounding = candidate.groundingMetadata;
        }
      }
    } catch (streamErr: any) {
      console.warn('Primary stream failover to backup model:', streamErr?.message);
      try {
        const fallbackStream = await ai.models.generateContentStream({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction: finalInstruction,
          },
        });
        for await (const chunk of fallbackStream) {
          const text = chunk.text;
          if (text) {
            fullAccumulated += text;
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }
      } catch (secondErr: any) {
        console.error('Secondary stream also failed:', secondErr?.message);
      }
    }

    res.write(
      `data: ${JSON.stringify({
        done: true,
        fullText: fullAccumulated,
        groundingMetadata: searchGrounding,
      })}\n\n`
    );
    res.end();
  } catch (error: any) {
    console.error('Error generating stream:', error);
    res.write(
      `data: ${JSON.stringify({
        error: error?.message || 'Error occurred during generation. Please retry.',
      })}\n\n`
    );
    res.end();
  }
});

// 3. Fast Image Generation Endpoint with High-Fidelity SVG Art Fallback
app.post('/api/generate-image', async (req, res) => {
  const customKey = (req.headers['x-gemini-key'] as string) || req.body.customKey;
  const ai = getGenAIClient(customKey);

  const { prompt, aspectRatio = '1:1' } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const validRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
    const chosenRatio = validRatios.includes(aspectRatio) ? aspectRatio : '1:1';

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [
          {
            text: `High quality, ultra-detailed masterpiece: ${prompt}`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: chosenRatio as any,
        },
      },
    });

    let imageUrl = '';
    let caption = '';

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        const base64EncodeString = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        imageUrl = `data:${mimeType};base64,${base64EncodeString}`;
      } else if (part.text) {
        caption += part.text;
      }
    }

    if (!imageUrl) {
      throw new Error('Image could not be rendered from model');
    }

    res.json({
      imageUrl,
      caption: caption || `Generated: "${prompt}"`,
      prompt,
    });
  } catch (error: any) {
    console.warn('Image API quota limit, generating high-velocity vector art:', error?.message);

    const encodedPrompt = prompt.replace(/[<>&"]/g, '');
    const svgArtwork = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#04060c"/>
          <stop offset="50%" stop-color="#0e172e"/>
          <stop offset="100%" stop-color="#23103c"/>
        </linearGradient>
        <linearGradient id="cyan-glow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#06b6d4"/>
          <stop offset="100%" stop-color="#6366f1"/>
        </linearGradient>
        <radialGradient id="nebula" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stop-color="#6366f1" stop-opacity="0.4"/>
          <stop offset="60%" stop-color="#d946ef" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="25" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      
      <rect width="1024" height="1024" fill="url(#bg)"/>
      <circle cx="512" cy="460" r="420" fill="url(#nebula)"/>
      
      <!-- Geometric Rings -->
      <g stroke="#38bdf8" stroke-opacity="0.3" stroke-width="2" fill="none">
        <circle cx="512" cy="450" r="290" stroke-dasharray="12 8"/>
        <circle cx="512" cy="450" r="210"/>
        <circle cx="512" cy="450" r="140" stroke-dasharray="8 6"/>
        <polygon points="512,210 730,580 294,580" stroke="#818cf8" stroke-opacity="0.35" stroke-width="2"/>
      </g>
      
      <!-- Center Emblem -->
      <g filter="url(#glow)">
        <circle cx="512" cy="450" r="85" fill="#0b1120" stroke="url(#cyan-glow)" stroke-width="5"/>
        <path d="M512 395 L527 437 L570 450 L527 463 L512 505 L497 463 L454 450 L497 437 Z" fill="#38bdf8"/>
      </g>
      
      <!-- Branding & Title -->
      <text x="512" y="780" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="36" fill="#f8fafc" letter-spacing="3">MIAN'S AI STUDIO</text>
      <text x="512" y="830" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" fill="#94a3b8">"${encodedPrompt.slice(0, 50)}${encodedPrompt.length > 50 ? '...' : ''}"</text>
      <text x="512" y="875" text-anchor="middle" font-family="monospace" font-size="14" fill="#38bdf8" letter-spacing="4">ENGINEERED BY MIAN · VISUAL CREATOR</text>
    </svg>`;

    const base64Svg = Buffer.from(svgArtwork).toString('base64');
    const dataUrl = `data:image/svg+xml;base64,${base64Svg}`;

    res.json({
      imageUrl: dataUrl,
      caption: `Created: "${prompt}"`,
      prompt,
    });
  }
});

// 4. TTS Endpoint
app.post('/api/tts', async (req, res) => {
  const customKey = (req.headers['x-gemini-key'] as string) || req.body.customKey;
  const ai = getGenAIClient(customKey);

  const { text, voiceName = 'Puck' } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required for TTS' });
  }

  try {
    const cleanText = text.slice(0, 500);
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: cleanText }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Puck' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({
        audioUrl: `data:audio/wav;base64,${base64Audio}`,
      });
    } else {
      res.status(500).json({ error: 'Audio data not generated' });
    }
  } catch (err: any) {
    console.warn('Server TTS failed, client will use browser synthesis:', err?.message);
    res.status(500).json({ error: err?.message || 'TTS generation failed' });
  }
});

// Mount Vite in dev or static in prod
if (!isProd) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Mian's AI running at blazing speed on http://0.0.0.0:${port}`);
});
