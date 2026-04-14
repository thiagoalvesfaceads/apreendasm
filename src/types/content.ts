export type ContentFormat = "reels" | "carousel";
export type ContentGoal = "discovery" | "connection" | "relationship" | "conversion";
export type AudienceAwareness = "cold" | "warm" | "hot";
export type ContentTone = "reflective" | "confrontational" | "didactic" | "emotional" | "calm_authority" | "card";
export type VisualStyle = "clean_realistic" | "editorial_premium" | "human_everyday" | "dramatic_cinematic" | "minimal_sophisticated" | "carrosseis_thiago";
export type LeadType = "offer" | "promise" | "problem_solution" | "big_secret" | "revelation" | "story";
export type SlideRole = "hook" | "tension" | "insight" | "solution" | "cta" | "development" | "deepening";
export type AIProvider = "google" | "openai" | "anthropic" | "minimax";
export type AIModel = "gemini-flash-lite" | "gemini-flash" | "gemini-pro" | "gpt-4o-mini" | "gpt-4o" | "claude-sonnet" | "minimax-m2";

export interface AIModelInfo {
  label: string;
  provider: AIProvider;
  apiModel: string;
  cost: number;
}

export const AI_MODEL_INFO: Record<AIModel, AIModelInfo> = {
  "gemini-flash-lite": { label: "Gemini 2.5 Flash Lite", provider: "google", apiModel: "gemini-2.5-flash-lite", cost: 0 },
  "gemini-flash": { label: "Gemini 2.5 Flash", provider: "google", apiModel: "gemini-2.5-flash", cost: 20 },
  "gemini-pro": { label: "Gemini 2.5 Pro", provider: "google", apiModel: "gemini-2.5-pro", cost: 60 },
  "gpt-4o-mini": { label: "GPT-4o Mini", provider: "openai", apiModel: "gpt-4o-mini", cost: 15 },
  "gpt-4o": { label: "GPT-4o", provider: "openai", apiModel: "gpt-4o", cost: 70 },
  "claude-sonnet": { label: "Claude Sonnet 4", provider: "anthropic", apiModel: "claude-sonnet-4-20250514", cost: 90 },
  "minimax-m2": { label: "MiniMax M2", provider: "minimax", apiModel: "MiniMax-M2.7", cost: 25 },
};

export type ImageProvider = "gemini" | "minimax";

export const IMAGE_PROVIDER_LABELS: Record<ImageProvider, string> = {
  gemini: "Google Gemini",
  minimax: "MiniMax",
};

export interface ContentInput {
  idea: string;
  format: ContentFormat;
  goal: ContentGoal;
  awareness: AudienceAwareness;
  tone: ContentTone;
  niche: string;
  offer?: string;
  cards: number;
  generate_images: boolean;
  visual_style: VisualStyle;
  ai_provider: AIProvider;
  ai_model: AIModel;
  image_provider?: ImageProvider;
}

export interface Strategy {
  pain_desire_tension: string;
  big_idea: string;
  lead_type: LeadType;
  angle: string;
  promise: string;
  cta_strategy: string;
}

export interface ReelsContent {
  title: string;
  big_idea: string;
  lead_type: LeadType;
  angle: string;
  hook: string;
  script: string;
  on_screen_text: string[];
  scene_suggestions: string[];
  caption: string;
  cta: string;
  editing_notes: string;
}

export interface CarouselSlide {
  slide_number: number;
  role: SlideRole;
  title: string;
  body: string;
  emotional_goal: string;
  visual_prompt: string;
  image_url?: string;
}

export interface CarouselContent {
  title: string;
  big_idea: string;
  lead_type: LeadType;
  angle: string;
  caption: string;
  cta: string;
  slides: CarouselSlide[];
}

export interface GeneratedContent {
  input: ContentInput;
  strategy: Strategy;
  reels?: ReelsContent;
  carousel?: CarouselContent;
  generated_at: string;
}

export const GOAL_LABELS: Record<ContentGoal, string> = {
  discovery: "Descoberta",
  connection: "Conexão",
  relationship: "Relacionamento",
  conversion: "Conversão",
};

export const AWARENESS_LABELS: Record<AudienceAwareness, string> = {
  cold: "Fria",
  warm: "Morna",
  hot: "Quente",
};

export const TONE_LABELS: Record<ContentTone, string> = {
  reflective: "Reflexivo",
  confrontational: "Confrontacional",
  didactic: "Didático",
  emotional: "Emocional",
  calm_authority: "Autoridade Calma",
  card: "Card",
};

export const VISUAL_STYLE_LABELS: Record<VisualStyle, string> = {
  clean_realistic: "Clean Realista",
  editorial_premium: "Editorial Premium",
  human_everyday: "Humano Cotidiano",
  dramatic_cinematic: "Dramático Cinematográfico",
  minimal_sophisticated: "Minimalista Sofisticado",
  carrosseis_thiago: "Carrosséis Thiago",
};

export const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  offer: "Oferta",
  promise: "Promessa",
  problem_solution: "Problema-Solução",
  big_secret: "Grande Segredo",
  revelation: "Revelação",
  story: "História",
};

export const AI_PROVIDER_LABELS: Record<AIProvider, string> = {
  google: "Google Gemini",
  openai: "OpenAI GPT-4o",
  anthropic: "Claude Sonnet",
  minimax: "MiniMax M2",
};

export const AI_MODEL_LABELS: Record<AIModel, string> = {
  "gemini-flash-lite": "Gemini Flash Lite — Grátis",
  "gemini-flash": "Gemini Flash — 20 créditos",
  "gemini-pro": "Gemini Pro — 60 créditos",
  "gpt-4o-mini": "GPT-4o Mini — 15 créditos",
  "gpt-4o": "GPT-4o — 70 créditos",
  "claude-sonnet": "Claude Sonnet 4 — 90 créditos",
  "minimax-m2": "MiniMax M2 — 25 créditos",
};
