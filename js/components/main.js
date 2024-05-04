(function(app) {
  'use strict';

  var FileSaver = require('file-saver');
  var jCore = require('jcore');
  var dom = app.dom || require('../dom.js');
  var CommandInput = app.CommandInput || require('./command-input.js');
  var Content = app.Content || require('./content.js');
  var Environment = app.Environment || require('../models/environment.js');
  var FileInput = app.FileInput || require('./file-input.js');

  var Main = jCore.Component.inherits(function() {
    this.env = new Environment({
      circuitModuleLoader: this.circuitModuleLoader.bind(this),
      circuitModuleUnloader: this.circuitModuleUnloader.bind(this),
      scriptLoader: this.scriptLoader.bind(this),
      scriptSaver: this.scriptSaver.bind(this),
    });

    this.commandInput = new CommandInput({ element: this.findElement('.command-input') });
    this.fileInput = new FileInput({ element: this.findElement('.file-input') });
    this.content = new Content({ element: this.findElement('.content') });
  });

  Main.prototype.circuitModuleLoader = function(variableName, moduleName) {
    return this.content.loadVariable(variableName, moduleName).then(function(variable) {
      return variable.circuitModule();
    });
  };

  Main.prototype.circuitModuleUnloader = function(variableName) {
    return new Promise(function(resolve) {
      this.content.deleteVariable(variableName);
      resolve();
    }.bind(this));
  };

  Main.prototype.scriptLoader = function(path) {
    if (!path) {
      this.commandInput.disabled(false);
      this.commandInput.blur();
      return this.fileInput.load();
    }
    return dom.ajax({
      type: 'GET',
      url: 'order_scripts/' + path,
    }).then(function(text) {
      return {
        text: text,
        fileName: path.split('/').pop(),
      };
    });
  };

  Main.prototype.scriptSaver = function(path, text) {
    return new Promise(function(resolve) {
      FileSaver.saveAs(new Blob([text], { type: 'plain/text' }), path);
      resolve();
    });
  };

  Main.prototype.oninit = function() {
    this.commandInput.on('exec', this.onexec.bind(this));
  };

  Main.prototype.onexec = function(text, done) {
    this.env.exec(text).then(function() {
      done();
    }).catch(function(e) {
      console.error(e);
      done(e);
    });
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Main;
  } else {
    app.Main = Main;
  }
})(this.app || (this.app = {}));
