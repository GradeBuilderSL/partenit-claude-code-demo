// API Configuration for Partenit Warehouse Safety Demo
const CONFIG = {
  // Production API endpoint
  API_URL: 'http://45.63.65.41',

  // Storage keys for localStorage
  STORAGE_KEYS: {
    LLM_API_KEY: 'llm_api_key',
    LLM_PROVIDER: 'llm_provider',
    GAME_SESSION_ID: 'game_session_id'
  },

  // Default values
  DEFAULTS: {
    LLM_PROVIDER: 'gemini'
  },

  // LLM Provider information
  PROVIDERS: {
    gemini: {
      name: 'Google Gemini',
      keyUrl: 'https://aistudio.google.com/app/apikey',
      keyPlaceholder: 'AIza...'
    },
    openai: {
      name: 'OpenAI',
      keyUrl: 'https://platform.openai.com/api-keys',
      keyPlaceholder: 'sk-...'
    }
  }
};

// Configuration management functions
function getLlmApiKey() {
  try {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.LLM_API_KEY) || '';
  } catch (e) {
    console.error('Failed to get LLM API key:', e);
    return '';
  }
}

function getLlmProvider() {
  try {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.LLM_PROVIDER) || CONFIG.DEFAULTS.LLM_PROVIDER;
  } catch (e) {
    console.error('Failed to get LLM provider:', e);
    return CONFIG.DEFAULTS.LLM_PROVIDER;
  }
}

function saveConfig(llmKey, llmProvider) {
  try {
    localStorage.setItem(CONFIG.STORAGE_KEYS.LLM_API_KEY, llmKey);
    localStorage.setItem(CONFIG.STORAGE_KEYS.LLM_PROVIDER, llmProvider);
    return true;
  } catch (e) {
    console.error('Failed to save config:', e);
    return false;
  }
}

function isConfigured() {
  const llmKey = getLlmApiKey();
  return llmKey.length > 0;
}

function getApiHeaders(includeJson = true) {
  const headers = {};
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

// Show configuration modal if not configured
function checkConfiguration() {
  if (!isConfigured()) {
    const modal = document.getElementById('config-modal');
    if (modal) {
      modal.showModal();
      return false;
    }
  }
  return true;
}
