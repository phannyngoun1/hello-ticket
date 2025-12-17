// Re-export types from account package for consistency
export type {
    User,
    CreateUserInput,
    UpdateUserInput,
} from '@truths/account';

// Legacy compatibility - these will be deprecated
export interface LegacyUser {
    id: number
    name: string
    email: string
    role: 'admin' | 'user' | 'guest'
    created_at?: string
    updated_at?: string
}

