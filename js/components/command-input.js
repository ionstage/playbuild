import { jCore } from '../bundle/jcore.js';
import { dom } from '../dom.js';

export var CommandInput = jCore.Component.inherits(function() {
  this.history = new CommandInput.History({
    size: 100,
    key: 'playbuild/input-history',
  });
});

CommandInput.prototype.text = function(value) {
  return dom.value(this.element(), value);
};

CommandInput.prototype.disabled = function(value) {
  dom.disabled(this.element(), value);
};

CommandInput.prototype.isError = function(value) {
  dom.toggleClass(this.element(), 'error', value);
};

CommandInput.prototype.focus = function() {
  dom.focus(this.element());
};

CommandInput.prototype.blur = function() {
  dom.blur(this.element());
};

CommandInput.prototype.done = function(error) {
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
};

CommandInput.prototype.oninit = function() {
  this.history.load();
  this.focus();
  dom.on(this.element(), 'keydown', this.onkeydown.bind(this));
};

CommandInput.prototype.onkeydown = (function() {
  var map = {
    13: 'enter',
    38: 'up',
    40: 'down',
  };
  return function(event) {
    var key = map[event.which];
    if (key) {
      this.isError(false);
      this['on' + key](event);
    }
  };
})();

CommandInput.prototype.onenter = function() {
  var text = this.text();
  if (text) {
    this.disabled(true);
    this.emit('exec', text, this.done.bind(this));
  }
};

CommandInput.prototype.onup = function(event) {
  dom.cancel(event);
  this.text(this.history.back());
};

CommandInput.prototype.ondown = function(event) {
  dom.cancel(event);
  this.text(this.history.forward());
};

CommandInput.prototype.oninput = function() {
  this.isError(false);
};

CommandInput.History = (function() {
  var History = function(props) {
    this.data = [];
    this.index = 0;
    this.size = props.size;
    this.key = props.key;
  };

  History.prototype.current = function() {
    return this.data[this.index] || '';
  };

  History.prototype.push = function(text) {
    this.data.push(text);
    this.data.splice(0, this.data.length - this.size);
    this.index = this.data.length;
  };

  History.prototype.back = function() {
    this.index = Math.max(this.index - 1, 0);
    return this.current();
  };

  History.prototype.forward = function() {
    this.index = Math.min(this.index + 1, this.data.length);
    return this.current();
  };

  History.prototype.load = function() {
    this.data = dom.load(this.key, []);
    this.index = this.data.length;
  };

  History.prototype.save = function() {
    dom.save(this.key, this.data);
  };

  return History;
})();
