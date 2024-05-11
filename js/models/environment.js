import { helper } from '../helper.js';
import { Command } from './command.js';
import { CircuitModule } from './circuit-module.js';

export class Environment {
  constructor(props) {
    this._circuitModuleLoader = props.circuitModuleLoader;
    this._circuitModuleUnloader = props.circuitModuleUnloader;
    this._scriptLoader = props.scriptLoader;
    this._scriptSaver = props.scriptSaver;
    this._variableTable = {};
    this._bindings = [];
  }

  async exec(list) {
    if (typeof list === 'string') {
      list = [list];
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

  _findVariable(member) {
    return Object.values(this._variableTable).find(variable => {
      return (variable.circuitModule.get(member.name) === member);
    });
  }

  _findBinding(sourceMember, targetMember) {
    return this._bindings.find(binding => {
      return (binding.sourceMember === sourceMember && binding.targetMember === targetMember);
    });
  }

  _fetchMember(variableName, memberName) {
    if (!this._variableTable.hasOwnProperty(variableName)) {
      throw new Error('PlayBuildScript runtime error: variable "' + variableName + '" is not defined');
    }
    const member = this._variableTable[variableName].circuitModule.get(memberName);
    if (!member) {
      throw new Error('PlayBuildScript runtime error: member "' + variableName + '.' + memberName + '" is not defined');
    }
    return member;
  }

  async _loadVariable(name, moduleName) {
    const circuitModule = await this._circuitModuleLoader(name, moduleName);
    if (!circuitModule) {
      throw new Error('PlayBuildScript runtime error: Invalid circuit module');
    }
    this._variableTable[name] = new EnvironmentVariable({ name, moduleName, circuitModule });
  }

  async _unloadVariable(name) {
    await this._circuitModuleUnloader(name);
    this._deleteVariable(name);
  }

  _deleteVariable(name) {
    const variable = this._variableTable[name];
    this._bindings.filter(binding => {
      return (this._findVariable(binding.sourceMember) === variable || this._findVariable(binding.targetMember) === variable);
    }).forEach(binding => {
      CircuitModule.unbind(binding.sourceMember, binding.targetMember);
      helper.remove(this._bindings, binding);
    });
    delete this._variableTable[name];
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
    const binding = this._findBinding(sourceMember, targetMember);
    if (!binding) {
      throw new Error('PlayBuildScript runtime error: Not bound');
    }
    CircuitModule.unbind(sourceMember, targetMember);
    helper.remove(this._bindings, binding);
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
    const variableScript = Object.values(this._variableTable).map(variable => {
      return variable.name + ':' + variable.moduleName;
    }).join('\n');
    const bindingScript = this._bindings.map(binding => {
      return (this._findVariable(binding.sourceMember).name + '.' + binding.sourceMember.name + ' >> ' +
              this._findVariable(binding.targetMember).name + '.' + binding.targetMember.name);
    }).join('\n');
    return (variableScript + '\n' + bindingScript).trim() + '\n';
  }

  static _EXEC_TABLE = {
    new(variableName, moduleName) {
      if (this._variableTable.hasOwnProperty(variableName)) {
        throw new Error('PlayBuildScript runtime error: variable "' + variableName + '" is already defined');
      }
      return this._loadVariable(variableName, moduleName);
    },
    bind(sourceVariableName, sourceMemberName, targetVariableName, targetMemberName) {
      const sourceMember = this._fetchMember(sourceVariableName, sourceMemberName);
      const targetMember = this._fetchMember(targetVariableName, targetMemberName);
      this._bind(sourceMember, targetMember);
    },
    unbind(sourceVariableName, sourceMemberName, targetVariableName, targetMemberName) {
      const sourceMember = this._fetchMember(sourceVariableName, sourceMemberName);
      const targetMember = this._fetchMember(targetVariableName, targetMemberName);
      this._unbind(sourceMember, targetMember);
    },
    send(variableName, memberName, dataText) {
      this._fetchMember(variableName, memberName)(dataText);
    },
    delete(variableName) {
      if (!this._variableTable.hasOwnProperty(variableName)) {
        throw new Error('PlayBuildScript runtime error: variable "' + variableName + '" is not defined');
      }
      return this._unloadVariable(variableName);
    },
    reset() {
      return Promise.all(Object.keys(this._variableTable).map(variableName => {
        return this._unloadVariable(variableName);
      }));
    },
    async load(filePath) {
      const result = await this._scriptLoader(filePath);
      return this._loadScript(result.text, result.fileName);
    },
    save(filePath) {
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
