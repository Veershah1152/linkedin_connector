const { createClient } = require('@supabase/supabase-js');
const config = require('./env');

let activeEnv = null;
let adminInstance = null;
let publicInstance = null;

const initWorkerEnv = (env) => {
  activeEnv = env;
  adminInstance = null;
  publicInstance = null;
  config.setWorkerEnv(env);
};

const getAdminClient = () => {
  if (adminInstance) return adminInstance;
  
  if (activeEnv) {
    const dynamicConfig = config.getConfig(activeEnv);
    adminInstance = createClient(dynamicConfig.supabase.url, dynamicConfig.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } else {
    adminInstance = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return adminInstance;
};

const getPublicClient = () => {
  if (publicInstance) return publicInstance;
  
  if (activeEnv) {
    const dynamicConfig = config.getConfig(activeEnv);
    publicInstance = createClient(dynamicConfig.supabase.url, dynamicConfig.supabase.anonKey);
  } else {
    publicInstance = createClient(config.supabase.url, config.supabase.anonKey);
  }
  return publicInstance;
};

// Create proxies that delegate to the active instance
const supabaseAdmin = new Proxy({}, {
  get(target, prop) {
    const client = getAdminClient();
    const value = Reflect.get(client, prop);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

const supabasePublic = new Proxy({}, {
  get(target, prop) {
    const client = getPublicClient();
    const value = Reflect.get(client, prop);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

module.exports = {
  supabaseAdmin,
  supabasePublic,
  initWorkerEnv,
  getSupabaseAdmin: getAdminClient,
  getSupabasePublic: getPublicClient,
};
