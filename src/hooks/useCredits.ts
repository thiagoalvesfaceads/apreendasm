import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const CREDIT_COSTS = {
  "generate-content": {
    google: 0,
    openai: 5,
    anthropic: 6,
  },
  "generate-images": 36, // per image
  "regenerate-field": {
    google: 1,
    openai: 1,
    anthropic: 1,
  },
} as const;

export function estimateCost(
  aiProvider: string,
  generateImages: boolean,
  imageCount: number
): number {
  const textCost =
    CREDIT_COSTS["generate-content"][
      aiProvider as keyof typeof CREDIT_COSTS["generate-content"]
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
