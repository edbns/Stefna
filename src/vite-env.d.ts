/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENROUTER_API_KEY?: string;
  readonly VITE_HUGGINGFACE_API_KEY?: string;
  readonly VITE_DEEPINFRA_API_KEY?: string;
  readonly VITE_TOGETHER_API_KEY?: string;
  readonly VITE_REPLICATE_API_KEY?: string;
  readonly VITE_GROQ_API_KEY?: string;
  readonly VITE_YOUTUBE_API_KEY?: string;
  readonly VITE_NEWSDATA_API_KEY?: string;
  readonly VITE_LASTFM_API_KEY?: string;
  readonly VITE_REDDIT_CLIENT_ID?: string;
  readonly VITE_REDDIT_CLIENT_SECRET?: string;
  readonly VITE_RESEND_API_KEY?: string;
  readonly DEV?: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 