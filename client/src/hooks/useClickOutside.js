import { useEffect } from 'react';

/**
 * Fires `handler` whenever a click/touch event occurs outside the element
 * referenced by `ref`. Use this instead of the fragile onBlur+setTimeout
 * pattern for dropdowns and modals.
 */
export function useClickOutside(ref, handler) {
    useEffect(function () {
        function listener(event) {
            if (!ref.current || ref.current.contains(event.target)) return;
            handler(event);
        }

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return function () {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
}

