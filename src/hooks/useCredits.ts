import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const CREDIT_COSTS = {
  "generate-content": {
    "gemini-flash-lite": 0,
    "gemini-flash": 20,
    "gemini-pro": 60,
    "gpt-4o-mini": 15,
    "gpt-4o": 70,
    "claude-sonnet": 90,
  },
  "generate-images": 80, // per image
  "regenerate-field": 8, // flat cost per regeneration
} as const;

export function estimateCost(
  aiModel: string,
  generateImages: boolean,
  imageCount: number
): number {
  const textCost =
    CREDIT_COSTS["generate-content"][
      aiModel as keyof typeof CREDIT_COSTS["generate-content"]
    ] ?? 0;
  const imageCost = generateImages
    ? imageCount * CREDIT_COSTS["generate-images"]
    : 0;
  return textCost + imageCost;
}

export function useCredits() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    if (!user) {
      setBalance(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", user.id)
      .single();
    setBalance(data?.balance ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, refresh: fetchBalance, setBalance };
}
