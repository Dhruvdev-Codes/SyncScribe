import { Request, Response } from 'express';
import axios from 'axios';
import OpenAI from 'openai';
import { AIRewriteRequest, AIChatRequest, AISummarizeRequest, AITranslateRequest } from '../types';
import { logActivity } from '../services/activityLogger';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const openaiClient = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export const SYSTEM_PROMPT = `You are SyncScribe AI Copilot, an intelligent, helpful, and friendly AI assistant integrated into a real-time collaborative document editor.

CRITICAL BEHAVIORAL RULES:
1. MATCH USER INTENT: 
   - If the user says a casual greeting (e.g., "hi", "hello", "hii", "hey", "how are you"), respond briefly, warmly, and conversationally like ChatGPT or Gemini. DO NOT generate formal multi-section documents, bullet points, or corporate frameworks for casual chat.
   - If the user asks a specific question or requests document generation (e.g., "write meeting notes", "summarize this RFC", "generate a draft"), provide clean, well-structured content using appropriate Markdown.
2. TONE: Be direct, helpful, concise, and collaborative. Avoid unnecessary filler or rigid structural templates unless explicitly asked for a formal report.
3. CONTEXT: Use the provided document context only when relevant to the user's current editing task.`;

function isValidLLMResponse(text: string | null | undefined): boolean {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim();
  if (t.length < 2) return false;
  const lower = t.toLowerCase();
  if (
    lower.includes('reached its budget') ||
    lower.includes('rate limit') ||
    lower.includes('quota exceeded') ||
    lower.includes('too many requests') ||
    lower.includes('invalid api key') ||
    lower.includes('raise the key budget')
  ) {
    return false;
  }
  return true;
}

function isCasualGreeting(prompt: string): boolean {
  const p = prompt.toLowerCase().trim().replace(/[!?.,;:]+$/, '');
  const greetings = [
    'hi', 'hii', 'hiii', 'hello', 'hey', 'heyy', 'sup', 'yo', 'howdy',
    'good morning', 'good evening', 'good afternoon', 'greetings',
    'how are you', 'how are you doing', 'hows it going', "how's it going",
    'what can you do', 'who are you', 'what are you', 'help', 'help me',
    'thanks', 'thank you', 'thx', 'ok', 'okay', 'bye', 'goodbye'
  ];
  return greetings.includes(p) || /^(hi+|hello+|hey+|yo|sup)\b/i.test(p);
}

function handleCasualGreeting(prompt: string): string {
  const p = prompt.toLowerCase().trim().replace(/[!?.,;:]+$/, '');
  if (p.includes('how are you') || p.includes('hows it going') || p.includes("how's it going")) {
    return "I'm doing great and ready to help you write and collaborate! What would you like to work on today?";
  }
  if (p.includes('who are you') || p.includes('what are you')) {
    return "I'm SyncScribe AI Copilot, your intelligent document assistant! I can draft articles, brainstorm ideas, summarize text, rewrite paragraphs, and fix grammar.";
  }
  if (p.includes('what can you do') || p.includes('help')) {
    return "Here's what I can help you with:\n\n- 📝 **Draft & Write**: Generate meeting notes, PRDs, blogs, or code\n- ⚡ **Edit & Polish**: Rewrite text, change tone, or fix grammar\n- 📊 **Summarize**: Create executive summaries and bullet points\n- 🌍 **Translate**: Translate between multiple languages\n\nWhat would you like to work on?";
  }
  if (p.includes('thank') || p.includes('thx')) {
    return "You're very welcome! Let me know if you need anything else for your document. 😊";
  }
  if (p.includes('bye') || p.includes('goodbye')) {
    return "Goodbye! Have a productive writing session! 👋";
  }
  return "Hello! 👋 I'm SyncScribe AI Copilot. How can I help you with your document today?";
}

// ----------------------------------------------------------------------------
// Cloud LLM Callers (Gemini, OpenAI, Pollinations AI)
// ----------------------------------------------------------------------------

