import { jCore } from '../bundle/jcore.js';
import { helper } from '../helper.js';
import { Variable } from './variable.js';

export class Content extends jCore.Component {
  constructor(el) {
    super(el);
    this._variables = [];
  }

  async loadVariable(name, moduleName) {
    let variable = this._findVariable(name);
    if (variable) {
      return variable;
    }
    variable = new Variable({ name, moduleName });
    variable.parentElement(this.el);
    variable.redraw();
    try {
      await variable.load();
      this._variables.push(variable);
      return variable;
    } catch (e) {
      variable.parentElement(null);
      throw e;
    }
  }

  deleteVariable(name) {
    const variable = this._findVariable(name);
    if (variable) {
      variable.parentElement(null);
      helper.remove(this._variables, variable);
    }
  }

  _findVariable(name) {
    return this._variables.find(variable => (variable.name() === name));
  }
}
