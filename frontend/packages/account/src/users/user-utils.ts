/**
 * User Utility Functions
 *
 * @author Phanny
 */

import type { User } from "../types";

/**
 * Get display name for a user, with comprehensive fallback logic.
 * 
 * This function provides a consistent way to display user names across the application.
 * It tries multiple fields in order of preference:
 * 1. firstName + lastName (full name)
 * 2. firstName only
 * 3. lastName only
 * 4. username
 * 5. email (local part before @)
 * 6. "Unknown User" as final fallback
 * 
 * @param user - The user object
 * @returns A display name string
 */
export const getUserDisplayName = (user: User): string => {
    if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
        return user.firstName;
    }
    if (user.lastName) {
        return user.lastName;
    }
    if (user.username) {
        return user.username;
    }
    if (user.email) {
        const [local] = user.email.split("@");
        return local || user.email;
    }
    return "Unknown User";
};

