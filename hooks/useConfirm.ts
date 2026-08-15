import { useStore } from '../store/useStore';
import { ConfirmationOptions } from '../core/types';
import { triggerHaptic } from '../core/utils';

export const useConfirm = () => {
  const requestConfirmation = useStore((s) => s.requestConfirmation);

  const confirm = (options: ConfirmationOptions) => {
    // Automatically trigger haptic feedback for critical actions
    if (options.variant === 'danger') {
      triggerHaptic('error');
    } else {
      triggerHaptic('warning');
    }
    requestConfirmation(options);
  };

  return confirm;
};
