export type ContentFormat = "reels" | "carousel";
export type ContentGoal = "discovery" | "connection" | "relationship" | "conversion";
export type AudienceAwareness = "cold" | "warm" | "hot";
export type ContentTone = "reflective" | "confrontational" | "didactic" | "emotional" | "calm_authority" | "card";
export type VisualStyle = "clean_realistic" | "editorial_premium" | "human_everyday" | "dramatic_cinematic" | "minimal_sophisticated";
export type LeadType = "offer" | "promise" | "problem_solution" | "big_secret" | "revelation" | "story";
export type SlideRole = "hook" | "tension" | "insight" | "solution" | "cta" | "development" | "deepening";
export type AIProvider = "google" | "openai" | "anthropic";

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
};

export const VISUAL_STYLE_LABELS: Record<VisualStyle, string> = {
  clean_realistic: "Clean Realista",
  editorial_premium: "Editorial Premium",
  human_everyday: "Humano Cotidiano",
  dramatic_cinematic: "Dramático Cinematográfico",
  minimal_sophisticated: "Minimalista Sofisticado",
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
};
