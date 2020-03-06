(function() {
  // define a new console
  var console = (function(oldCons) {
    return {
      prefix: function() {
        return `[TPM-SCRIPT] [${new Date().toString().slice(16, 24)}]`;
      },
      log: function(...text) {
        oldCons.log(`${this.prefix()} ${text}`);
        // Your code
      },
      info: function(...text) {
        oldCons.info(text);
        // Your code
      },
      warn: function(...text) {
        oldCons.warn(text);
        // Your code
      },
      error: function(...text) {
        oldCons.error(text);
        // Your code
      }
    };
  })(window.console);

  //Then redefine the old console
  window.logger = console;
})();
