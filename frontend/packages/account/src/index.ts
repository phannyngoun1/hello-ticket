/**
 * @truths/account
 * 
 * A comprehensive account management package for handling users, roles, and profiles.
 */

// Registry
export * from './registry';
export * from './types';

// User Management
export * from './users';

// Role Management
export * from './roles';

// Group Management
export * from './groups';

// Unified Management Page
export * from './user-management-page';

// Profile Management
export * from './profile';

// Register all account components
import { registerAccountComponent } from './registry';

// User components
import { UserList, userListMetadata } from './users/user-list/user-list';
import { UserDetail, userDetailMetadata } from './users/user-detail';
import { CreateUser, createUserMetadata } from './users/user-entry/create-user';
import { EditUser, editUserMetadata } from './users/user-entry/edit-user';
import { EditUserDialog, editUserDialogMetadata } from './users/user-entry/edit-user-dialog';

// Role components
import { RoleList, roleListMetadata } from './roles/role-list';
import { RoleDetail, roleDetailMetadata } from './roles/role-detail';
import { AssignRole, assignRoleMetadata } from './roles/assign-role';

// Profile components
import { ProfileView, profileViewMetadata } from './profile/profile-view';
import { ProfileEdit, profileEditMetadata } from './profile/profile-edit';
import { PasswordChange, passwordChangeMetadata } from './profile/password-change';

// Auto-register all account components
registerAccountComponent('user-list', {
    Component: UserList,
    metadata: userListMetadata(),
});

registerAccountComponent('user-detail', {
    Component: UserDetail,
    metadata: userDetailMetadata(),
});

registerAccountComponent('create-user', {
    Component: CreateUser,
    metadata: createUserMetadata(),
});

registerAccountComponent('edit-user', {
    Component: EditUser,
    metadata: editUserMetadata(),
});

registerAccountComponent('edit-user-dialog', {
    Component: EditUserDialog,
    metadata: editUserDialogMetadata(),
});

registerAccountComponent('role-list', {
    Component: RoleList,
    metadata: roleListMetadata(),
});

registerAccountComponent('role-detail', {
    Component: RoleDetail,
    metadata: roleDetailMetadata(),
});

registerAccountComponent('assign-role', {
    Component: AssignRole,
    metadata: assignRoleMetadata(),
});

registerAccountComponent('profile-view', {
    Component: ProfileView,
    metadata: profileViewMetadata(),
});

registerAccountComponent('profile-edit', {
    Component: ProfileEdit,
    metadata: profileEditMetadata(),
});

registerAccountComponent('password-change', {
    Component: PasswordChange,
    metadata: passwordChangeMetadata(),
});

