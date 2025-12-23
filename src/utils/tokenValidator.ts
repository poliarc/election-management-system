/**
 * Validates if a JWT token is expired
 * @param token - JWT token string
 * @returns boolean - true if token is valid (not expired), false if expired or invalid
 */
export function isTokenValid(token: string | null): boolean {
    if (!token) return false;

    try {
        // Remove Bearer prefix if present
        const cleanToken = token.replace('Bearer ', '');

        // Parse JWT payload (base64 decode the middle part)
        const payload = JSON.parse(atob(cleanToken.split('.')[1]));

        // Check if token has expiration time
        if (!payload.exp) return true; // If no exp claim, assume valid

        // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp > currentTime;
    } catch (error) {
        // If token parsing fails, consider it invalid
        console.warn('Token validation failed:', error);
        return false;
    }
}

/**
 * Clears all authentication data and redirects to login
 */
export function handleTokenExpiration(): void {
    // Clear all auth data using direct localStorage access
    localStorage.removeItem('auth_access_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_state');

    // Redirect to login with logout parameter to trigger Redux logout
    window.location.href = '/login?logout=true';
}

/**
 * Validates the current access token and handles expiration
 * @returns boolean - true if token is valid, false if expired/invalid
 */
export function validateCurrentToken(): boolean {
    const token = localStorage.getItem('auth_access_token');

    if (!isTokenValid(token)) {
        handleTokenExpiration();
        return false;
    }

    return true;
}