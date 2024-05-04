(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var Command = app.Command || require('./command.js');
  var CircuitModule = app.CircuitModule || require('./circuit-module.js');

  var Environment = function(props) {
    this.circuitModuleLoader = props.circuitModuleLoader;
    this.circuitModuleUnloader = props.circuitModuleUnloader;
    this.scriptLoader = props.scriptLoader;
    this.scriptSaver = props.scriptSaver;
    this.variableTable = {};
    this.bindings = [];
  };

  Environment.prototype.findVariable = function(member) {
    return helper.find(helper.values(this.variableTable), function(variable) {
      return (variable.circuitModule.get(member.name) === member);
    });
  };

  Environment.prototype.findBinding = function(sourceMember, targetMember) {
    return helper.find(this.bindings, function(binding) {
      return (binding.sourceMember === sourceMember && binding.targetMember === targetMember);
    });
  };

  Environment.prototype.fetchMember = function(variableName, memberName) {
    if (!this.variableTable.hasOwnProperty(variableName)) {
      throw new Error('OrderScript runtime error: variable "' + variableName + '" is not defined');
    }
    var member = this.variableTable[variableName].circuitModule.get(memberName);
    if (!member) {
      throw new Error('OrderScript runtime error: member "' + variableName + '.' + memberName + '" is not defined');
    }
    return member;
  };

  Environment.prototype.loadVariable = function(name, moduleName) {
    return this.circuitModuleLoader(name, moduleName).then(function(circuitModule) {
      if (!circuitModule) {
        throw new Error('OrderScript runtime error: Invalid circuit module');
      }
      this.variableTable[name] = new Environment.Variable({
        name: name,
        moduleName: moduleName,
        circuitModule: circuitModule,
      });
    }.bind(this));
  };

  Environment.prototype.unloadVariable = function(name) {
    return this.circuitModuleUnloader(name).then(function() {
      this.deleteVariable(name);
    }.bind(this));
  };

  Environment.prototype.deleteVariable = function(name) {
    var variable = this.variableTable[name];
    this.bindings.filter(function(binding) {
      return (this.findVariable(binding.sourceMember) === variable || this.findVariable(binding.targetMember) === variable);
    }.bind(this)).forEach(function(binding) {
      CircuitModule.unbind(binding.sourceMember, binding.targetMember);
      helper.remove(this.bindings, binding);
    }.bind(this));
    delete this.variableTable[name];
  };

  Environment.prototype.bind = function(sourceMember, targetMember) {
    if (this.findBinding(sourceMember, targetMember)) {
      throw new Error('OrderScript runtime error: Already bound');
    }
    CircuitModule.bind(sourceMember, targetMember);
    this.bindings.push(new Environment.Binding({
      sourceMember: sourceMember,
      targetMember: targetMember,
    }));
  };

  Environment.prototype.unbind = function(sourceMember, targetMember) {
    var binding = this.findBinding(sourceMember, targetMember);
    if (!binding) {
      throw new Error('OrderScript runtime error: Not bound');
    }
    CircuitModule.unbind(sourceMember, targetMember);
    helper.remove(this.bindings, binding);
  };

  Environment.prototype.loadScript = function(text, fileName) {
    return text.split(/\r\n|\r|\n/g).reduce(function(p, line, i) {
      return p.then(function() {
        return this.exec(line).catch(function(e) {
          throw new SyntaxError(e.message, fileName, i + 1);
        });
      }.bind(this));
    }.bind(this), Promise.resolve());
  };

  Environment.prototype.generateScript = function() {
    var variableScript = helper.values(this.variableTable).map(function(variable) {
      return variable.name + ':' + variable.moduleName;
    }).join('\n');
    var bindingScript = this.bindings.map(function(binding) {
      return (this.findVariable(binding.sourceMember).name + '.' + binding.sourceMember.name + ' >> ' +
              this.findVariable(binding.targetMember).name + '.' + binding.targetMember.name);
    }.bind(this)).join('\n');
    return (variableScript + '\n' + bindingScript).trim() + '\n';
  };

  Environment.prototype.exec = function(list) {
    if (typeof list === 'string') {
      list = [list];
    }
    return list.reduce(function(p, s) {
      return p.then(function() {
        var args = Command.parse(s);
        if (args.length === 0) {
          return;
        }
        var name = args.shift();
        return Environment.EXEC_TABLE[name].apply(this, args);
      }.bind(this));
    }.bind(this), Promise.resolve());
  };

  Environment.EXEC_TABLE = {
    new: function(variableName, moduleName) {
      if (this.variableTable.hasOwnProperty(variableName)) {
        throw new Error('OrderScript runtime error: variable "' + variableName + '" is already defined');
      }
      return this.loadVariable(variableName, moduleName);
    },
    bind: function(sourceVariableName, sourceMemberName, targetVariableName, targetMemberName) {
      var sourceMember = this.fetchMember(sourceVariableName, sourceMemberName);
      var targetMember = this.fetchMember(targetVariableName, targetMemberName);
      this.bind(sourceMember, targetMember);
    },
    unbind: function(sourceVariableName, sourceMemberName, targetVariableName, targetMemberName) {
      var sourceMember = this.fetchMember(sourceVariableName, sourceMemberName);
      var targetMember = this.fetchMember(targetVariableName, targetMemberName);
      this.unbind(sourceMember, targetMember);
    },
    send: function(variableName, memberName, dataText) {
      this.fetchMember(variableName, memberName)(dataText);
    },
    delete: function(variableName) {
      if (!this.variableTable.hasOwnProperty(variableName)) {
        throw new Error('OrderScript runtime error: variable "' + variableName + '" is not defined');
      }
      return this.unloadVariable(variableName);
    },
    reset: function() {
      return Promise.all(Object.keys(this.variableTable).map(function(variableName) {
        return this.unloadVariable(variableName);
      }.bind(this)));
    },
    load: function(filePath) {
      return this.scriptLoader(filePath).then(function(result) {
        return this.loadScript(result.text, result.fileName);
      }.bind(this));
    },
    save: function(filePath) {
      return this.scriptSaver(filePath, this.generateScript());
    },
  };

  Environment.Variable = function(props) {
    this.name = props.name;
    this.moduleName = props.moduleName;
    this.circuitModule = props.circuitModule;
  };

  Environment.Binding = function(props) {
    this.sourceMember = props.sourceMember;
    this.targetMember = props.targetMember;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Environment;
  } else {
    app.Environment = Environment;
  }
})(this.app || (this.app = {}));
