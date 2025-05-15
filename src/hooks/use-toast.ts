
// Re-export the toast implementation from Sonner
import { toast as sonnerToast, type ExternalToast } from "sonner";
import { ReactNode } from "react";

// Define types that match both old and new toast APIs
export type ToastProps = {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  variant?: "default" | "destructive" | "success" | "warning";
  duration?: number;
};

// Create a wrapper function that adapts between the two APIs
const toast = (props: ToastProps | string) => {
  // If props is a string, use it as the message
  if (typeof props === 'string') {
    return sonnerToast(props);
  }

  // Extract properties
  const { title, description, variant, duration, action } = props;

  // If there's both title and description, format accordingly
  if (title && description) {
    return sonnerToast(title, {
      description,
      action,
      duration,
    });
  }
  
  // If there's only a title, use it as the primary message
  return sonnerToast(title || description || "", {
    action,
    duration,
  });
};

// Add success, error, info, warning methods to the toast function
toast.success = (message: string, options?: Omit<ExternalToast, "id">) => {
  return sonnerToast.success(message, options);
};

toast.error = (message: string, options?: Omit<ExternalToast, "id">) => {
  return sonnerToast.error(message, options);
};

toast.info = (message: string, options?: Omit<ExternalToast, "id">) => {
  return sonnerToast(message, { ...options });
};

toast.warning = (message: string, options?: Omit<ExternalToast, "id">) => {
  return sonnerToast.warning(message, options);
};

toast.success.toString = () => 'toast.success';
toast.error.toString = () => 'toast.error';
toast.info.toString = () => 'toast.info';
toast.warning.toString = () => 'toast.warning';

// Export our compatible toast API
export { toast };

// Dummy toasts array for compatibility
const toasts: any[] = [];

// Export a useToast hook for compatibility with existing code
export const useToast = () => {
  return {
    toast,
    // For compatibility with existing code that uses dismiss
    dismiss: (toastId?: string) => {
      if (toastId) {
        sonnerToast.dismiss(toastId);
      } else {
        sonnerToast.dismiss();
      }
    },
    // Add empty toasts array for compatibility with old code
    toasts
  };
};