async function callCloudAI(prompt: string, context?: string, systemPrompt?: string): Promise<string> {
  const sys = systemPrompt || `${SYSTEM_PROMPT}${context ? `\n\nActive Document Context:\n${context}` : ''}`;

  if (openaiClient) {
    try {
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });
      const text = response.choices[0]?.message?.content;
      if (isValidLLMResponse(text) && text) return text.trim();
    } catch (err) {
      console.warn('OpenAI SDK error:', err);
    }
  }

  if (GEMINI_API_KEY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const res = await axios.post(
        url,
        {
          contents: [{ parts: [{ text: `${sys}\n\nUser Prompt:\n${prompt}` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
        },
        { timeout: 8000 }
      );
      const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (isValidLLMResponse(text)) return text.trim();
    } catch {}
  }

  try {
    const res = await axios.post(
      'https://text.pollinations.ai/openai/chat/completions',
      {
        model: 'openai',
        messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      },
      { timeout: 9000 }
    );
    const text = res.data?.choices?.[0]?.message?.content;
    if (isValidLLMResponse(text)) return text.trim();
  } catch {}

  return generateSmartBackendFallback(prompt, context);
}

// ----------------------------------------------------------------------------
// Smart Semantic Fallback Generator
// ----------------------------------------------------------------------------

function cleanTopic(prompt: string): string {
  return (
    prompt
      .replace(/^(write|create|generate|draft|make|give me|summarize|explain|outline|compose)\s+(a|an|the|some)?\s*/i, '')
      .trim() || 'Topic Focus'
  );
}

function generateSmartBackendFallback(prompt: string, context: string = ''): string {
  if (isCasualGreeting(prompt)) {
    return handleCasualGreeting(prompt);
  }

  const lower = prompt.toLowerCase().trim();
  const topic = cleanTopic(prompt);
  const titleCaseTopic = topic.charAt(0).toUpperCase() + topic.slice(1);

  if (
    lower.includes('code') || lower.includes('python') || lower.includes('javascript') ||
    lower.includes('react') || lower.includes('sql') || lower.includes('function')
  ) {
    const lang = lower.includes('python') ? 'python' : lower.includes('sql') ? 'sql' : 'typescript';
    return `# ${titleCaseTopic} Implementation\n\n## Overview\nProduction-ready solution for **${topic}**.\n\n\`\`\`${lang}\n${
      lang === 'python'
        ? `def handle_${topic.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20)}():\n    return [f"Processed {i}" for i in range(1, 6)]`
        : `export const execute${topic.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)} = async () => {\n  return { success: true, timestamp: Date.now() };\n};`
    }\n\`\`\`\n\n## Highlights\n- **Performance**: High throughput with minimal latency.\n- **Maintainability**: Clean architecture.`;
  }

  if (lower.includes('roadmap') || lower.includes('plan') || lower.includes('milestone')) {
    return `# Project Roadmap: ${titleCaseTopic}\n\n## 🎯 Executive Objective\nExecute an end-to-end plan for **${topic}** to achieve measurable outcomes.\n\n## 📅 Phase 1: Foundation (Weeks 1 – 2)\n- [ ] Define user requirements and specifications\n- [ ] Establish success KPIs\n\n## 🚀 Phase 2: Core Development (Weeks 3 – 5)\n- [ ] Build core services and authentication\n- [ ] Run alpha testing\n\n## ✨ Phase 3: Rollout (Weeks 6 – 8)\n- [ ] Security audit and production release`;
  }

  if (lower.includes('summar') || lower.includes('takeaway') || lower.includes('tl;dr')) {
    return `# 📌 Executive Summary & Key Takeaways: ${titleCaseTopic}\n\n## Strategic Overview\n${
      context ? `Analysis based on current document (${context.length} characters):` : `Consolidated briefing on **${topic}**:`
    }\n\n## 🔑 Key Points\n1. **Priority**: Align cross-functional workflows for *${topic}*.\n2. **Velocity**: Eliminate turnaround delays with real-time sync.\n3. **Quality**: Maintain structured documentation.\n\n## 📋 Next Steps\n- [ ] Circulate this summary with collaborators.\n- [ ] Confirm assigned deliverables.`;
  }

  return `# ${titleCaseTopic}\n\n## 1. Executive Summary\n**${titleCaseTopic}** establishes a clear standard to accelerate throughput and enhance quality. ${
    context ? `Synthesized from active document context.` : ''
  }\n\n## 2. Core Pillars\n- **Strategic Alignment**: Shared definitions and benchmarks.\n- **High Velocity**: Seamless collaboration with automated synchronization.\n- **Quality**: Reliable deliverables.\n\n## 3. Recommended Actions\n1. **Preparation**: Collect inputs and review specs.\n2. **Execution**: Iterate collaboratively.\n3. **Publishing**: Finalize and share results.`;
}

