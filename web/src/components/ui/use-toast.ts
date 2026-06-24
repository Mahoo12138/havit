import { toast } from 'sonner';

function useToast() {
  return {
    show: (message: string) => toast(message),
  };
}

export { useToast };
