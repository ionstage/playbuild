import { jCore } from '../bundle/jcore.js';
import { helper } from '../helper.js';
import { dom } from '../dom.js';
import { Variable } from './variable.js';

export class Content extends jCore.Component {
  constructor(el) {
    super(el);
    this._height = this.prop(0);
    this._dragCount = this.prop(0);
    this._variables = [];
    this._draggable = new ContentDraggable(this);
    this._onresize_variable = this._onresize_variable.bind(this);
    this._oninit();
  }

  incrementDragCount() {
    this._dragCount(this._dragCount() + 1);
  }

  decrementDragCount() {
    this._dragCount(this._dragCount() - 1);
  }

  findVariable(name) {
    return this._variables.find(v => (v.name() === name));
  }

  async loadVariable(name, moduleName, dataText) {
    let v = this.findVariable(name);
    if (v) {
      return v;
    }
    const m = Content._VARIABLE_MARGIN;
    const top = this._variables.reduce((t, v) => t + v.height() + m, m);
    v = new Variable({ name, moduleName, top });
    v.parentElement(this.el);
    v.redraw();
    try {
      await v.load(dataText);
      v.on('resize', this._onresize_variable);
      v.on('delete', this.emit.bind(this, 'delete-variable', v.name()));
      this._variables.push(v);
      this._onresize_variable();
      return v;
    } catch (e) {
      v.parentElement(null);
      throw e;
    }
  }

  deleteVariable(name) {
    const v = this.findVariable(name);
    if (v) {
      v.unload();
      v.removeAllListeners();
      v.parentElement(null);
      helper.remove(this._variables, v);
      this._onresize_variable();
    }
  }

  moveVariable(variable, top) {
    variable.top(top);
    this._onresize_variable();
  }

  reorder() {
    const names = this._variables.map(v => v.name());
    const orderedNames = Content._reorderVariables(this._variables).map(v => v.name());
    const reordered = !(orderedNames.every((n, i) => (n === names[i])));
    if (reordered) {
      this.emit('reorder-variables', orderedNames);
    }
    this._onresize_variable();
  }

  onredraw() {
    this.redrawBy('_height', height => {
      dom.css(this.el, { height: `${height}px` });
    });

    this.redrawBy('_dragCount', dragCount => {
      dom.toggleClass(this.el, 'dragging', (dragCount > 0));
    });
  }

  _oninit() {
    this._draggable.enable();
  }

  _onresize_variable() {
    if (this._variables.length === 0) {
      this._height(0);
      return;
    }
    const m = Content._VARIABLE_MARGIN;
    const h = Content._reorderVariables(this._variables.slice()).reduce((t, v) => {
      if (!v.dragging()) {
        v.top(t);
      }
      return t + v.height() + m;
    }, m);
    this._height(h);
  }

  static _VARIABLE_MARGIN = 24;

  static _reorderVariables(variables) {
    return variables.sort((a, b) => {
      const at = a.top();
      const bt = b.top();
      if (at - bt === 0) {
        return (a.dragging() ? -1 : (b.dragging() ? 1 : 0));
      }
      return at - bt;
    });
  }
}

class ContentDraggable extends jCore.Draggable {
  constructor(content) {
    super(content);
  }

  onstart(content, x, y, event, context) {
    context.variable = ContentDraggable._findVariableByTarget(content, dom.target(event));
    if (context.variable) {
      dom.cancel(event);
      content.incrementDragCount();
      context.top = context.variable.top();
    }
  }

  onmove(content, dx, dy, event, context) {
    if (context.variable) {
      context.variable.dragging(true);
      content.moveVariable(context.variable, context.top + dy);
    }
  }

  onend(content, dx, dy, event, context) {
    if (context.variable) {
      content.decrementDragCount();
      context.variable.dragging(false);
      content.reorder();
    }
  }

  static _findVariableByTarget(content, target) {
    if (!dom.hasClass(target, 'variable-header')) {
      return null;
    }
    const name = dom.data(dom.parent(target), 'name');
    return content.findVariable(name);
  }
}
