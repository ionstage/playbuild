import { helper } from '../helper.js';
import { Command } from './command.js';
import { CircuitModule } from './circuit-module.js';

export class Environment {
  constructor(props) {
    this.circuitModuleLoader = props.circuitModuleLoader;
    this.circuitModuleUnloader = props.circuitModuleUnloader;
    this.scriptLoader = props.scriptLoader;
    this.scriptSaver = props.scriptSaver;
    this.variableTable = {};
    this.bindings = [];
  }

  findVariable(member) {
    return Object.values(this.variableTable).find(variable => {
      return (variable.circuitModule.get(member.name) === member);
    });
  }

  findBinding(sourceMember, targetMember) {
    return this.bindings.find(binding => {
      return (binding.sourceMember === sourceMember && binding.targetMember === targetMember);
    });
  }

  fetchMember(variableName, memberName) {
    if (!this.variableTable.hasOwnProperty(variableName)) {
      throw new Error('PlayBuildScript runtime error: variable "' + variableName + '" is not defined');
    }
    const member = this.variableTable[variableName].circuitModule.get(memberName);
    if (!member) {
      throw new Error('PlayBuildScript runtime error: member "' + variableName + '.' + memberName + '" is not defined');
    }
    return member;
  }

  async loadVariable(name, moduleName) {
    const circuitModule = await this.circuitModuleLoader(name, moduleName);
    if (!circuitModule) {
      throw new Error('PlayBuildScript runtime error: Invalid circuit module');
    }
    this.variableTable[name] = new EnvironmentVariable({ name, moduleName, circuitModule });
  }

  async unloadVariable(name) {
    await this.circuitModuleUnloader(name);
    this.deleteVariable(name);
  }

  deleteVariable(name) {
    const variable = this.variableTable[name];
    this.bindings.filter(binding => {
      return (this.findVariable(binding.sourceMember) === variable || this.findVariable(binding.targetMember) === variable);
    }).forEach(binding => {
      CircuitModule.unbind(binding.sourceMember, binding.targetMember);
      helper.remove(this.bindings, binding);
    });
    delete this.variableTable[name];
  }

  bind(sourceMember, targetMember) {
    if (this.findBinding(sourceMember, targetMember)) {
      throw new Error('PlayBuildScript runtime error: Already bound');
    }
    CircuitModule.bind(sourceMember, targetMember);
    this.bindings.push(new EnvironmentBinding({
      sourceMember: sourceMember,
      targetMember: targetMember,
    }));
  }

  unbind(sourceMember, targetMember) {
    const binding = this.findBinding(sourceMember, targetMember);
    if (!binding) {
      throw new Error('PlayBuildScript runtime error: Not bound');
    }
    CircuitModule.unbind(sourceMember, targetMember);
    helper.remove(this.bindings, binding);
  }

  async loadScript(text, fileName) {
    for (const [i, line] of text.split(/\r\n|\r|\n/g).entries()) {
      try {
        await this.exec(line);
      } catch (e) {
        throw new SyntaxError(e.message, fileName, i + 1);
      }
    }
  }

  generateScript() {
    const variableScript = Object.values(this.variableTable).map(variable => {
      return variable.name + ':' + variable.moduleName;
    }).join('\n');
    const bindingScript = this.bindings.map(binding => {
      return (this.findVariable(binding.sourceMember).name + '.' + binding.sourceMember.name + ' >> ' +
              this.findVariable(binding.targetMember).name + '.' + binding.targetMember.name);
    }).join('\n');
    return (variableScript + '\n' + bindingScript).trim() + '\n';
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
      await Environment.#EXEC_TABLE[name].apply(this, args);
    }
  }

  static #EXEC_TABLE = {
    new(variableName, moduleName) {
      if (this.variableTable.hasOwnProperty(variableName)) {
        throw new Error('PlayBuildScript runtime error: variable "' + variableName + '" is already defined');
      }
      return this.loadVariable(variableName, moduleName);
    },
    bind(sourceVariableName, sourceMemberName, targetVariableName, targetMemberName) {
      const sourceMember = this.fetchMember(sourceVariableName, sourceMemberName);
      const targetMember = this.fetchMember(targetVariableName, targetMemberName);
      this.bind(sourceMember, targetMember);
    },
    unbind(sourceVariableName, sourceMemberName, targetVariableName, targetMemberName) {
      const sourceMember = this.fetchMember(sourceVariableName, sourceMemberName);
      const targetMember = this.fetchMember(targetVariableName, targetMemberName);
      this.unbind(sourceMember, targetMember);
    },
    send(variableName, memberName, dataText) {
      this.fetchMember(variableName, memberName)(dataText);
    },
    delete(variableName) {
      if (!this.variableTable.hasOwnProperty(variableName)) {
        throw new Error('PlayBuildScript runtime error: variable "' + variableName + '" is not defined');
      }
      return this.unloadVariable(variableName);
    },
    reset() {
      return Promise.all(Object.keys(this.variableTable).map(variableName => {
        return this.unloadVariable(variableName);
      }));
    },
    async load(filePath) {
      const result = await this.scriptLoader(filePath);
      return this.loadScript(result.text, result.fileName);
    },
    save(filePath) {
      return this.scriptSaver(filePath, this.generateScript());
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
