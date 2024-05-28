import { jCore } from '../bundle/jcore.js';
import { dom } from '../dom.js';

export class Variable extends jCore.Component {
  constructor(props) {
    super();
    this._name = props.name;
    this._moduleName = props.moduleName;
    this._content = new VariableContent(dom.find(this.el, '.variable-content'));
    this._onclick_deleteButton = this._onclick_deleteButton.bind(this);
    this._oninit();
  }

  name() {
    return this._name;
  }

  render() {
    return dom.render(Variable._HTML_TEXT);
  }

  circuitModule() {
    return this._content.circuitModule();
  }

  load(dataText) {
    return this._content.load(this._contentUrl(), dataText);
  }

  unload() {
    dom.off(this._deleteButtonElement(), 'click', this._onclick_deleteButton);
  }

  _nameElement() {
    return dom.find(this.el, '.variable-name');
  }

  _deleteButtonElement() {
    return dom.find(this.el, '.variable-delete-button');
  }

  _contentUrl() {
    return 'playbuild_modules/' + encodeURI(this._moduleName) + '.html';
  }

  _oninit() {
    dom.text(this._nameElement(), this._name + ':' + this._moduleName);
    dom.on(this._deleteButtonElement(), 'click', this._onclick_deleteButton);
  }

  _onclick_deleteButton() {
    this.emit('delete');
  }

  static _HTML_TEXT = [
    '<div class="variable">',
      '<div class="variable-header">',
        '<div class="variable-toggle-button">',
          '<svg class="variable-toggle-button-image" viewBox="0 0 7 12">',
            '<path d="M 1 1 L 6 6 1 11" stroke="#616161" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none" />',
          '</svg>',
        '</div>',
        '<div class="variable-name"></div>',
        '<div class="variable-delete-button">',
          '<svg class="variable-delete-button-image" viewBox="0 0 12 12">',
            '<path d="M 1 1 L 11 11 M 11 1 L 1 11" stroke="#616161" stroke-width="1" stroke-linecap="round" fill="none" />',
          '</svg>',
        '</div>',
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

  async load(url, dataText) {
    const circuitModule = await new Promise((resolve, reject) => {
      const timeoutID = setTimeout(reject, 30 * 1000, new Error('PlayBuildScript runtime error: Load timeout for content'));
      dom.once(this.el, 'load', () => {
        clearTimeout(timeoutID);
        const circuitModule = this.circuitModule();
        circuitModule.deserialize(dataText);
        resolve(circuitModule);
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
