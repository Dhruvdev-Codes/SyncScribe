from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class GenerateRequest(BaseModel):
    prompt: str
    context: Optional[str] = ""
    max_tokens: Optional[int] = 500

class GenerateResponse(BaseModel):
    text: str
    source: str = "ai-service"

class RewriteRequest(BaseModel):
    text: str
    instruction: Optional[str] = None
    tone: Optional[str] = "professional"
    mode: Optional[str] = "rewrite"
    context: Optional[str] = ""

class RewriteResponse(BaseModel):
    text: str
    source: str = "ai-service"

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    documentContext: Optional[str] = ""

class ChatResponse(BaseModel):
    response: str
    source: str = "ai-service"

class SummarizeRequest(BaseModel):
    text: str
    format: Optional[str] = "paragraph"

class SummarizeResponse(BaseModel):
    summary: str
    source: str = "ai-service"

class TranslateRequest(BaseModel):
    text: str
    targetLanguage: str

class TranslateResponse(BaseModel):
    translatedText: str
    targetLanguage: str
    source: str = "ai-service"
