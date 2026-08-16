import { STORAGE_KEYS } from '../constants';

/**
 * Dispatches a feedback event for visual ripple on mobile/desktop,
 * and triggers device hardware vibration when available and permitted in user settings.
 */
export function triggerHaptic(type: 'success' | 'warning' | 'error' | 'click' | 'tick') {
  // 1. Dispatch Visual Event (Works on iOS/Desktop where vibration fails)
  // We always dispatch this, UI listens and decides if it shows based on user settings
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('feedback-trigger', { detail: type }));
  }

  // 2. Hardware Vibration (Android Only)
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;

  let isTactileOn = true;
  let isSessionOn = true;

  try {
    isTactileOn = localStorage.getItem(STORAGE_KEYS.HAPTIC_TACTILE) !== 'false';
    isSessionOn = localStorage.getItem(STORAGE_KEYS.HAPTIC_SESSION) !== 'false';
  } catch {
    // Fail gracefully if localStorage is restricted
  }

  if ((type === 'click' || type === 'tick') && !isTactileOn) return;
  if ((type === 'success' || type === 'warning' || type === 'error') && !isSessionOn) return;

  try {
    switch (type) {
      case 'success':
        navigator.vibrate([50, 50, 50]);
        break;
      case 'warning':
        navigator.vibrate([200, 100, 200, 100, 500]);
        break;
      case 'error':
        navigator.vibrate([50, 50, 50, 50, 100]);
        break;
      case 'click':
        navigator.vibrate(10);
        break;
      case 'tick':
        navigator.vibrate(5);
        break;
    }
  } catch {
    // Silently fail on blocked/unsupported devices
  }
}
