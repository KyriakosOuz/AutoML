
// Re-export the toast implementation from Sonner
import { toast as sonnerToast } from "sonner";

// Define types that match both old and new toast APIs
type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
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

  // Map variant to Sonner's types
  let type: "success" | "error" | "warning" | "info" | undefined;
  switch (variant) {
    case "destructive":
      type = "error";
      break;
    case "success":
      type = "success";
      break;
    case "warning":
      type = "warning";
      break;
    default:
      type = "info";
  }

  // If there's both title and description, format accordingly
  if (title && description) {
    return sonnerToast(title, {
      description,
      action,
      duration,
      type,
    });
  }
  
  // If there's only a title, use it as the primary message
  return sonnerToast(title || description || "", {
    action,
    duration,
    type,
  });
};

// Export our compatible toast API
export { toast };

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
    }
  };
};
