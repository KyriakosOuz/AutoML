
import { toast as sonnerToast, type ToastT } from "sonner";
import { type ReactNode } from "react";

// Define the toast options type to match our supported variants
export type ToastOptions = {
  title?: ReactNode;
  description?: ReactNode;
  variant?: "default" | "destructive" | "success" | "warning";
  duration?: number;
  action?: React.ReactNode;
  [key: string]: unknown;
};

export type ToastProps = ToastOptions;

// Define the ID type for dismiss function
type ToastIDType = number | string;

// Create a simulated toast object for UI consumption
type Toast = ToastOptions & {
  id: string;
};

// Create a store for tracking active toasts
const TOAST_LIMIT = 20;
let toasts: Toast[] = [];

const useToast = () => {
  // Function to add a toast to our list
  const addToast = (options: ToastOptions): string => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...options, id };
    
    toasts = [newToast, ...toasts].slice(0, TOAST_LIMIT);
    
    const { title, description, variant, ...restOptions } = options;
    
    // Convert our variant to sonner's style if needed
    if (variant === "destructive") {
      sonnerToast.error(title as string || description as string || "", restOptions);
    } else if (variant === "success") {
      sonnerToast.success(title as string || description as string || "", restOptions);
    } else if (variant === "warning") {
      sonnerToast.warning(title as string || description as string || "", restOptions);
    } else {
      sonnerToast(title as string || description as string || "", restOptions);
    }
    
    return id;
  };
  
  // Function to remove a toast from our list
  const removeToast = (id: string) => {
    toasts = toasts.filter((toast) => toast.id !== id);
    return sonnerToast.dismiss(id);
  };
  
  return {
    toasts,
    toast: addToast,
    dismiss: removeToast,
    success: (message: string, options?: Partial<ToastOptions>) => 
      addToast({ title: message, variant: "success", ...options }),
    error: (message: string, options?: Partial<ToastOptions>) => 
      addToast({ title: message, variant: "destructive", ...options }),
    warning: (message: string, options?: Partial<ToastOptions>) => 
      addToast({ title: message, variant: "warning", ...options }),
    info: (message: string, options?: Partial<ToastOptions>) => 
      addToast({ title: message, ...options }),
  };
};

// Export the toast function directly
const toast = (options: ToastOptions): string => {
  const { toast: addToast } = useToast();
  return addToast(options);
};

// Add helper methods to the toast function to match sonner's API
toast.success = (message: string, options?: Partial<ToastOptions>) => 
  toast({ title: message, variant: "success", ...options });

toast.error = (message: string, options?: Partial<ToastOptions>) => 
  toast({ title: message, variant: "destructive", ...options });

toast.warning = (message: string, options?: Partial<ToastOptions>) => 
  toast({ title: message, variant: "warning", ...options });

toast.info = (message: string, options?: Partial<ToastOptions>) => 
  toast({ title: message, ...options });

toast.dismiss = (id: ToastIDType) => {
  toasts = toasts.filter((toast) => toast.id !== id.toString());
  return sonnerToast.dismiss(id);
};

export {
  useToast,
  toast
};
