import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  // Database
  DATABASE_URL: Joi.string().uri().required(),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  CACHE_TTL: Joi.number().default(60),

  // Background Jobs (BullMQ)
  BULL_ATTEMPTS: Joi.number().min(1).default(3),
  BULL_BACKOFF_DELAY: Joi.number().min(0).default(1000),
  BULL_REMOVE_ON_COMPLETE: Joi.number().min(0).default(1000),
  BULL_REMOVE_ON_FAIL: Joi.number().min(0).default(5000),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_ACCESS_SECRET must be at least 32 characters long',
    'any.required': 'JWT_ACCESS_SECRET is required',
  }),
  JWT_REFRESH_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_REFRESH_SECRET must be at least 32 characters long',
    'any.required': 'JWT_REFRESH_SECRET is required',
  }),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Rate Limiting
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(10),

  // Swagger
  SWAGGER_ENABLED: Joi.boolean().default(false),
  SWAGGER_PATH: Joi.string().default('api/docs'),
});

export const validationOptions = {
  abortEarly: false,
  allowUnknown: true,
};
