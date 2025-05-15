
// Re-export the toast implementation from Sonner
import { toast } from "sonner";

export { toast };

// Export a useToast hook for compatibility with existing code
export const useToast = () => {
  return {
    toast,
    // For compatibility with existing code that uses dismiss
    dismiss: (toastId?: string) => {
      if (toastId) {
        toast.dismiss(toastId);
      } else {
        toast.dismiss();
      }
    }
  };
};
