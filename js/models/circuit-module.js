(function(app) {
  'use strict';

  var circuit = require('circuit');
  var helper = app.helper || require('../helper.js');
  var Wrapper = helper.wrapper();

  var CircuitModule = function(memberTable) {
    this.memberTable = memberTable;
  };

  CircuitModule.prototype.get = function(name) {
    return this.memberTable[name] || null;
  };

  CircuitModule.bind = function(sourceMember, targetMember) {
    var source = sourceMember.unwrap(Wrapper.KEY).callee;
    var target = targetMember.unwrap(Wrapper.KEY).callee;
    circuit.bind(source, target);
  };

  CircuitModule.unbind = function(sourceMember, targetMember) {
    var source = sourceMember.unwrap(Wrapper.KEY).callee;
    var target = targetMember.unwrap(Wrapper.KEY).callee;
    circuit.unbind(source, target);
  };

  CircuitModule.Member = (function() {
    var Member = function(props) {
      this.callee = circuit[props.type](props.arg);
      return this.wrapper(props.name);
    };

    Member.prototype.call = function() {
      return this.callee.apply(this, arguments);
    };

    Member.prototype.wrapper = function(name) {
      var wrapper = new Wrapper(this, this.call.bind(this));
      return Object.defineProperty(wrapper, 'name', { value: name });
    };

    return Member;
  })();

  CircuitModule.OrderModule = function(members) {
    return new CircuitModule(members.reduce(function(ret, member) {
      ret[member.name] = new CircuitModule.Member(member);
      return ret;
    }, {}));
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CircuitModule;
  } else {
    app.CircuitModule = CircuitModule;
  }
})(this.app || (this.app = {}));
