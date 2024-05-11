import { jCore } from '../bundle/jcore.js';
import { dom } from '../dom.js';

export class Variable extends jCore.Component {
  constructor(props) {
    super();
    this._name = this.prop(props.name);
    this._moduleName = this.prop(props.moduleName);
    this._content = new VariableContent(dom.find(this.el, '.variable-content'));
    this._oninit();
  }

  name() {
    return this._name();
  }

  render() {
    return dom.render(Variable._HTML_TEXT);
  }

  circuitModule() {
    return this._content.circuitModule();
  }

  load() {
    return this._content.load(this._contentUrl());
  }

  _nameElement() {
    return dom.find(this.el, '.variable-name');
  }

  _moduleNameElement() {
    return dom.find(this.el, '.variable-module-name');
  }

  _contentUrl() {
    return 'playbuild_modules/' + encodeURI(this._moduleName()) + '.html';
  }

  _oninit() {
    dom.text(this._nameElement(), this._name());
    dom.text(this._moduleNameElement(), this._moduleName());
  }

  static _HTML_TEXT = [
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

  circuitModule() {
    const playbuild = this._contentWindow().playbuild;
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

  _contentWindow() {
    return dom.contentWindow(this.el);
  }
}
