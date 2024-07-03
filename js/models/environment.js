import { helper } from '../helper.js';
import { Command } from './command.js';
import { CircuitModule } from './circuit-module.js';

export class Environment {
  constructor(props) {
    this._circuitModuleLoader = props.circuitModuleLoader;
    this._circuitModuleUnloader = props.circuitModuleUnloader;
    this._scriptLoader = props.scriptLoader;
    this._scriptSaver = props.scriptSaver;
    this._variables = [];
    this._bindings = [];
  }

  async exec(list) {
    if (typeof list === 'string') {
      list = Command.parseList(list);
    }
    for (const s of list) {
      const args = Command.parse(s);
      if (args.length === 0) {
        return;
      }
      const name = args.shift();
      await Environment._EXEC_TABLE[name].apply(this, args);
    }
  }

  async deleteVariable(name) {
    return await Environment._EXEC_TABLE[':delete'].call(this, name);
  }

  async loadScript(filePath) {
    return await Environment._EXEC_TABLE[':load'].call(this, filePath);
  }

  reorderVariables(names) {
    const len = names.length;
    if (len !== this._variables.length) {
      throw new Error('failed to reorder variables');
    }
    const from = this._variables.slice();
    const to = new Array(len);
    for (let i = 0; i < len; i++) {
      const name = names[i];
      const index = from.findIndex(v => (v && v.name === name));
      if (index === -1) {
        throw new Error('failed to reorder variables');
      }
      to[i] = from[index];
      from[index] = null;
    }
    this._variables = to;
  }

  _findVariable(name) {
    return this._variables.find(v => (v.name === name));
  }

  _findVariableByMember(member) {
    return this._variables.find(v => {
      return (v.circuitModule.get(member.name) === member);
    });
  }

  _findBinding(sourceMember, targetMember) {
    return this._bindings.find(b => {
      return (b.sourceMember === sourceMember && b.targetMember === targetMember);
    });
  }

  _fetchMember(variableName, memberName) {
    const v = this._findVariable(variableName);
    if (!v) {
      throw new Error(`PlayBuildScript runtime error: variable "${variableName}" is not defined`);
    }
    const m = v.circuitModule.get(memberName);
    if (!m) {
      throw new Error(`PlayBuildScript runtime error: member "${variableName}.${memberName}" is not defined`);
    }
    return m;
  }

  async _loadVariable(name, moduleName, dataText) {
    const circuitModule = await this._circuitModuleLoader(name, moduleName, dataText);
    if (!circuitModule) {
      throw new Error('PlayBuildScript runtime error: Invalid circuit module');
    }
    this._variables.push(new EnvironmentVariable({ name, moduleName, circuitModule }));
  }

  async _unloadVariable(name) {
    await this._circuitModuleUnloader(name);
    this._deleteVariable(name);
  }

  _deleteVariable(name) {
    const v = this._findVariable(name);
    this._bindings.filter(b => {
      return (this._findVariableByMember(b.sourceMember) === v || this._findVariableByMember(b.targetMember) === v);
    }).forEach(b => {
      CircuitModule.unbind(b.sourceMember, b.targetMember);
      helper.remove(this._bindings, b);
    });
    helper.remove(this._variables, v);
  }

  _bind(sourceMember, targetMember) {
    if (this._findBinding(sourceMember, targetMember)) {
      throw new Error('PlayBuildScript runtime error: Already bound');
    }
    CircuitModule.bind(sourceMember, targetMember);
    this._bindings.push(new EnvironmentBinding({
      sourceMember: sourceMember,
      targetMember: targetMember,
    }));
  }

  _unbind(sourceMember, targetMember) {
    const b = this._findBinding(sourceMember, targetMember);
    if (!b) {
      throw new Error('PlayBuildScript runtime error: Not bound');
    }
    CircuitModule.unbind(sourceMember, targetMember);
    helper.remove(this._bindings, b);
  }

  async _loadScript(text, fileName) {
    for (const [i, line] of text.split(/\r\n|\r|\n/g).entries()) {
      try {
        await this.exec(line);
      } catch (e) {
        throw new SyntaxError(e.message, fileName, i + 1);
      }
    }
  }

  _generateScript() {
    const variableScript = this._variables.map(v => {
      let c = `${v.name}:${v.moduleName}`;
      const s = v.circuitModule.serialize();
      if (s != null) {
        c += ` '${s.replace(/'/g, '\\\'')}'`;
      }
      return c;
    }).join('\n');
    const bindingScript = this._bindings.map(b => {
      const l = `${this._findVariableByMember(b.sourceMember).name}.${b.sourceMember.name}`;
      const r = `${this._findVariableByMember(b.targetMember).name}.${b.targetMember.name}`;
      return `${l} >> ${r}`;
    }).join('\n');
    const s = `${variableScript}\n${bindingScript}`.trim();
    return `${s}\n`;
  }

  static _EXEC_TABLE = {
    ':new'(variableName, moduleName, dataText) {
      if (this._findVariable(variableName)) {
        throw new Error(`PlayBuildScript runtime error: variable "${variableName}" is already defined`);
      }
      return this._loadVariable(variableName, moduleName, dataText);
    },
    ':bind'(sourceVariableName, sourceMemberName, targetVariableName, targetMemberName) {
      const s = this._fetchMember(sourceVariableName, sourceMemberName);
      const t = this._fetchMember(targetVariableName, targetMemberName);
      this._bind(s, t);
    },
    ':unbind'(sourceVariableName, sourceMemberName, targetVariableName, targetMemberName) {
      const s = this._fetchMember(sourceVariableName, sourceMemberName);
      const t = this._fetchMember(targetVariableName, targetMemberName);
      this._unbind(s, t);
    },
    ':send'(variableName, memberName, dataText) {
      this._fetchMember(variableName, memberName)(dataText);
    },
    ':delete'(variableName) {
      if (!this._findVariable(variableName)) {
        throw new Error(`PlayBuildScript runtime error: variable "${variableName}" is not defined`);
      }
      return this._unloadVariable(variableName);
    },
    ':reset'() {
      return Promise.all(this._variables.map(variable => {
        return this._unloadVariable(variable.name);
      }));
    },
    async ':load'(filePath) {
      const s = await this._scriptLoader(filePath);
      return this._loadScript(s.text, s.fileName);
    },
    ':save'(filePath) {
      return this._scriptSaver(filePath, this._generateScript());
    },
  };
}

class EnvironmentVariable {
  constructor(props) {
    this.name = props.name;
    this.moduleName = props.moduleName;
    this.circuitModule = props.circuitModule;
  }
}

class EnvironmentBinding {
  constructor(props) {
    this.sourceMember = props.sourceMember;
    this.targetMember = props.targetMember;
  }
}
