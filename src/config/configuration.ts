export interface DatabaseConfig {
  url: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  cacheTtl: number;
}

export interface BullConfig {
  attempts: number;
  backoffDelay: number;
  removeOnComplete: number;
  removeOnFail: number;
}

export interface JwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
}

export interface ThrottleConfig {
  ttl: number;
  limit: number;
}

export interface SwaggerConfig {
  enabled: boolean;
  path: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: DatabaseConfig;
  redis: RedisConfig;
  bull: BullConfig;
  jwt: JwtConfig;
  throttle: ThrottleConfig;
  swagger: SwaggerConfig;
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || '',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    cacheTtl: parseInt(process.env.CACHE_TTL || '60', 10),
  },
  bull: {
    attempts: parseInt(process.env.BULL_ATTEMPTS || '3', 10),
    backoffDelay: parseInt(process.env.BULL_BACKOFF_DELAY || '1000', 10),
    removeOnComplete: parseInt(process.env.BULL_REMOVE_ON_COMPLETE || '1000', 10),
    removeOnFail: parseInt(process.env.BULL_REMOVE_ON_FAIL || '5000', 10),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || '',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
  },
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
    path: process.env.SWAGGER_PATH || 'api/docs',
  },
});
