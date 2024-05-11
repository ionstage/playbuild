import { FileSaver } from '../bundle/file-saver.js';
import { jCore } from '../bundle/jcore.js';
import { dom } from '../dom.js';
import { CommandInput } from './command-input.js';
import { Content } from './content.js';
import { Environment } from '../models/environment.js';
import { FileInput } from './file-input.js';

export class Main extends jCore.Component {
  constructor(el) {
    super(el);
    this._env = new Environment({
      circuitModuleLoader: this._circuitModuleLoader.bind(this),
      circuitModuleUnloader: this._circuitModuleUnloader.bind(this),
      scriptLoader: this._scriptLoader.bind(this),
      scriptSaver: this._scriptSaver.bind(this),
    });
    this._commandInput = new CommandInput(dom.find(this.el, '.command-input'));
    this._fileInput = new FileInput(dom.find(this.el, '.file-input'));
    this._content = new Content(dom.find(this.el, '.content'));
    this._oninit();
  }

  async _circuitModuleLoader(variableName, moduleName) {
    const variable = await this._content.loadVariable(variableName, moduleName);
    return variable.circuitModule();
  }

  async _circuitModuleUnloader(variableName) {
    this._content.deleteVariable(variableName);
  }

  async _scriptLoader(path) {
    if (!path) {
      this._commandInput.disabled(false);
      this._commandInput.blur();
      return this._fileInput.load();
    }
    const res = await fetch('playbuild_scripts/' + path);
    if (!res.ok) {
      throw new Error(res.statusText);
    }
    const text = await res.text();
    const fileName = path.split('/').pop();
    return { text, fileName };
  }

  async _scriptSaver(path, text) {
    FileSaver.saveAs(new Blob([text], { type: 'plain/text' }), path);
  }

  _oninit() {
    this._commandInput.on('exec', this._onexec.bind(this));
  }

  async _onexec(text, done) {
    try {
      await this._env.exec(text);
      done();
    } catch (e) {
      console.error(e);
      done(e);
    }
  }
}
