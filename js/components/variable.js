(function(app) {
  'use strict';

  var jCore = require('jcore');
  var dom = app.dom || require('../dom.js');

  var Variable = jCore.Component.inherits(function(props) {
    this.name = this.prop(props.name);
    this.moduleName = this.prop(props.moduleName);
    this.content = new Variable.Content({ element: this.findElement('.variable-content') });
  });

  Variable.prototype.nameElement = function() {
    return this.findElement('.variable-name');
  };

  Variable.prototype.moduleNameElement = function() {
    return this.findElement('.variable-module-name');
  };

  Variable.prototype.contentUrl = function() {
    return 'order_modules/' + encodeURI(this.moduleName()) + '.html';
  };

  Variable.prototype.circuitModule = function() {
    return this.content.circuitModule();
  };

  Variable.prototype.render = function() {
    return dom.render(Variable.HTML_TEXT);
  };

  Variable.prototype.oninit = function() {
    dom.text(this.nameElement(), this.name());
    dom.text(this.moduleNameElement(), this.moduleName());
  };

  Variable.prototype.load = function() {
    return this.content.load(this.contentUrl());
  };

  Variable.HTML_TEXT = [
    '<div class="variable">',
      '<div class="variable-header">',
        '<div class="variable-name"></div>',
        '<div class="variable-module-name"></div>',
      '</div>',
      '<iframe class="variable-content"></iframe>',
    '</div>',
  ].join('');

  Variable.Content = (function() {
    var Content = jCore.Component.inherits();

    Content.prototype.contentWindow = function() {
      return dom.contentWindow(this.element());
    };

    Content.prototype.circuitModule = function() {
      var order = this.contentWindow().order;
      return (order && order.exports);
    };

    Content.prototype.load = function(url) {
      return new Promise(function(resolve, reject) {
        var timeoutID = setTimeout(reject, 30 * 1000, new Error('OrderScript runtime error: Load timeout for content'));
        dom.once(this.element(), 'load', function() {
          clearTimeout(timeoutID);
          resolve(this.circuitModule());
        }.bind(this));
        dom.attr(this.element(), { src: url });
      }.bind(this)).then(function(circuitModule) {
        if (!circuitModule) {
          throw new Error('OrderScript runtime error: Invalid circuit module');
        }
        dom.css(this.element(), { height: dom.contentHeight(this.element()) + 'px' });
      }.bind(this));
    };

    return Content;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Variable;
  } else {
    app.Variable = Variable;
  }
})(this.app || (this.app = {}));
