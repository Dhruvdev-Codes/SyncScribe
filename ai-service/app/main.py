import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.schemas import (
    GenerateRequest, GenerateResponse,
    RewriteRequest, RewriteResponse,
    ChatRequest, ChatResponse,
    SummarizeRequest, SummarizeResponse,
    TranslateRequest, TranslateResponse
)
from app.services.llm_engine import (
    generate_completion,
    rewrite_content,
    chat_assistant,
    summarize_text,
    translate_text
)

app = FastAPI(
    title="SyncScribe AI Microservice",
    description="Context-Aware AI writing, summarization, and copilot service for SyncScribe",
    version="1.0.0"
)

# CORS middleware for open communication with client and backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "syncscribe-ai-service",
        "version": "1.0.0"
    }

@app.post("/ai/generate", response_model=GenerateResponse)
async def handle_generate(req: GenerateRequest):
    try:
        text = await generate_completion(req.prompt, req.context)
        return GenerateResponse(text=text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/rewrite", response_model=RewriteResponse)
async def handle_rewrite(req: RewriteRequest):
    try:
        text = await rewrite_content(req.text, req.instruction, req.tone, req.mode)
        return RewriteResponse(text=text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/chat", response_model=ChatResponse)
async def handle_chat(req: ChatRequest):
    try:
        msg_dicts = [m.model_dump() for m in req.messages]
        res = await chat_assistant(msg_dicts, req.documentContext)
        return ChatResponse(response=res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/summarize", response_model=SummarizeResponse)
async def handle_summarize(req: SummarizeRequest):
    try:
        summary = await summarize_text(req.text, req.format)
        return SummarizeResponse(summary=summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/translate", response_model=TranslateResponse)
async def handle_translate(req: TranslateRequest):
    try:
        translated = await translate_text(req.text, req.targetLanguage)
        return TranslateResponse(translatedText=translated, targetLanguage=req.targetLanguage)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
