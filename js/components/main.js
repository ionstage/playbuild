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
    this.env = new Environment({
      circuitModuleLoader: this.circuitModuleLoader.bind(this),
      circuitModuleUnloader: this.circuitModuleUnloader.bind(this),
      scriptLoader: this.scriptLoader.bind(this),
      scriptSaver: this.scriptSaver.bind(this),
    });
    this.commandInput = new CommandInput(dom.find(this.el, '.command-input'));
    this.fileInput = new FileInput(dom.find(this.el, '.file-input'));
    this.content = new Content(dom.find(this.el, '.content'));
    this.oninit();
  }

  async circuitModuleLoader(variableName, moduleName) {
    const variable = await this.content.loadVariable(variableName, moduleName);
    return variable.circuitModule();
  }

  async circuitModuleUnloader(variableName) {
    this.content.deleteVariable(variableName);
  }

  async scriptLoader(path) {
    if (!path) {
      this.commandInput.disabled(false);
      this.commandInput.blur();
      return this.fileInput.load();
    }
    const res = await fetch('playbuild_scripts/' + path);
    if (!res.ok) {
      throw new Error(res.statusText);
    }
    const text = await res.text();
    const fileName = path.split('/').pop();
    return { text, fileName };
  }

  async scriptSaver(path, text) {
    FileSaver.saveAs(new Blob([text], { type: 'plain/text' }), path);
  }

  oninit() {
    this.commandInput.on('exec', this.onexec.bind(this));
  }

  async onexec(text, done) {
    try {
      await this.env.exec(text);
      done();
    } catch (e) {
      console.error(e);
      done(e);
    }
  }
}
