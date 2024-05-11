import { circuit } from '../bundle/circuit.js';
import { helper } from '../helper.js';
const Wrapper = helper.wrapper();

export class CircuitModule {
  constructor(memberTable) {
    this._memberTable = memberTable;
  }

  get(name) {
    return this._memberTable[name] || null;
  }

  static bind(sourceMember, targetMember) {
    const s = sourceMember.unwrap(Wrapper.KEY).callee;
    const t = targetMember.unwrap(Wrapper.KEY).callee;
    circuit.bind(s, t);
  }

  static unbind(sourceMember, targetMember) {
    const s = sourceMember.unwrap(Wrapper.KEY).callee;
    const t = targetMember.unwrap(Wrapper.KEY).callee;
    circuit.unbind(s, t);
  }

  static PlayBuildModule = class {
    constructor(members) {
      return new CircuitModule(members.reduce((ret, member) => {
        ret[member.name] = new CircuitModuleMember(member);
        return ret;
      }, {}));
    }
  };
}

class CircuitModuleMember {
  constructor(props) {
    this.callee = circuit[props.type](props.arg);
    return this._wrapper(props.name);
  }

  _call() {
    return this.callee.apply(this, arguments);
  }

  _wrapper(name) {
    const w = new Wrapper(this, this._call.bind(this));
    return Object.defineProperty(w, 'name', { value: name });
  }
}
