import { jCore } from '../bundle/jcore.js';
import { dom } from '../dom.js';

export class CommandInput extends jCore.Component {
  constructor(props) {
    super(props);
    this.history = new CommandInputHistory({
      size: 100,
      key: 'playbuild/input-history',
    });
    this.oninit();
  }

  text(value) {
    return dom.value(this.element(), value);
  }

  disabled(value) {
    dom.disabled(this.element(), value);
  }

  isError(value) {
    dom.toggleClass(this.element(), 'error', value);
  }

  focus() {
    dom.focus(this.element());
  }

  blur() {
    dom.blur(this.element());
  }

  done(error) {
    if (!error) {
      this.history.push(this.text());
      this.history.save();
      this.text('');
    } else {
      this.isError(true);
      dom.once(this.element(), 'input', this.oninput.bind(this));
    }
    this.disabled(false);
    this.focus();
  }

  oninit() {
    this.history.load();
    this.focus();
    dom.on(this.element(), 'keydown', this.onkeydown.bind(this));
  }

  onkeydown(event) {
    var key = CommandInput.#keyDownMap[event.which];
    if (key) {
      this.isError(false);
      this['on' + key](event);
    }
  }

  onenter() {
    var text = this.text();
    if (text) {
      this.disabled(true);
      this.emit('exec', text, this.done.bind(this));
    }
  }

  onup(event) {
    dom.cancel(event);
    this.text(this.history.back());
  }

  ondown(event) {
    dom.cancel(event);
    this.text(this.history.forward());
  }

  oninput() {
    this.isError(false);
  }

  static #keyDownMap = {
    13: 'enter',
    38: 'up',
    40: 'down',
  };
}

class CommandInputHistory {
  constructor(props) {
    this.data = [];
    this.index = 0;
    this.size = props.size;
    this.key = props.key;
  }

  current() {
    return this.data[this.index] || '';
  }

  push(text) {
    this.data.push(text);
    this.data.splice(0, this.data.length - this.size);
    this.index = this.data.length;
  }

  back() {
    this.index = Math.max(this.index - 1, 0);
    return this.current();
  }

  forward() {
    this.index = Math.min(this.index + 1, this.data.length);
    return this.current();
  }

  load() {
    this.data = dom.load(this.key, []);
    this.index = this.data.length;
  }

  save() {
    dom.save(this.key, this.data);
  }
}
