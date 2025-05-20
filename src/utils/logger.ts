import { config } from '../config/config.js';

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private debugMode: boolean;
  private level: LogLevel;

  constructor() {
    this.debugMode = config.debugMode;
    this.level = this.debugMode ? LogLevel.DEBUG : LogLevel.INFO;
  }

  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    this.level = enabled ? LogLevel.DEBUG : LogLevel.INFO;
  }
}

export const logger = new Logger();