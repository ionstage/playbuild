import { jCore } from '../bundle/jcore.js';
import { Variable } from './variable.js';

export class Content extends jCore.Component {
  constructor(props) {
    super(props);
    this.variableTable = {};
  }

  loadVariable(name, moduleName) {
    const variable = new Variable({
      name: name,
      moduleName: moduleName,
    });
    variable.parentElement(this.element());
    variable.redraw();
    return variable.load().then(() => {
      this.variableTable[name] = variable;
      return variable;
    }).catch(e => {
      variable.parentElement(null);
      throw e;
    });
  }

  deleteVariable(name) {
    this.variableTable[name].parentElement(null);
    delete this.variableTable[name];
  }
}
