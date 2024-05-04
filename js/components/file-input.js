(function(app) {
  'use strict';

  var jCore = require('jcore');
  var dom = app.dom || require('../dom.js');

  var FileInput = jCore.Component.inherits();

  FileInput.prototype.load = function() {
    return new Promise(function(resolve) {
      var onchange = function(event) {
        resolve(dom.file(dom.target(event)));
      };
      dom.on(this.element(), 'change', onchange);
      dom.click(this.element());
      dom.once(dom.body(), 'focus', function() {
        dom.off(this.element(), 'change', onchange);
      }.bind(this), true);
    }.bind(this)).then(function(file) {
      var fileName = dom.fileName(file);
      dom.value(this.element(), '');
      return dom.readFile(file).then(function(text) {
        return {
          text: text,
          fileName: fileName,
        };
      });
    }.bind(this));
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileInput;
  } else {
    app.FileInput = FileInput;
  }
})(this.app || (this.app = {}));
