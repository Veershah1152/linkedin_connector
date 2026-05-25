const dotenv = require('dotenv');
const path = require('path');

// Monkey patch GoogleGenerativeAI to transparently map gemini-1.5-flash to gemini-flash-latest
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const originalGetGenerativeModel = GoogleGenerativeAI.prototype.getGenerativeModel;
  GoogleGenerativeAI.prototype.getGenerativeModel = function(options, ...args) {
    if (options && options.model === 'gemini-1.5-flash') {
      options.model = 'gemini-flash-latest';
    }
    return originalGetGenerativeModel.call(this, options, ...args);
  };
} catch (e) {
  // Silent fail if module isn't loaded/available in current scope
}

// Load env from project root
try {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
} catch (e) {
  // Ignore error if dotenv is not available or path is wrong
}

const getEnvValue = (envObj, key, defaultValue = '') => {
  if (envObj && envObj[key]) return envObj[key];
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  return defaultValue;
};

const getConfig = (envObj) => {
  return {
    port: parseInt(getEnvValue(envObj, 'PORT', '5000'), 10),
    nodeEnv: getEnvValue(envObj, 'NODE_ENV', 'development'),
    apiUrl: getEnvValue(envObj, 'API_URL', 'http://localhost:5000'),
    clientUrl: getEnvValue(envObj, 'CLIENT_URL', 'http://localhost:3000'),

    supabase: {
      url: getEnvValue(envObj, 'SUPABASE_URL', ''),
      anonKey: getEnvValue(envObj, 'SUPABASE_ANON_KEY', ''),
      serviceRoleKey: getEnvValue(envObj, 'SUPABASE_SERVICE_ROLE_KEY', ''),
    },

    linkedin: {
      clientId: getEnvValue(envObj, 'LINKEDIN_CLIENT_ID', ''),
      clientSecret: getEnvValue(envObj, 'LINKEDIN_CLIENT_SECRET', ''),
      redirectUri: getEnvValue(envObj, 'LINKEDIN_REDIRECT_URI', ''),
    },

    jwt: {
      secret: getEnvValue(envObj, 'JWT_SECRET', 'dev-secret-change-in-production'),
      expiresIn: getEnvValue(envObj, 'JWT_EXPIRES_IN', '7d'),
      refreshExpiresIn: getEnvValue(envObj, 'JWT_REFRESH_EXPIRES_IN', '30d'),
    },

    groq: {
      apiKey: getEnvValue(envObj, 'GROQ_API_KEY', ''),
    },

    gemini: {
      apiKey: getEnvValue(envObj, 'GEMINI_API_KEY', ''),
    },

    redis: {
      url: getEnvValue(envObj, 'REDIS_URL', 'redis://localhost:6379'),
    },
  };
};

let activeEnv = null;

const setWorkerEnv = (env) => {
  activeEnv = env;
};

const finalConfig = getConfig();

const configProxy = new Proxy(finalConfig, {
  get(target, prop) {
    if (prop === 'getConfig') {
      return getConfig;
    }
    if (prop === 'setWorkerEnv') {
      return setWorkerEnv;
    }

    const resolved = getConfig(activeEnv);
    const val = resolved[prop];

    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return new Proxy(val, {
        get(subTarget, subProp) {
          const resolvedSub = getConfig(activeEnv)[prop];
          return resolvedSub ? resolvedSub[subProp] : undefined;
        }
      });
    }

    return val;
  }
});

module.exports = configProxy;

