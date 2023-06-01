let console = {
  formatArgsOutput: function (arg) {
    let outputArgMessage;

    // Deal with different data types
    switch (this.getType(arg)) {
      case "object":
        outputArgMessage = `Object ${JSON.stringify(arg)}`;
        break;
      case "array":
        outputArgMessage = `Array ${JSON.stringify(arg)}`;
        break;
      default:
        outputArgMessage = arg;
        break;
    }

    return outputArgMessage;
  },
  getType: function (arg) {
    if (typeof arg === "string") return "string";
    if (typeof arg === "boolean") return "boolean";
    if (typeof arg === "function") return "function";
    if (typeof arg === "number") return "number";
    if (typeof arg === "undefined") return "undefined";
    if (typeof arg === "object" && !Array.isArray(arg)) return "object";
    if (typeof arg === "object" && Array.isArray(arg)) return "array";
  },
  logMultipleArguments: function (arguments) {
    let currentLog = "";

    // Deal with multiple arguments
    arguments.forEach((arg) => {
      currentLog += this.formatArgsOutput(arg) + " ";
    });

    // Add to console messages
    consoleMessages.push({
      message: currentLog,
      class: `log log--default`,
    });
  },
  logSingleArgument: function (logItem) {
    consoleMessages.push({
      message: this.formatArgsOutput(logItem),
      class: `log log--${this.getType(logItem)}`,
    });
  },
  log: function (text) {
    window.console.log(text);
    let argsArray = Array.from(arguments);
    return argsArray.length !== 1
      ? this.logMultipleArguments(argsArray)
      : this.logSingleArgument(text);
  },
  error: function (err) {
    window.console.error(err);
    consoleMessages.push({
      message: `${err.name}: ${err.message}`,
      class: "log log--error",
    });
  }
}
