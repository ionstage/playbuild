import { FileSaver } from '../bundle/file-saver.js';
import { jCore } from '../bundle/jcore.js';
import { dom } from '../dom.js';
import { CommandInput } from './command-input.js';
import { Content } from './content.js';
import { Environment } from '../models/environment.js';
import { FileInput } from './file-input.js';

export var Main = jCore.Component.inherits(function() {
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
    url: 'playbuild_scripts/' + path,
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
