

# Fix: Error Handling + Rate Limiting

## Problem
Two issues identified:

1. **Generic error message**: When the edge function returns a non-2xx response (like 429), `supabase.functions.invoke` throws a generic "Edge Function returned a non-2xx status code" instead of showing the actual error (RATE_LIMITED). This is because the Supabase JS client doesn't parse the response body on non-2xx responses — it puts the error in `fnError` and `data` is null.

2. **Google API rate limit**: Your Google AI API key is hitting rate limits. This could be because the free tier has low RPM (requests per minute) limits.

## Changes

### 1. Edge Function — Return 200 with error in body (all 3 functions)
Instead of returning HTTP 429/402/500, always return HTTP 200 with the error in the JSON body. This way the Supabase client will parse the body correctly and the frontend can show proper error messages.

**Files**: `generate-content/index.ts`, `generate-images/index.ts`, `regenerate-field/index.ts`

Change the catch block and credit error responses to always return status 200 with `{ error: "..." }` in the body. Example:
```typescript
// Before (broken):
return new Response(JSON.stringify({ error: msg }), { status: 429, ... });

// After (works):
return new Response(JSON.stringify({ error: msg }), { status: 200, ... });
```

### 2. Frontend — Better error messages
Update `useContentGeneration.ts` to also handle `INSUFFICIENT_CREDITS` error code from the edge function and show a user-friendly message in Portuguese.

### 3. Add retry logic for rate limiting (optional improvement)
Add a simple 1-retry with delay in the Google AI caller inside the edge function to handle transient 429s.

## Summary
- 3 edge functions updated (return 200 on errors)
- 1 frontend hook updated (better error messages)
- User will see "Limite de requisições atingido" instead of generic error

