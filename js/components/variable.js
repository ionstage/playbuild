import { jCore } from '../bundle/jcore.js';
import { dom } from '../dom.js';

export class Variable extends jCore.Component {
  constructor(props) {
    super();
    this.name = this.prop(props.name);
    this.moduleName = this.prop(props.moduleName);
    this.content = new VariableContent(dom.find(this.el, '.variable-content'));
    this.oninit();
  }

  nameElement() {
    return dom.find(this.el, '.variable-name');
  }

  moduleNameElement() {
    return dom.find(this.el, '.variable-module-name');
  }

  contentUrl() {
    return 'playbuild_modules/' + encodeURI(this.moduleName()) + '.html';
  }

  circuitModule() {
    return this.content.circuitModule();
  }

  render() {
    return dom.render(Variable.#HTML_TEXT);
  }

  oninit() {
    dom.text(this.nameElement(), this.name());
    dom.text(this.moduleNameElement(), this.moduleName());
  }

  load() {
    return this.content.load(this.contentUrl());
  }

  static #HTML_TEXT = [
    '<div class="variable">',
      '<div class="variable-header">',
        '<div class="variable-name"></div>',
        '<div class="variable-module-name"></div>',
      '</div>',
      '<iframe class="variable-content"></iframe>',
    '</div>',
  ].join('');
}

class VariableContent extends jCore.Component {
  constructor(el) {
    super(el);
  }

  contentWindow() {
    return dom.contentWindow(this.el);
  }

  circuitModule() {
    const playbuild = this.contentWindow().playbuild;
    return (playbuild && playbuild.exports);
  }

  async load(url) {
    const circuitModule = await new Promise((resolve, reject) => {
      const timeoutID = setTimeout(reject, 30 * 1000, new Error('PlayBuildScript runtime error: Load timeout for content'));
      dom.once(this.el, 'load', () => {
        clearTimeout(timeoutID);
        resolve(this.circuitModule());
      });
      dom.attr(this.el, { src: url });
    });
    if (!circuitModule) {
      throw new Error('PlayBuildScript runtime error: Invalid circuit module');
    }
    dom.css(this.el, { height: dom.contentHeight(this.el) + 'px' });
  }
}
