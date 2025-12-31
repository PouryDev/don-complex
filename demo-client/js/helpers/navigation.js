// Navigation helper to allow navigation from outside React context
// (e.g., in axios interceptors)

let navigateFunction = null;

/**
 * Register the navigate function from React Router
 * This should be called once when the app initializes
 */
export const registerNavigate = (navigate) => {
    navigateFunction = navigate;
};

/**
 * Navigate to a route programmatically
 * This can be used from anywhere, including axios interceptors
 */
export const navigateTo = (path) => {
    if (navigateFunction) {
        navigateFunction(path);
    } else {
        // Fallback to window.location if navigate is not registered yet
        // This should rarely happen, but provides a safety net
        console.warn('Navigate function not registered, falling back to window.location');
        window.location.href = path;
    }
};

