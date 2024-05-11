import { jCore } from '../bundle/jcore.js';
import { dom } from '../dom.js';

export class CommandInput extends jCore.Component {
  constructor(el) {
    super(el);
    this._history = new CommandInputHistory({
      size: 100,
      key: 'playbuild/input-history',
    });
    this._oninit();
  }

  disabled(value) {
    dom.disabled(this.el, value);
  }

  focus() {
    dom.focus(this.el);
  }

  blur() {
    dom.blur(this.el);
  }

  _text(value) {
    return dom.value(this.el, value);
  }

  _isError(value) {
    dom.toggleClass(this.el, 'error', value);
  }

  _oninit() {
    this._history.load();
    dom.on(this.el, 'keydown', this._onkeydown.bind(this));
  }

  _onkeydown(event) {
    const key = CommandInput._KEY_DOWN_MAP[event.which];
    if (key) {
      this._isError(false);
      this['_on' + key](event);
    }
  }

  _onenter() {
    const text = this._text();
    if (text) {
      this.emit('exec', text, this._onexec.bind(this));
    }
  }

  _onup(event) {
    dom.cancel(event);
    this._text(this._history.back());
  }

  _ondown(event) {
    dom.cancel(event);
    this._text(this._history.forward());
  }

  _onexec(error) {
    if (error) {
      this._isError(true);
      dom.once(this.el, 'input', this._oninput.bind(this));
      return;
    }
    this._history.push(this._text());
    this._history.save();
    this._text('');
  }

  _oninput() {
    this._isError(false);
  }

  static _KEY_DOWN_MAP = {
    13: 'enter',
    38: 'up',
    40: 'down',
  };
}

class CommandInputHistory {
  constructor(props) {
    this._data = [];
    this._index = 0;
    this._size = props.size;
    this._key = props.key;
  }

  push(text) {
    this._data.push(text);
    this._data.splice(0, this._data.length - this._size);
    this._index = this._data.length;
  }

  back() {
    this._index = Math.max(this._index - 1, 0);
    return this._current();
  }

  forward() {
    this._index = Math.min(this._index + 1, this._data.length);
    return this._current();
  }

  load() {
    this._data = dom.load(this._key, []);
    this._index = this._data.length;
  }

  save() {
    dom.save(this._key, this._data);
  }

  _current() {
    return this._data[this._index] || '';
  }
}
