
// Type definitions for CAPTCHA APIs (Google reCAPTCHA and hCaptcha)
interface Window {
  grecaptcha: {
    ready: (callback: () => void) => void;
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
    getResponse: (widgetId?: number) => string;
    render: (container: string | HTMLElement, parameters: object) => number;
    reset: (widgetId?: number) => void;
  };
  hcaptcha: {
    render: (container: string | HTMLElement, parameters: object) => number;
    remove: (widgetId: number) => void;
    reset: (widgetId?: number) => void;
    execute: (widgetId?: number) => Promise<string>;
    getResponse: (widgetId?: number) => string;
  };
}
