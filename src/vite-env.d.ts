/// <reference types="vite/client" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="webworker" />

interface ImportMetaEnv {
  readonly VITE_AIML_API_KEY: string
  readonly VITE_RESEND_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 