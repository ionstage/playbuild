import { FileSaver } from '../bundle/file-saver.js';
import { jCore } from '../bundle/jcore.js';
import { dom } from '../dom.js';
import { CommandInput } from './command-input.js';
import { Content } from './content.js';
import { Environment } from '../models/environment.js';
import { FileInput } from './file-input.js';

export class Main extends jCore.Component {
  constructor(props) {
    super(props);
    this.env = new Environment({
      circuitModuleLoader: this.circuitModuleLoader.bind(this),
      circuitModuleUnloader: this.circuitModuleUnloader.bind(this),
      scriptLoader: this.scriptLoader.bind(this),
      scriptSaver: this.scriptSaver.bind(this),
    });
    this.commandInput = new CommandInput({ element: this.findElement('.command-input') });
    this.fileInput = new FileInput({ element: this.findElement('.file-input') });
    this.content = new Content({ element: this.findElement('.content') });
    this.oninit();
  }

  circuitModuleLoader(variableName, moduleName) {
    return this.content.loadVariable(variableName, moduleName).then(variable => {
      return variable.circuitModule();
    });
  }

  circuitModuleUnloader(variableName) {
    return new Promise(resolve => {
      this.content.deleteVariable(variableName);
      resolve();
    });
  }

  scriptLoader(path) {
    if (!path) {
      this.commandInput.disabled(false);
      this.commandInput.blur();
      return this.fileInput.load();
    }
    return dom.ajax({
      type: 'GET',
      url: 'playbuild_scripts/' + path,
    }).then(text => {
      return {
        text: text,
        fileName: path.split('/').pop(),
      };
    });
  }

  scriptSaver(path, text) {
    return new Promise(resolve => {
      FileSaver.saveAs(new Blob([text], { type: 'plain/text' }), path);
      resolve();
    });
  }

  oninit() {
    this.commandInput.on('exec', this.onexec.bind(this));
  }

  onexec(text, done) {
    this.env.exec(text).then(() => {
      done();
    }).catch(e => {
      console.error(e);
      done(e);
    });
  }
}
