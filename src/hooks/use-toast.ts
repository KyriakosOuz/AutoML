
import { Toast, toast as sonnerToast } from "sonner";

type ToastProps = React.ComponentProps<typeof Toast>;
type ToastIDType = number | string;

const useToast = () => {
  return {
    toast: sonnerToast,
    dismiss: (id: ToastIDType) => sonnerToast.dismiss(id),
    success: (message: string, options?: ToastProps) => sonnerToast.success(message, options),
    error: (message: string, options?: ToastProps) => sonnerToast.error(message, options),
    warning: (message: string, options?: ToastProps) => sonnerToast.warning(message, options),
    info: (message: string, options?: ToastProps) => sonnerToast.info(message, options),
  };
};

export {
  useToast,
  toast as toast
};

export type { ToastProps };
