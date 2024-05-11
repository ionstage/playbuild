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
    const source = sourceMember.unwrap(Wrapper.KEY).callee;
    const target = targetMember.unwrap(Wrapper.KEY).callee;
    circuit.bind(source, target);
  }

  static unbind(sourceMember, targetMember) {
    const source = sourceMember.unwrap(Wrapper.KEY).callee;
    const target = targetMember.unwrap(Wrapper.KEY).callee;
    circuit.unbind(source, target);
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
    const wrapper = new Wrapper(this, this._call.bind(this));
    return Object.defineProperty(wrapper, 'name', { value: name });
  }
}
