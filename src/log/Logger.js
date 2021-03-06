// Generated by CoffeeScript 1.3.3
/**
Copyright (c) 2012 [DeftJS Framework Contributors](http://deftjs.org)
Open source under the [MIT License](http://en.wikipedia.org/wiki/MIT_License).
*/

Carcasse.define('Deft.log.Logger', {
  alternateClassName: ['Deft.Logger'],
  singleton: true,
  log: function(message, priority) {},
  error: function(message) {
    this.log(message, 'error');
  },
  info: function(message) {
    this.log(message, 'info');
  },
  verbose: function(message) {
    this.log(message, 'verbose');
  },
  warn: function(message) {
    this.log(message, 'warn');
  },
  deprecate: function(message) {
    this.log(message, 'deprecate');
  }
}, function() {
  var _ref;
  if (Carcasse.isFunction((_ref = Carcasse.Logger) != null ? _ref.log : void 0)) {
    this.log = Carcasse.bind(Carcasse.Logger.log, Carcasse.Logger);
  } else if (Carcasse.isFunction(Carcasse.log)) {
    this.log = function(message, priority) {
      if (priority == null) {
        priority = 'info';
      }
      if (priority === 'deprecate') {
        priority = 'warn';
      }
      Carcasse.log({
        msg: message,
        level: priority
      });
    };
  }
});