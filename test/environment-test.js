var assert = require('assert');
var sinon = require('sinon');
var CircuitModule = require('../js/models/circuit-module.js');
var Environment = require('../js/models/environment.js');

function TestEnvironment(props) {
  return new Environment(Object.assign({
    circuitModuleLoader: function() {
      return Promise.resolve(new CircuitModule.OrderModule([]));
    },
    circuitModuleUnloader: function() {
      return Promise.resolve();
    },
    scriptLoader: function() {
      return Promise.resolve();
    },
    scriptSaver: function() {
      return Promise.resolve();
    },
  }, props));
}

describe('Environment', function() {
  describe('#exec', function() {
    it('accept empty command', function() {
      var env = TestEnvironment();
      return env.exec('');
    });

    it('create new variable', function() {
      var m = new CircuitModule.OrderModule([]);
      var f = sinon.spy(function() { return Promise.resolve(m); });
      var env = TestEnvironment({ circuitModuleLoader: f });
      return env.exec(':new x Module').then(function() {
        var x = env.variableTable.x;
        assert.equal(x.name, 'x');
        assert.equal(x.moduleName, 'Module');
        assert.equal(x.circuitModule, m);
        assert(f.calledWith('x', 'Module'));
      });
    });

    it('should not create variables with the same name', function() {
      var env = TestEnvironment();
      return env.exec([
        ':new x Module',
        ':new x Module',
      ]).catch(function(e) {
        assert(e instanceof Error);
      });
    });

    it('should not set circuit module to null', function() {
      var env = TestEnvironment({
        circuitModuleLoader: function() {
          return null;
        },
      });
      return env.exec(':new x Module').catch(function(e) {
        assert(e instanceof Error);
      });
    });

    it('bind circuit module members', function() {
      var env = TestEnvironment({
        circuitModuleLoader: function() {
          return Promise.resolve(new CircuitModule.OrderModule([
            { name: 'a', type: 'prop' },
            { name: 'b', type: 'prop' },
          ]));
        },
      });
      CircuitModule.bind = sinon.spy(CircuitModule.bind);
      return env.exec([
        ':new x Module',
        ':new y Module',
        ':bind x.a y.b',
      ]).then(function() {
        var a = env.variableTable.x.circuitModule.get('a');
        var b = env.variableTable.y.circuitModule.get('b');
        assert(CircuitModule.bind.calledWith(a, b));
        assert.equal(env.bindings.length, 1);
      });
    });

    it('unbind circuit module members', function() {
      var env = TestEnvironment({
        circuitModuleLoader: function() {
          return Promise.resolve(new CircuitModule.OrderModule([
            { name: 'a', type: 'prop' },
            { name: 'b', type: 'prop' },
          ]));
        },
      });
      CircuitModule.unbind = sinon.spy(CircuitModule.unbind);
      return env.exec([
        ':new x Module',
        ':new y Module',
        ':bind x.a y.b',
        ':unbind x.a y.b',
      ]).then(function() {
        var a = env.variableTable.x.circuitModule.get('a');
        var b = env.variableTable.y.circuitModule.get('b');
        assert(CircuitModule.unbind.calledWith(a, b));
        assert.equal(env.bindings.length, 0);
      });
    });

    it('send data to a member of circuit module', function() {
      var env = TestEnvironment({
        circuitModuleLoader: function() {
          return Promise.resolve(new CircuitModule.OrderModule([
            { name: 'a', type: 'prop' },
          ]));
        },
      });
      return env.exec([
        ':new x Module',
        ':send x.a data_text',
      ]).then(function() {
        var a = env.variableTable.x.circuitModule.get('a');
        assert.equal(a(), 'data_text');
      });
    });

    it('delete variable', function() {
      var f = sinon.spy(function() { return Promise.resolve(); });
      var env = TestEnvironment({ circuitModuleUnloader: f });
      return env.exec([
        ':new x Module',
        ':delete x',
      ]).then(function() {
        assert.equal(Object.keys(env.variableTable).length, 0);
        assert(f.calledOnce);
      });
    });

    it('unbind all circuit module members on deleting variable', function() {
      var env = TestEnvironment({
        circuitModuleLoader: function(variableName, moduleName) {
          return Promise.resolve(new CircuitModule.OrderModule([
            { name: 'a', type: 'prop' },
            { name: 'b', type: 'prop' },
          ]));
        },
      });
      var x, y, z;
      CircuitModule.unbind = sinon.spy(CircuitModule.unbind);
      return env.exec([
        ':new x Module',
        ':new y Module',
        ':new z Module',
        ':bind x.a y.a',
        ':bind x.b y.a',
        ':bind y.a z.a',
        ':bind y.a z.b',
        ':bind x.b y.b',
        ':bind y.b z.b',
      ]).then(function() {
        x = env.variableTable.x;
        y = env.variableTable.y;
        z = env.variableTable.z;
        return env.exec(':delete y');
      }).then(function() {
        var args = CircuitModule.unbind.args;
        assert.equal(args[0][0], x.circuitModule.get('a'));
        assert.equal(args[0][1], y.circuitModule.get('a'));
        assert.equal(args[1][0], x.circuitModule.get('b'));
        assert.equal(args[1][1], y.circuitModule.get('a'));
        assert.equal(args[2][0], y.circuitModule.get('a'));
        assert.equal(args[2][1], z.circuitModule.get('a'));
        assert.equal(args[3][0], y.circuitModule.get('a'));
        assert.equal(args[3][1], z.circuitModule.get('b'));
        assert.equal(args[4][0], x.circuitModule.get('b'));
        assert.equal(args[4][1], y.circuitModule.get('b'));
        assert.equal(args[5][0], y.circuitModule.get('b'));
        assert.equal(args[5][1], z.circuitModule.get('b'));
      });
    });

    it('reset', function() {
      var f = sinon.spy(function() { return Promise.resolve(); });
      var env = TestEnvironment({ circuitModuleUnloader: f });
      return env.exec([
        ':new x Module',
        ':new y Module',
        ':reset',
      ]).then(function() {
        assert.equal(Object.keys(env.variableTable).length, 0);
        assert(f.calledTwice);
      });
    });

    it('load command', function() {
      var f = sinon.spy(function() {
        return Promise.resolve({
          text: ':new x Module',
          fileName: 'test.os',
        });
      });
      var env = TestEnvironment({ scriptLoader: f });
      return env.exec(':load /path/to/script').then(function() {
        assert(env.variableTable.hasOwnProperty('x'));
        assert(f.calledWith('/path/to/script'));
      });
    });

    it('save command', function() {
      var f = sinon.spy(function() { return Promise.resolve(); });
      var env = TestEnvironment({ scriptSaver: f });
      return env.exec([
        ':new x Module',
        ':save /path/to/script',
      ]).then(function() {
        assert(f.calledWith('/path/to/script', 'x:Module\n'));
      });
    });
  });
});
