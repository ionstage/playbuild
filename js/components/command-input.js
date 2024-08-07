import { jCore } from '../bundle/jcore.js';
import { dom } from '../dom.js';

export class CommandInput extends jCore.Component {
  constructor(el) {
    super(el);
    this.disabled = this.prop(false);
    this._needsFocus = false;
    this._needsBlur = false;
    this._history = new CommandInputHistory({
      size: 100,
      key: 'playbuild/input-history',
    });
    this._oninit();
  }

  focus() {
    this._needsFocus = true;
    this._needsBlur = false;
    this.markDirty();
  }

  blur() {
    this._needsFocus = false;
    this._needsBlur = true;
    this.markDirty();
  }

  onredraw() {
    this.redrawBy('disabled', disabled => {
      dom.disabled(this.el, disabled);
    });

    if (this._needsFocus) {
      dom.focus(this.el);
      this._needsFocus = false;
    }

    if (this._needsBlur) {
      dom.blur(this.el);
      this._needsBlur = false;
    }
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
    const key = CommandInput._KEY_DOWN_MAP[dom.key(event)];
    if (key) {
      this._isError(false);
      this[`_on${key}`](event);
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
    Enter: 'enter',
    ArrowUp: 'up',
    ArrowDown: 'down',
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
