import { circuit } from '../bundle/circuit.js';
import { helper } from '../helper.js';
const Wrapper = helper.wrapper();

export class CircuitModule {
  constructor(memberTable, options) {
    this._memberTable = memberTable;
    this._options = options;
  }

  get(name) {
    return this._memberTable[name] || null;
  }

  serialize() {
    if (typeof this._options.serialize === 'function') {
      return this._options.serialize();
    }
    return null;
  }

  deserialize(s) {
    if (s != null && typeof this._options.deserialize === 'function') {
      this._options.deserialize(s);
    }
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
    constructor(members, options) {
      return new CircuitModule(members.reduce((ret, member) => {
        ret[member.name] = new CircuitModuleMember(member);
        return ret;
      }, {}), options || {});
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
