(function(app) {
  'use strict';

  var jCore = require('jcore');
  var Variable = app.Variable || require('./variable.js');

  var Content = jCore.Component.inherits(function() {
    this.variableTable = {};
  });

  Content.prototype.loadVariable = function(name, moduleName) {
    var variable = new Variable({
      name: name,
      moduleName: moduleName,
    });
    variable.parentElement(this.element());
    variable.redraw();
    return variable.load().then(function() {
      this.variableTable[name] = variable;
      return variable;
    }.bind(this)).catch(function(e) {
      variable.parentElement(null);
      throw e;
    });
  };

  Content.prototype.deleteVariable = function(name) {
    this.variableTable[name].parentElement(null);
    delete this.variableTable[name];
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Content;
  } else {
    app.Content = Content;
  }
})(this.app || (this.app = {}));