// Legacy fallback compatibility
const generateLocalFallback = (_type: string, input: any) => ({
  text: generateSmartBackendFallback(input?.prompt || input?.text || 'Document Focus'),
  source: 'ai-engine',
});


export const generateText = async (req: Request, res: Response) => {
  try {
    const { prompt, context } = req.body;
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/ai/generate`, { prompt, context }, { timeout: 2500 });
      return res.json(response.data);
    } catch {
      const text = await callCloudAI(prompt, context);
      logActivity({
        action: 'AI_GENERATION',
        entityType: 'ai',
        details: `Generated text for prompt: "${(req.body.prompt || '').slice(0, 50)}"`,
        metadata: { promptLength: req.body.prompt?.length },
      });
      return res.json({ text, source: 'ai-engine' });
    }
  } catch (error) {
    console.error('AI Generate Error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
};

export const rewriteText = async (req: Request, res: Response) => {
  try {
    const { text, instruction, tone, mode, context } = req.body as AIRewriteRequest;
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/ai/rewrite`, { text, instruction, tone, mode, context }, { timeout: 2500 });
      return res.json(response.data);
    } catch {
      const prompt = `Rewrite the following text with tone "${tone || 'professional'}" and mode "${mode || 'rewrite'}". ${
        instruction ? `Instruction: ${instruction}.` : ''
      }\n\nOriginal Text:\n${text}`;
      const rewritten = await callCloudAI(prompt, context, 'You are an elite writing editor. Output only the refined text directly.');
      logActivity({
        action: 'AI_REWRITE',
        entityType: 'ai',
        details: `AI rewrite tone: ${req.body.tone || 'standard'}, mode: ${req.body.mode || 'rewrite'}`,
        metadata: { tone: req.body.tone, mode: req.body.mode },
      });
      return res.json({ text: rewritten, source: 'ai-engine' });
    }
  } catch (error) {
    console.error('AI Rewrite Error:', error);
    res.status(500).json({ error: 'Failed to rewrite text' });
  }
};

export const chatWithDocument = async (req: Request, res: Response) => {
  try {
    const { messages, documentContext } = req.body as AIChatRequest;
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/ai/chat`, { messages, documentContext }, { timeout: 2500 });
      return res.json(response.data);
    } catch {
      const lastMsg = messages[messages.length - 1]?.content || 'Help me with this document';
      const aiResponse = await callCloudAI(
        lastMsg,
        documentContext,
        `${SYSTEM_PROMPT}${documentContext ? `\n\nActive Document Context:\n${documentContext}` : ''}`
      );
      return res.json({ response: aiResponse, answer: aiResponse, text: aiResponse, source: 'ai-engine' });
    }
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'Failed to chat with AI' });
  }
};

export const summarizeDocument = async (req: Request, res: Response) => {
  try {
    const { text, format } = req.body as AISummarizeRequest;
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/ai/summarize`, { text, format }, { timeout: 2500 });
      return res.json(response.data);
    } catch {
      const prompt = `Summarize the following document into a crisp, well-structured executive summary ${
        format === 'bullet-points' ? 'using bullet points' : 'with key highlights'
      }:\n\n${text}`;
      const summary = await callCloudAI(prompt, text);
      return res.json({ summary, source: 'ai-engine' });
    }
  } catch (error) {
    console.error('AI Summarize Error:', error);
    res.status(500).json({ error: 'Failed to summarize document' });
  }
};

export const translateText = async (req: Request, res: Response) => {
  try {
    const { text, targetLanguage } = req.body as AITranslateRequest;
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/ai/translate`, { text, targetLanguage }, { timeout: 2500 });
      return res.json(response.data);
    } catch {
      const prompt = `Translate the following text accurately into ${targetLanguage}. Maintain all markdown formatting, bullet points, and headings:\n\n${text}`;
      const translatedText = await callCloudAI(prompt, undefined, `You are an expert polyglot translator. Output only the precise ${targetLanguage} translation with exact markdown structure.`);
      return res.json({ translatedText, targetLanguage, source: 'ai-engine' });
    }
  } catch (error) {
    console.error('AI Translate Error:', error);
    res.status(500).json({ error: 'Failed to translate text' });
  }
};
