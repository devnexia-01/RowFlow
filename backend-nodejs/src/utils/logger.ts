const logInfo = (...args: any[]): void => {
  console.log(...args);
};

const logError = (...args: any[]): void => {
  console.error(...args);
};

const logWarn = (...args: any[]): void => {
  console.warn(...args);
};

export {
  logInfo,
  logError,
  logWarn,
};
