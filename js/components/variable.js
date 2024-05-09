import { jCore } from '../bundle/jcore.js';
import { dom } from '../dom.js';

export class Variable extends jCore.Component {
  constructor(props) {
    super(props);
    this.name = this.prop(props.name);
    this.moduleName = this.prop(props.moduleName);
    this.content = new VariableContent({ element: this.findElement('.variable-content') });
    this.oninit();
  }

  nameElement() {
    return this.findElement('.variable-name');
  }

  moduleNameElement() {
    return this.findElement('.variable-module-name');
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
  constructor(props) {
    super(props);
  }

  contentWindow() {
    return dom.contentWindow(this.element());
  }

  circuitModule() {
    const playbuild = this.contentWindow().playbuild;
    return (playbuild && playbuild.exports);
  }

  load(url) {
    return new Promise((resolve, reject) => {
      const timeoutID = setTimeout(reject, 30 * 1000, new Error('PlayBuildScript runtime error: Load timeout for content'));
      dom.once(this.element(), 'load', () => {
        clearTimeout(timeoutID);
        resolve(this.circuitModule());
      });
      dom.attr(this.element(), { src: url });
    }).then(circuitModule => {
      if (!circuitModule) {
        throw new Error('PlayBuildScript runtime error: Invalid circuit module');
      }
      dom.css(this.element(), { height: dom.contentHeight(this.element()) + 'px' });
    });
  }
}
