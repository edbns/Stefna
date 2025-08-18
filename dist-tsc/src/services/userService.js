// User Service - Handles user data through Netlify Functions with Neon backend
class UserService {
    constructor() {
        Object.defineProperty(this, "baseUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    }
    async getUser(userId) {
        try {
            const response = await fetch(`${this.baseUrl}/.netlify/functions/get-user-profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch user: ${response.status}`);
            }
            const data = await response.json();
            return this.transformUser(data.profile);
        }
        catch (error) {
            console.error('Error fetching user:', error);
            return null;
        }
    }
    async updateUser(userId, updates) {
        try {
            const response = await fetch(`${this.baseUrl}/.netlify/functions/update-profile`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            if (!response.ok) {
                throw new Error(`Failed to update user: ${response.status}`);
            }
            const data = await response.json();
            return this.transformUser(data.profile);
        }
        catch (error) {
            console.error('Error updating user:', error);
            return null;
        }
    }
    getAuthToken() {
        // Get token from localStorage or wherever you store it
        return localStorage.getItem('auth_token') || '';
    }
    transformUser(userData) {
        return {
            id: userData.user_id || userData.id,
            email: userData.email,
            name: userData.display_name || userData.name,
            avatarUrl: userData.avatar_url,
            // Simplified: All users get the same limits
            dailyLimit: 30,
            weeklyLimit: 150
        };
    }
}
export default new UserService();
