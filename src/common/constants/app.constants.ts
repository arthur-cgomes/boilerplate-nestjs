export const APP_CONSTANTS = {
  JWT: {
    STRATEGY: 'jwt',
    DEFAULT_EXPIRATION: 7200,
    REFRESH_EXPIRATION: 604800, // 7 days
  },
  PAGINATION: {
    DEFAULT_TAKE: 10,
    DEFAULT_SKIP: 0,
    MAX_TAKE: 100,
    MIN_TAKE: 1,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    SALT_ROUNDS: 10,
  },
  RATE_LIMIT: {
    TTL: 60000, // 1 minute
    LIMIT: 100, // requests per TTL
    LOGIN_TTL: 60000,
    LOGIN_LIMIT: 5,
  },
  TIMEOUT: {
    DEFAULT: 30000, // 30 seconds
  },
  RESET_PASSWORD: {
    TOKEN_EXPIRATION: 3600000, // 1 hour in milliseconds
  },
  CACHE: {
    FEATURE_FLAG_TTL: 60000, // 1 minute
    USER_TTL: 60000, // 1 minute
    FILE_TTL: 60000, // 1 minute
    AUDIT_TTL: 300000, // 5 minutes (dados imutáveis)
  },
  FILE_UPLOAD: {
    MAX_FILES_PER_BATCH: 10,
    MAX_FILE_SIZE: 10485760, // 10MB in bytes
    SIGNED_URL_EXPIRATION: 3600, // 1 hour in seconds
  },
  SENSITIVE_FIELDS: [
    'password',
    'passwordHash',
    'secret',
    'apiKey',
    'privateKey',
    'token',
    'accessToken',
    'refreshToken',
  ],
} as const;

export const ERROR_MESSAGES = {
  USER: {
    NOT_FOUND: 'Usuario nao encontrado',
    EMAIL_EXISTS: 'Usuario com este e-mail ja existe',
    EMAIL_DELETED: 'Este e-mail pertence a uma conta excluida',
    INVALID_CREDENTIALS: 'Credenciais invalidas',
    INVALID_PASSWORD: 'Senha invalida',
    UNAUTHORIZED: 'Nao autorizado',
    FORBIDDEN: 'Sem permissao para acessar este recurso',
  },
  AUTH: {
    INVALID_TOKEN: 'Token inválido',
    TOKEN_EXPIRED: 'Token expirado',
    RESET_TOKEN_INVALID: 'Token de recuperação inválido ou expirado',
    RESET_TOKEN_SENT: 'Token de recuperação enviado para o e-mail',
    SOCIAL_LOGIN_NOT_CONFIGURED: 'Login social não está configurado',
    INVALID_SOCIAL_TOKEN: 'Token do provedor social inválido ou expirado',
  },
  VALIDATION: {
    INVALID_EMAIL: 'E-mail inválido',
    WEAK_PASSWORD:
      'Senha deve ter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais',
    REQUIRED_FIELD: 'Campo obrigatório',
  },
  GENERAL: {
    INTERNAL_ERROR: 'Erro interno do servidor',
    REQUEST_TIMEOUT: 'Requisição excedeu o tempo limite',
    TOO_MANY_REQUESTS: 'Muitas requisições. Tente novamente mais tarde.',
  },
  FILE: {
    NOT_FOUND: 'Arquivo não encontrado',
    STORAGE_NOT_CONFIGURED: 'Storage não está configurado',
    SIZE_EXCEEDED: 'Arquivo excede o tamanho máximo permitido de {size}',
    INVALID_TYPE: 'Tipo de arquivo não permitido',
  },
  AUDIT: {
    LOG_CREATED: 'Log de auditoria criado',
    LOG_NOT_FOUND: 'Log de auditoria não encontrado',
  },
  FEATURE_FLAG: {
    NOT_FOUND: 'Feature flag não encontrada',
    KEY_EXISTS: 'Feature flag com esta chave já existe',
    NOT_ENABLED: 'Recurso não disponível',
  },
} as const;

export const SUCCESS_MESSAGES = {
  USER: {
    CREATED: 'Usuário criado com sucesso',
    UPDATED: 'Usuário atualizado com sucesso',
    DELETED: 'Usuário removido com sucesso',
  },
  AUTH: {
    PASSWORD_RESET: 'Senha alterada com sucesso',
    LOGOUT: 'Logout realizado com sucesso',
    RESET_TOKEN_SENT:
      'Se o e-mail estiver cadastrado, você receberá as instruções de recuperação',
  },
} as const;
