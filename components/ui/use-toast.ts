import { Alert } from 'react-native';

export type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export const useToast = () => {
  return {
    toast: ({ title, description, variant = 'default' }: ToastProps) => {
      Alert.alert(
        title || '',
        description || '',
        [{ text: 'OK' }],
        { cancelable: true }
      );
    },
  };
}; 