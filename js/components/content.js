import { jCore } from '../bundle/jcore.js';
import { helper } from '../helper.js';
import { Variable } from './variable.js';

export class Content extends jCore.Component {
  constructor(el) {
    super(el);
    this._variables = [];
  }

  async loadVariable(name, moduleName) {
    let v = this._findVariable(name);
    if (v) {
      return v;
    }
    v = new Variable({ name, moduleName });
    v.parentElement(this.el);
    v.redraw();
    try {
      await v.load();
      v.on('delete', this.emit.bind(this, 'delete-variable', v.name()));
      this._variables.push(v);
      return v;
    } catch (e) {
      v.parentElement(null);
      throw e;
    }
  }

  deleteVariable(name) {
    const v = this._findVariable(name);
    if (v) {
      v.unload();
      v.removeAllListeners();
      v.parentElement(null);
      helper.remove(this._variables, v);
    }
  }

  _findVariable(name) {
    return this._variables.find(v => (v.name() === name));
  }
}
