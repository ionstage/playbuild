import { jCore } from '../bundle/jcore.js';
import { dom } from '../dom.js';

export class Variable extends jCore.Component {
  constructor(props) {
    super();
    this.top = this.prop(props.top);
    this.dragging = this.prop(false);
    this._name = props.name;
    this._moduleName = props.moduleName;
    this._content = new VariableContent(dom.find(this.el, '.variable-content'));
    this._opened = true;
    this._onchange_toggleButton = this._onchange_toggleButton.bind(this);
    this._onclick_deleteButton = this._onclick_deleteButton.bind(this);
    this._oninit();
  }

  name() {
    return this._name;
  }

  height() {
    return (this._opened && !this.dragging() ? this._content.height() + Variable._HEIGHT_OFFSET_OPENED : Variable._HEIGHT_OFFSET_CLOSED);
  }

  circuitModule() {
    return this._content.circuitModule();
  }

  render() {
    return dom.render(Variable._HTML_TEXT);
  }

  load(dataText) {
    return this._content.load(this._contentUrl(), dataText);
  }

  unload() {
    dom.off(this._toggleButtonElement(), 'change', this._onchange_toggleButton);
    dom.off(this._deleteButtonElement(), 'click', this._onclick_deleteButton);
  }

  onredraw() {
    this.redrawBy('top', top => {
      dom.translateY(this.el, top);
    });

    this.redrawBy('dragging', dragging => {
      dom.toggleClass(this.el, 'dragging', dragging);
    });
  }

  _toggleButtonElement() {
    return dom.find(this.el, '.variable-toggle-button');
  }

  _nameElement() {
    return dom.find(this.el, '.variable-name');
  }

  _deleteButtonElement() {
    return dom.find(this.el, '.variable-delete-button');
  }

  _contentUrl() {
    return `playbuild_modules/${encodeURI(this._moduleName)}.html`;
  }

  _oninit() {
    dom.data(this.el, 'name', this._name);
    dom.text(this._nameElement(), `${this._name}:${this._moduleName}`);
    dom.on(this._toggleButtonElement(), 'change', this._onchange_toggleButton);
    dom.on(this._deleteButtonElement(), 'click', this._onclick_deleteButton);
  }

  _onchange_toggleButton(event) {
    this._opened = dom.checked(dom.target(event));
    dom.toggleClass(this.el, 'open', this._opened);
    this.emit('resize');
  }

  _onclick_deleteButton() {
    this.emit('delete');
  }

  static _HEIGHT_OFFSET_OPENED = 33;
  static _HEIGHT_OFFSET_CLOSED = 32;

  static _HTML_TEXT = [
    '<div class="variable open">',
      '<div class="variable-header">',
        '<div class="variable-toggle-button">',
          '<input class="variable-toggle-button-input" type="checkbox" name="variable-toggle" checked ontouchstart="">',
          '<svg class="variable-toggle-button-image" viewBox="0 0 7 12">',
            '<path d="M 1 1 L 6 6 1 11" stroke="#616161" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none" />',
          '</svg>',
        '</div>',
        '<div class="variable-name"></div>',
        '<button class="variable-delete-button">',
          '<svg class="variable-delete-button-image" viewBox="0 0 12 12">',
            '<path d="M 1 1 L 11 11 M 11 1 L 1 11" stroke="#616161" stroke-width="1" stroke-linecap="round" fill="none" />',
          '</svg>',
        '</button>',
      '</div>',
      '<iframe class="variable-content embed"></iframe>',
    '</div>',
  ].join('');
}

class VariableContent extends jCore.Component {
  constructor(el) {
    super(el);
    this._height = 0;
  }

  height() {
    return this._height;
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
    this._height = dom.contentHeight(this.el);
    dom.css(this.el, { height: `${this._height}px` });
  }

  _contentWindow() {
    return dom.contentWindow(this.el);
  }
}
