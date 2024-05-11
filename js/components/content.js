import { jCore } from '../bundle/jcore.js';
import { Variable } from './variable.js';

export class Content extends jCore.Component {
  constructor(el) {
    super(el);
    this._variableTable = {};
  }

  async loadVariable(name, moduleName) {
    const variable = new Variable({ name, moduleName });
    variable.parentElement(this.el);
    variable.redraw();
    try {
      await variable.load();
      this._variableTable[name] = variable;
      return variable;
    } catch (e) {
      variable.parentElement(null);
      throw e;
    }
  }

  deleteVariable(name) {
    this._variableTable[name].parentElement(null);
    delete this._variableTable[name];
  }
}
