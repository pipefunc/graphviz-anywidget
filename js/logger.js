export const Logger = {
  DEBUG: false, // Can be controlled via environment or initialization

  debug(...args) {
    if (this.DEBUG) {
      console.debug("🔍 [DEBUG]", ...args);
    }
  },

  info(...args) {
    console.info("ℹ️ [INFO]", ...args);
  },

  warn(...args) {
    console.warn("⚠️ [WARN]", ...args);
  },

  error(...args) {
    console.error("❌ [ERROR]", ...args);
  },
};
