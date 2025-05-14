import { Toast, toast as sonnerToast, ToastT } from "sonner";

// Define the toast options type to match what sonner expects
type ToastProps = React.ComponentProps<typeof Toast>;
type ToastOptions = Omit<ToastT, "id" | "title" | "description" | "icon"> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive" | "success" | "warning";
};

// Define the ID type for dismiss function
type ToastIDType = number | string;

const useToast = () => {
  // Create a wrapped version of toast that handles our custom options
  const toast = (options: ToastOptions) => {
    const { title, description, variant, ...restOptions } = options;
    
    // Convert our variant to sonner's style if needed
    let toastFn = sonnerToast;
    if (variant === "destructive") {
      toastFn = sonnerToast.error;
    } else if (variant === "success") {
      toastFn = sonnerToast.success;
    } else if (variant === "warning") {
      toastFn = sonnerToast.warning;
    }
    
    // If title and description are both provided, use the rich format
    if (title && description) {
      return toastFn(title, {
        description,
        ...restOptions
      });
    }
    
    // Otherwise just use the simple format with title only
    return toastFn(title || description || "", restOptions);
  };
  
  return {
    toast,
    dismiss: (id: ToastIDType) => sonnerToast.dismiss(id),
    success: (message: string, options?: Partial<ToastOptions>) => 
      sonnerToast.success(message, options),
    error: (message: string, options?: Partial<ToastOptions>) => 
      sonnerToast.error(message, options),
    warning: (message: string, options?: Partial<ToastOptions>) => 
      sonnerToast.warning(message, options),
    info: (message: string, options?: Partial<ToastOptions>) => 
      sonnerToast.info(message, options),
  };
};

// Export the toast function directly
const toast = (options: ToastOptions) => {
  const { title, description, variant, ...restOptions } = options;
  
  let toastFn = sonnerToast;
  if (variant === "destructive") {
    toastFn = sonnerToast.error;
  } else if (variant === "success") {
    toastFn = sonnerToast.success;
  } else if (variant === "warning") {
    toastFn = sonnerToast.warning;
  }
  
  if (title && description) {
    return toastFn(title, {
      description,
      ...restOptions
    });
  }
  
  return toastFn(title || description || "", restOptions);
};

export {
  useToast,
  toast
};

export type { ToastProps, ToastOptions };
