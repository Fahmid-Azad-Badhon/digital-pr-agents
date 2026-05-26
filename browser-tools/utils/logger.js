/**
 * Browser Tools Logger
 * Structured logging with file rotation
 */

const fs = require('fs');
const path = require('path');
const config = require('../core/browser-config');

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

class Logger {
  constructor(moduleName) {
    this.moduleName = moduleName;
    this.level = LOG_LEVELS[config.get('logging.level')] || LOG_LEVELS.info;
    this.console = config.get('logging.console');
    this.file = config.get('logging.file');
    this.timestamp = config.get('logging.timestamp');
  }

  _formatMessage(level, message) {
    const parts = [];
    
    if (this.timestamp) {
      parts.push(new Date().toISOString());
    }
    
    parts.push(level.toUpperCase());
    parts.push(`[${this.moduleName}]`);
    parts.push(message);
    
    return parts.join(' ');
  }

  _write(level, ...args) {
    if (LOG_LEVELS[level] < this.level) {
      return;
    }

    const message = args.map(arg => {
      if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack}`;
      }
      if (typeof arg === 'object') {
        return JSON.stringify(arg, null, 2);
      }
      return String(arg);
    }).join(' ');

    const formatted = this._formatMessage(level, message);

    if (this.console) {
      const color = level === 'error' ? '\x1b[31m' :
                    level === 'warn' ? '\x1b[33m' :
                    level === 'debug' ? '\x1b[36m' : '\x1b[0m';
      console.log(color + formatted + '\x1b[0m');
    }

    if (this.file) {
      this._writeToFile(formatted);
    }
  }

  _writeToFile(message) {
    try {
      const logsDir = config.get('output.logsDir');
      const logFile = path.join(logsDir, `browser-tools-${this._getDateString()}.log`);
      
      fs.appendFileSync(logFile, message + '\n');
      
      this._rotateLogs(logsDir);
    } catch (err) {
      console.error('Failed to write log file:', err.message);
    }
  }

  _getDateString() {
    return new Date().toISOString().split('T')[0];
  }

  _rotateLogs(logsDir) {
    try {
      const files = fs.readdirSync(logsDir)
        .filter(f => f.startsWith('browser-tools-') && f.endsWith('.log'))
        .map(f => ({
          name: f,
          time: fs.statSync(path.join(logsDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      const maxFiles = config.get('output.maxLogFiles') || 10;
      
      if (files.length > maxFiles) {
        files.slice(maxFiles).forEach(f => {
          fs.unlinkSync(path.join(logsDir, f.name));
        });
      }
    } catch (err) {
      // Silent fail on rotation
    }
  }

  debug(...args) {
    this._write('debug', ...args);
  }

  info(...args) {
    this._write('info', ...args);
  }

  warn(...args) {
    this._write('warn', ...args);
  }

  error(...args) {
    this._write('error', ...args);
  }

  // Convenience methods
  logOperation(operation, status, details = '') {
    const symbol = status === 'start' ? '▶' :
                   status === 'success' ? '✓' :
                   status === 'fail' ? '✗' :
                   status === 'progress' ? '●' : '○';
    this.info(`${symbol} ${operation}${details ? ': ' + details : ''}`);
  }

  logData(key, value) {
    this.debug(`Data[${key}]:`, value);
  }

  logError(context, error) {
    this.error(`${context}: ${error.message}`);
    if (error.stack) {
      this.debug(error.stack);
    }
  }
}

module.exports = Logger;