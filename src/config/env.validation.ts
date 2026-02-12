import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('local', 'development', 'production', 'test')
    .default('local'),
  HOST: Joi.string().default('0.0.0.0'),
  PORT: Joi.number().default(3000),

  AUTH_SECRET: Joi.string().required().min(32).messages({
    'any.required': 'AUTH_SECRET e obrigatorio para seguranca da aplicacao',
    'string.min': 'AUTH_SECRET deve ter no minimo 32 caracteres para seguranca',
  }),
  EXPIRE_IN: Joi.number().default(7200),
  REFRESH_EXPIRE_IN: Joi.number().default(604800),

  TYPEORM_CONNECTION: Joi.string().default('postgres'),
  TYPEORM_HOST: Joi.string().required(),
  TYPEORM_PORT: Joi.number().default(5432),
  TYPEORM_USERNAME: Joi.string().required(),
  TYPEORM_PASSWORD: Joi.string().required(),
  TYPEORM_DATABASE: Joi.string().required(),
  TYPEORM_SYNCHRONIZE: Joi.boolean().default(false),
  TYPEORM_ENTITIES: Joi.string().default('dist/**/*.entity.js'),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow(''),
  REDIS_DB: Joi.number().default(0),
  REDIS_TTL: Joi.number().default(60000),

  CORS_ORIGINS: Joi.string().default('*'),

  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),

  EMAIL_SERVICE_URL: Joi.string().uri().optional().allow(''),
  EMAIL_SERVICE_KEY: Joi.string().optional().allow(''),

  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),

  SUPABASE_URL: Joi.string().uri().optional().allow(''),
  SUPABASE_ANON_KEY: Joi.string().optional().allow(''),
  SUPABASE_JWT_SECRET: Joi.string().optional().allow(''),
  SUPABASE_BUCKET: Joi.string().default('uploads'),

  MAX_FILE_SIZE: Joi.number().default(10485760),
});
