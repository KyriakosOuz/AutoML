
// Type definitions for Google reCAPTCHA API
interface Window {
  grecaptcha: {
    ready: (callback: () => void) => void;
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
    getResponse: (widgetId?: number) => string;
    render: (container: string | HTMLElement, parameters: object) => number;
    reset: (widgetId?: number) => void;
  };
}
