// Log levels
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
}

export class Logger {
  private static instance: Logger
  private logLevel: LogLevel = LogLevel.INFO

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  public setLogLevel(level: LogLevel) {
    this.logLevel = level
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel)
    return levels.indexOf(level) <= levels.indexOf(this.logLevel)
  }

  private formatLog(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    }
  }

  private log(level: LogLevel, message: string, data?: any) {
    if (!this.shouldLog(level)) return

    const logEntry = this.formatLog(level, message, data)

    switch (level) {
      case LogLevel.ERROR:
        console.error(logEntry)
        break
      case LogLevel.WARN:
        console.warn(logEntry)
        break
      case LogLevel.INFO:
        console.info(logEntry)
        break
      case LogLevel.DEBUG:
        console.debug(logEntry)
        break
    }

    // In a production environment, you might want to send logs to a service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement production logging service integration
    }
  }

  public error(message: string, data?: any) {
    this.log(LogLevel.ERROR, message, data)
  }

  public warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data)
  }

  public info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data)
  }

  public debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data)
  }
} 