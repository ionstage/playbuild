const assert = require('node:assert');
const { describe, it, mock } = require('node:test');
const CircuitModule = require('../js/models/circuit-module.js');
const Environment = require('../js/models/environment.js');

function TestEnvironment(props) {
  return new Environment(Object.assign({
    circuitModuleLoader: () => {
      return Promise.resolve(new CircuitModule.PlayBuildModule([]));
    },
    circuitModuleUnloader: () => {
      return Promise.resolve();
    },
    scriptLoader: () => {
      return Promise.resolve();
    },
    scriptSaver: () => {
      return Promise.resolve();
    },
  }, props));
}

describe('Environment', () => {
  describe('#exec', () => {
    it('accept empty command', () => {
      const env = TestEnvironment();
      return env.exec('');
    });

    it('create new variable', () => {
      const m = new CircuitModule.PlayBuildModule([]);
      const f = mock.fn(() => { return Promise.resolve(m); });
      const env = TestEnvironment({ circuitModuleLoader: f });
      return env.exec(':new x Module').then(() => {
        const x = env.variableTable.x;
        assert.equal(x.name, 'x');
        assert.equal(x.moduleName, 'Module');
        assert.equal(x.circuitModule, m);
        assert.equal(f.mock.calls[0].arguments[0], 'x');
        assert.equal(f.mock.calls[0].arguments[1], 'Module');
      });
    });

    it('should not create variables with the same name', () => {
      const env = TestEnvironment();
      return env.exec([
        ':new x Module',
        ':new x Module',
      ]).catch(function(e) {
        assert(e instanceof Error);
      });
    });

    it('should not set circuit module to null', () => {
      const env = TestEnvironment({
        circuitModuleLoader: () => {
          return null;
        },
      });
      return env.exec(':new x Module').catch(function(e) {
        assert(e instanceof Error);
      });
    });

    it('bind circuit module members', () => {
      const env = TestEnvironment({
        circuitModuleLoader: () => {
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
      ]).then(() => {
        const a = env.variableTable.x.circuitModule.get('a');
        const b = env.variableTable.y.circuitModule.get('b');
        assert.equal(CircuitModule.bind.mock.calls[0].arguments[0], a);
        assert.equal(CircuitModule.bind.mock.calls[0].arguments[1], b);
        assert.equal(env.bindings.length, 1);
      });
    });

    it('unbind circuit module members', () => {
      const env = TestEnvironment({
        circuitModuleLoader: () => {
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
      ]).then(() => {
        const a = env.variableTable.x.circuitModule.get('a');
        const b = env.variableTable.y.circuitModule.get('b');
        assert(CircuitModule.unbind.mock.calls[0].arguments[0], a);
        assert(CircuitModule.unbind.mock.calls[0].arguments[1], b);
        assert.equal(env.bindings.length, 0);
      });
    });

    it('send data to a member of circuit module', () => {
      const env = TestEnvironment({
        circuitModuleLoader: () => {
          return Promise.resolve(new CircuitModule.PlayBuildModule([
            { name: 'a', type: 'prop' },
          ]));
        },
      });
      return env.exec([
        ':new x Module',
        ':send x.a data_text',
      ]).then(() => {
        const a = env.variableTable.x.circuitModule.get('a');
        assert.equal(a(), 'data_text');
      });
    });

    it('delete variable', () => {
      const f = mock.fn(() => { return Promise.resolve(); });
      const env = TestEnvironment({ circuitModuleUnloader: f });
      return env.exec([
        ':new x Module',
        ':delete x',
      ]).then(() => {
        assert.equal(Object.keys(env.variableTable).length, 0);
        assert.equal(f.mock.callCount(), 1);
      });
    });

    it('unbind all circuit module members on deleting variable', () => {
      const env = TestEnvironment({
        circuitModuleLoader: function(variableName, moduleName) {
          return Promise.resolve(new CircuitModule.PlayBuildModule([
            { name: 'a', type: 'prop' },
            { name: 'b', type: 'prop' },
          ]));
        },
      });
      let x, y, z;
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
      ]).then(() => {
        x = env.variableTable.x;
        y = env.variableTable.y;
        z = env.variableTable.z;
        return env.exec(':delete y');
      }).then(() => {
        const calls = CircuitModule.unbind.mock.calls;
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

    it('reset', () => {
      const f = mock.fn(() => { return Promise.resolve(); });
      const env = TestEnvironment({ circuitModuleUnloader: f });
      return env.exec([
        ':new x Module',
        ':new y Module',
        ':reset',
      ]).then(() => {
        assert.equal(Object.keys(env.variableTable).length, 0);
        assert(f.mock.callCount(), 2);
      });
    });

    it('load command', () => {
      const f = mock.fn(() => {
        return Promise.resolve({
          text: ':new x Module',
          fileName: 'test.pb',
        });
      });
      const env = TestEnvironment({ scriptLoader: f });
      return env.exec(':load /path/to/script').then(() => {
        assert(env.variableTable.hasOwnProperty('x'));
        assert.equal(f.mock.calls[0].arguments[0], '/path/to/script');
      });
    });

    it('save command', () => {
      const f = mock.fn(() => { return Promise.resolve(); });
      const env = TestEnvironment({ scriptSaver: f });
      return env.exec([
        ':new x Module',
        ':save /path/to/script',
      ]).then(() => {
        assert.equal(f.mock.calls[0].arguments[0], '/path/to/script');
        assert.equal(f.mock.calls[0].arguments[1], 'x:Module\n');
      });
    });
  });
});
