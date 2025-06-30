// Tipos para o módulo 'next'
declare module 'next' {
  // Adicione aqui as definições de tipo necessárias
}

// Tipos para o módulo 'next/navigation'
declare module 'next/navigation' {
  export function useRouter(): {
    push: (url: string) => void;
    replace: (url: string) => void;
    back: () => void;
    forward: () => void;
    refresh: () => void;
    prefetch: (url: string) => void;
  };
}

// Tipos para o módulo 'next/font/google'
declare module 'next/font/google' {
  import { NextFont } from 'next/dist/compiled/@next/font';
  
  export function Inter(options?: {
    weight?: string | number | Array<string | number>;
    style?: string | Array<string>;
    subsets?: Array<string>;
    display?: string;
    variable?: string;
    preload?: boolean;
    fallback?: string[];
    adjustFontFallback?: boolean | string;
    axes?: string[];
  }): NextFont;
}
