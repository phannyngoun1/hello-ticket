/**
 * User Service Configuration
 * 
 * This file configures the UserService from @truths/account package
 * to work with our web app's API configuration.
 * 
 * Note: This file is now primarily used for the GlobalUserProvider.
 * Individual components should use the useUserService hook instead.
 */

import { UserService, type UserServiceConfig } from '@truths/account';
import { api } from '@truths/api';
import { API_CONFIG } from '@truths/config';

// Configure UserService with our API client and endpoints
const userServiceConfig: UserServiceConfig = {
    apiClient: api,
    endpoints: {
        users: API_CONFIG.ENDPOINTS.USERS.FETCH,
    },
};

// Create and export the UserService instance for global use
export const userService = new UserService(userServiceConfig);

// Export the UserService instance for direct use (if needed)
export default userService;

