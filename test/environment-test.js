import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { CircuitModule } from '../js/models/circuit-module.js';
import { Environment } from '../js/models/environment.js';

function TestEnvironment(props) {
  return new Environment(Object.assign({
    circuitModuleLoader: async () => new CircuitModule.PlayBuildModule([]),
    circuitModuleUnloader: async () => {},
    scriptLoader: async () => {},
    scriptSaver: async () => {},
  }, props));
}

describe('Environment', () => {
  describe('#exec', () => {
    it('accept empty command', () => {
      const env = TestEnvironment();
      return env.exec('');
    });

    it('create new variable', async () => {
      const m = new CircuitModule.PlayBuildModule([]);
      const f = mock.fn(async () => m);
      const env = TestEnvironment({ circuitModuleLoader: f });
      await env.exec(':new x Module');
      const x = env._variables[0];
      assert.strictEqual(x.name, 'x');
      assert.strictEqual(x.moduleName, 'Module');
      assert.strictEqual(x.circuitModule, m);
      assert.strictEqual(f.mock.calls[0].arguments[0], 'x');
      assert.strictEqual(f.mock.calls[0].arguments[1], 'Module');
    });

    it('create new variable with data', async () => {
      const m = new CircuitModule.PlayBuildModule([]);
      const f = mock.fn(async () => m);
      const env = TestEnvironment({ circuitModuleLoader: f });
      await env.exec(':new x Module data_text');
      const x = env._variables[0];
      assert.strictEqual(x.name, 'x');
      assert.strictEqual(x.moduleName, 'Module');
      assert.strictEqual(x.circuitModule, m);
      assert.strictEqual(f.mock.calls[0].arguments[0], 'x');
      assert.strictEqual(f.mock.calls[0].arguments[1], 'Module');
      assert.strictEqual(f.mock.calls[0].arguments[2], 'data_text');
    });

    it('should not create variables with the same name', async () => {
      const env = TestEnvironment();
      try {
        await env.exec([
          ':new x Module',
          ':new x Module',
        ]);
      } catch (e) {
        assert(e instanceof Error);
      }
    });

    it('should not set circuit module to null', async () => {
      const env = TestEnvironment({
        circuitModuleLoader: () => null,
      });
      try {
        await env.exec(':new x Module');
      } catch (e) {
        assert(e instanceof Error);
      }
    });

    it('bind circuit module members', async () => {
      const env = TestEnvironment({
        circuitModuleLoader: async () => {
          return new CircuitModule.PlayBuildModule([
            { name: 'a', type: 'data' },
            { name: 'b', type: 'data' },
          ]);
        },
      });
      CircuitModule.bind = mock.fn(CircuitModule.bind);
      await env.exec([
        ':new x Module',
        ':new y Module',
        ':bind x.a y.b',
      ]);
      const a = env._variables[0].circuitModule.get('a');
      const b = env._variables[1].circuitModule.get('b');
      assert.strictEqual(CircuitModule.bind.mock.calls[0].arguments[0], a);
      assert.strictEqual(CircuitModule.bind.mock.calls[0].arguments[1], b);
      assert.strictEqual(env._bindings.length, 1);
    });

    it('unbind circuit module members', async () => {
      const env = TestEnvironment({
        circuitModuleLoader: async () => {
          return new CircuitModule.PlayBuildModule([
            { name: 'a', type: 'data' },
            { name: 'b', type: 'data' },
          ]);
        },
      });
      CircuitModule.unbind = mock.fn(CircuitModule.unbind);
      await env.exec([
        ':new x Module',
        ':new y Module',
        ':bind x.a y.b',
        ':unbind x.a y.b',
      ]);
      const a = env._variables[0].circuitModule.get('a');
      const b = env._variables[1].circuitModule.get('b');
      assert(CircuitModule.unbind.mock.calls[0].arguments[0], a);
      assert(CircuitModule.unbind.mock.calls[0].arguments[1], b);
      assert.strictEqual(env._bindings.length, 0);
    });

    it('send data to a member of circuit module', async () => {
      const env = TestEnvironment({
        circuitModuleLoader: async () => {
          return new CircuitModule.PlayBuildModule([
            { name: 'a', type: 'data' },
          ]);
        },
      });
      await env.exec([
        ':new x Module',
        ':send x.a data_text',
      ]);
      const a = env._variables[0].circuitModule.get('a');
      assert.strictEqual(a(), 'data_text');
    });

    it('delete variable', async () => {
      const f = mock.fn(async () => {});
      const env = TestEnvironment({ circuitModuleUnloader: f });
      await env.exec([
        ':new x Module',
        ':delete x',
      ]);
      assert.strictEqual(env._variables.length, 0);
      assert.strictEqual(f.mock.callCount(), 1);
    });

    it('unbind all circuit module members on deleting variable', async () => {
      const env = TestEnvironment({
        circuitModuleLoader: async () => {
          return new CircuitModule.PlayBuildModule([
            { name: 'a', type: 'data' },
            { name: 'b', type: 'data' },
          ]);
        },
      });
      let x, y, z;
      CircuitModule.unbind = mock.fn(CircuitModule.unbind);
      await env.exec([
        ':new x Module',
        ':new y Module',
        ':new z Module',
        ':bind x.a y.a',
        ':bind x.b y.a',
        ':bind y.a z.a',
        ':bind y.a z.b',
        ':bind x.b y.b',
        ':bind y.b z.b',
      ]);
      x = env._variables[0];
      y = env._variables[1];
      z = env._variables[2];
      await env.exec(':delete y');
      const calls = CircuitModule.unbind.mock.calls;
      assert.strictEqual(calls[0].arguments[0], x.circuitModule.get('a'));
      assert.strictEqual(calls[0].arguments[1], y.circuitModule.get('a'));
      assert.strictEqual(calls[1].arguments[0], x.circuitModule.get('b'));
      assert.strictEqual(calls[1].arguments[1], y.circuitModule.get('a'));
      assert.strictEqual(calls[2].arguments[0], y.circuitModule.get('a'));
      assert.strictEqual(calls[2].arguments[1], z.circuitModule.get('a'));
      assert.strictEqual(calls[3].arguments[0], y.circuitModule.get('a'));
      assert.strictEqual(calls[3].arguments[1], z.circuitModule.get('b'));
      assert.strictEqual(calls[4].arguments[0], x.circuitModule.get('b'));
      assert.strictEqual(calls[4].arguments[1], y.circuitModule.get('b'));
      assert.strictEqual(calls[5].arguments[0], y.circuitModule.get('b'));
      assert.strictEqual(calls[5].arguments[1], z.circuitModule.get('b'));
    });

    it('reset', async () => {
      const f = mock.fn(async () => {});
      const env = TestEnvironment({ circuitModuleUnloader: f });
      await env.exec([
        ':new x Module',
        ':new y Module',
        ':reset',
      ]);
      assert.strictEqual(env._variables.length, 0);
      assert(f.mock.callCount(), 2);
    });

    it('load command', async () => {
      const f = mock.fn(async () => {
        return {
          text: ':new x Module',
          fileName: 'test.pb',
        };
      });
      const env = TestEnvironment({ scriptLoader: f });
      await env.exec(':load /path/to/script');
      assert.strictEqual(env._variables[0].name, 'x');
      assert.strictEqual(f.mock.calls[0].arguments[0], '/path/to/script');
    });

    it('save command', async () => {
      const f = mock.fn(async () => {});
      const env = TestEnvironment({ scriptSaver: f });
      await env.exec([
        ':new x Module',
        ':save /path/to/script',
      ]);
      assert.strictEqual(f.mock.calls[0].arguments[0], '/path/to/script');
      assert.strictEqual(f.mock.calls[0].arguments[1], 'x:Module\n');
    });

    it('save command with variables data', async () => {
      const s = 'data"_"text';
      const m = new CircuitModule.PlayBuildModule([], { serialize: () => 'data"_"text' });
      const f = mock.fn(async () => {});
      const env = TestEnvironment({ circuitModuleLoader: async () => m, scriptSaver: f });
      await env.exec([
        ':new x Module ' + s,
        ':save /path/to/script',
      ]);
      assert.strictEqual(f.mock.calls[0].arguments[0], '/path/to/script');
      assert.strictEqual(f.mock.calls[0].arguments[1], 'x:Module "data\\"_\\"text"\n');
    });
  });

  describe('#deleteVariable', () => {
    it('delete variable', async () => {
      const f = mock.fn(async () => {});
      const env = TestEnvironment({ circuitModuleUnloader: f });
      await env.exec([
        ':new x Module',
      ]);
      await env.deleteVariable('x');
      assert.strictEqual(env._variables.length, 0);
      assert.strictEqual(f.mock.callCount(), 1);
    });
  });

  describe('#loadScript', () => {
    it('load script', async () => {
      const f = mock.fn(async () => {
        return {
          text: ':new x Module',
          fileName: 'test.pb',
        };
      });
      const env = TestEnvironment({ scriptLoader: f });
      await env.loadScript('/path/to/script');
      assert.strictEqual(env._variables[0].name, 'x');
      assert.strictEqual(f.mock.calls[0].arguments[0], '/path/to/script');
    });
  });
});
