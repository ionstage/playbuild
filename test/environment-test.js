var assert = require('node:assert');
var { describe, it, mock } = require('node:test');
var CircuitModule = require('../js/models/circuit-module.js');
var Environment = require('../js/models/environment.js');

function TestEnvironment(props) {
  return new Environment(Object.assign({
    circuitModuleLoader: function() {
      return Promise.resolve(new CircuitModule.PlayBuildModule([]));
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
      var m = new CircuitModule.PlayBuildModule([]);
      var f = mock.fn(function() { return Promise.resolve(m); });
      var env = TestEnvironment({ circuitModuleLoader: f });
      return env.exec(':new x Module').then(function() {
        var x = env.variableTable.x;
        assert.equal(x.name, 'x');
        assert.equal(x.moduleName, 'Module');
        assert.equal(x.circuitModule, m);
        assert.equal(f.mock.calls[0].arguments[0], 'x');
        assert.equal(f.mock.calls[0].arguments[1], 'Module');
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
          return Promise.resolve(new CircuitModule.PlayBuildModule([
            { name: 'a', type: 'prop' },
            { name: 'b', type: 'prop' },
          ]));
        },
      });
      CircuitModule.bind = mock.fn(CircuitModule.bind);
      return env.exec([
        ':new x Module',
        ':new y Module',
        ':bind x.a y.b',
      ]).then(function() {
        var a = env.variableTable.x.circuitModule.get('a');
        var b = env.variableTable.y.circuitModule.get('b');
        assert.equal(CircuitModule.bind.mock.calls[0].arguments[0], a);
        assert.equal(CircuitModule.bind.mock.calls[0].arguments[1], b);
        assert.equal(env.bindings.length, 1);
      });
    });

    it('unbind circuit module members', function() {
      var env = TestEnvironment({
        circuitModuleLoader: function() {
          return Promise.resolve(new CircuitModule.PlayBuildModule([
            { name: 'a', type: 'prop' },
            { name: 'b', type: 'prop' },
          ]));
        },
      });
      CircuitModule.unbind = mock.fn(CircuitModule.unbind);
      return env.exec([
        ':new x Module',
        ':new y Module',
        ':bind x.a y.b',
        ':unbind x.a y.b',
      ]).then(function() {
        var a = env.variableTable.x.circuitModule.get('a');
        var b = env.variableTable.y.circuitModule.get('b');
        assert(CircuitModule.unbind.mock.calls[0].arguments[0], a);
        assert(CircuitModule.unbind.mock.calls[0].arguments[1], b);
        assert.equal(env.bindings.length, 0);
      });
    });

    it('send data to a member of circuit module', function() {
      var env = TestEnvironment({
        circuitModuleLoader: function() {
          return Promise.resolve(new CircuitModule.PlayBuildModule([
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
      var f = mock.fn(function() { return Promise.resolve(); });
      var env = TestEnvironment({ circuitModuleUnloader: f });
      return env.exec([
        ':new x Module',
        ':delete x',
      ]).then(function() {
        assert.equal(Object.keys(env.variableTable).length, 0);
        assert.equal(f.mock.callCount(), 1);
      });
    });

    it('unbind all circuit module members on deleting variable', function() {
      var env = TestEnvironment({
        circuitModuleLoader: function(variableName, moduleName) {
          return Promise.resolve(new CircuitModule.PlayBuildModule([
            { name: 'a', type: 'prop' },
            { name: 'b', type: 'prop' },
          ]));
        },
      });
      var x, y, z;
      CircuitModule.unbind = mock.fn(CircuitModule.unbind);
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
        var calls = CircuitModule.unbind.mock.calls;
        assert.equal(calls[0].arguments[0], x.circuitModule.get('a'));
        assert.equal(calls[0].arguments[1], y.circuitModule.get('a'));
        assert.equal(calls[1].arguments[0], x.circuitModule.get('b'));
        assert.equal(calls[1].arguments[1], y.circuitModule.get('a'));
        assert.equal(calls[2].arguments[0], y.circuitModule.get('a'));
        assert.equal(calls[2].arguments[1], z.circuitModule.get('a'));
        assert.equal(calls[3].arguments[0], y.circuitModule.get('a'));
        assert.equal(calls[3].arguments[1], z.circuitModule.get('b'));
        assert.equal(calls[4].arguments[0], x.circuitModule.get('b'));
        assert.equal(calls[4].arguments[1], y.circuitModule.get('b'));
        assert.equal(calls[5].arguments[0], y.circuitModule.get('b'));
        assert.equal(calls[5].arguments[1], z.circuitModule.get('b'));
      });
    });

    it('reset', function() {
      var f = mock.fn(function() { return Promise.resolve(); });
      var env = TestEnvironment({ circuitModuleUnloader: f });
      return env.exec([
        ':new x Module',
        ':new y Module',
        ':reset',
      ]).then(function() {
        assert.equal(Object.keys(env.variableTable).length, 0);
        assert(f.mock.callCount(), 2);
      });
    });

    it('load command', function() {
      var f = mock.fn(function() {
        return Promise.resolve({
          text: ':new x Module',
          fileName: 'test.pb',
        });
      });
      var env = TestEnvironment({ scriptLoader: f });
      return env.exec(':load /path/to/script').then(function() {
        assert(env.variableTable.hasOwnProperty('x'));
        assert.equal(f.mock.calls[0].arguments[0], '/path/to/script');
      });
    });

    it('save command', function() {
      var f = mock.fn(function() { return Promise.resolve(); });
      var env = TestEnvironment({ scriptSaver: f });
      return env.exec([
        ':new x Module',
        ':save /path/to/script',
      ]).then(function() {
        assert.equal(f.mock.calls[0].arguments[0], '/path/to/script');
        assert.equal(f.mock.calls[0].arguments[1], 'x:Module\n');
      });
    });
  });
});
