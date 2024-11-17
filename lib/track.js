(() => {
  /* ==== CONFIGURATION ======================== */
  const DEFAULT_CONFIG = {
    DEBUG_PARAM: 'neo_debug',
    CUID_PARAM: 'neo_cuid',
    CSID_PARAM: 'neo_csid',
    SESSION_STORAGE_KEY: 'neo_debug',
    EXPIRATION_TIME_MS: 90 * 60 * 1000, // 90 minutes in milliseconds
    IDENTIFICATION_DONE_KEY: 'clarity_identified',
    VERBOSE_LOG: true, // Set to true to enable console logs, false to disable
  };

  // Merge the provided configuration with defaults
  const CONFIG = { ...DEFAULT_CONFIG, ...(window.NEO_CLARITY?.config || {}) };

  // Ensure the global namespace exists
  window.NEO_CLARITY = window.NEO_CLARITY || {};

  /* ==== LOGGING UTILITIES ==================== */
  const log = (...args) => {
    if (CONFIG.VERBOSE_LOG && console?.log) {
      console.log(...args);
    }
  };

  const error = (...args) => {
    if (CONFIG.VERBOSE_LOG && console?.error) {
      console.error(...args);
    }
  };

  /* ==== UTILITY FUNCTIONS ==================== */

  const getURLParameter = (param) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(param) || null;
  };

  const setSessionStorageWithTimestamp = (key) => {
    const data = { timestamp: Date.now() };
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      error('🐞 Failed to set sessionStorage item:', e);
    }
  };

  const isSessionStorageValid = (key) => {
    const data = sessionStorage.getItem(key);
    if (!data) return false;

    try {
      const { timestamp } = JSON.parse(data);
      return timestamp && Date.now() - timestamp <= CONFIG.EXPIRATION_TIME_MS;
    } catch (e) {
      error('🐞 Failed to parse sessionStorage data:', e);
      return false;
    }
  };

  const initializeDebugSession = () => {
    const debugParam = getURLParameter(CONFIG.DEBUG_PARAM);

    if (debugParam === 'true') {
      setSessionStorageWithTimestamp(CONFIG.SESSION_STORAGE_KEY);
      return true;
    }

    return isSessionStorageValid(CONFIG.SESSION_STORAGE_KEY);
  };

  const getUserAndSessionIds = () => ({
    userId: getURLParameter(CONFIG.CUID_PARAM) || '',
    sessionId: getURLParameter(CONFIG.CSID_PARAM) || '',
  });

  const identifyWithClarity = (userId, sessionId) => {
    if (typeof window.clarity === 'function') {
      try {
        window.clarity('identify', userId, sessionId);
        log('🦡 Clarity identification successful:', { userId, sessionId });
      } catch (err) {
        error('Clarity identification failed:', err);
      }
    } else {
      error('🐞 Clarity is not available.');
    }
  };

  const markIdentificationDone = () => {
    try {
      sessionStorage.setItem(CONFIG.IDENTIFICATION_DONE_KEY, 'true');
    } catch (e) {
      error('🐞 Failed to set identification done flag:', e);
    }
  };

  const isIdentificationDone = () =>
    sessionStorage.getItem(CONFIG.IDENTIFICATION_DONE_KEY) === 'true';

  /* ==== MAIN EXECUTION ======================= */
  (() => {
    if (initializeDebugSession()) {
      const { userId, sessionId } = getUserAndSessionIds();

      if (!isIdentificationDone()) {
        identifyWithClarity(userId, sessionId);
        markIdentificationDone();
      } else {
        log('🦡 Clarity identification already performed in this session.');
      }
    } else {
      log('🦡 Debug mode not activated. Clarity identify not executed.');
    }
  })();
})();
