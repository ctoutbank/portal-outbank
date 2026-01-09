// Constantes de tipos de usuário
export const USER_TYPES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ISO_PORTAL_ADMIN: 'ISO_PORTAL_ADMIN',
  USER: 'USER',
} as const;

export type UserType = typeof USER_TYPES[keyof typeof USER_TYPES];
