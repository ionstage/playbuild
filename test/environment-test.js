import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { CircuitModule } from '../js/models/circuit-module.js';
import { Environment } from '../js/models/environment.js';

function TestEnvironment(props) {
  return new Environment(Object.assign({
    circuitModuleLoader: () => Promise.resolve(new CircuitModule.PlayBuildModule([])),
    circuitModuleUnloader: () => Promise.resolve(),
    scriptLoader: () => Promise.resolve(),
    scriptSaver: () => Promise.resolve(),
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
      const f = mock.fn(() => Promise.resolve(m));
      const env = TestEnvironment({ circuitModuleLoader: f });
      await env.exec(':new x Module');
      const x = env.variableTable.x;
      assert.strictEqual(x.name, 'x');
      assert.strictEqual(x.moduleName, 'Module');
      assert.strictEqual(x.circuitModule, m);
      assert.strictEqual(f.mock.calls[0].arguments[0], 'x');
      assert.strictEqual(f.mock.calls[0].arguments[1], 'Module');
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
        circuitModuleLoader: () => {
          return Promise.resolve(new CircuitModule.PlayBuildModule([
            { name: 'a', type: 'data' },
            { name: 'b', type: 'data' },
          ]));
        },
      });
      CircuitModule.bind = mock.fn(CircuitModule.bind);
      await env.exec([
        ':new x Module',
        ':new y Module',
        ':bind x.a y.b',
      ]);
      const a = env.variableTable.x.circuitModule.get('a');
      const b = env.variableTable.y.circuitModule.get('b');
      assert.strictEqual(CircuitModule.bind.mock.calls[0].arguments[0], a);
      assert.strictEqual(CircuitModule.bind.mock.calls[0].arguments[1], b);
      assert.strictEqual(env.bindings.length, 1);
    });

    it('unbind circuit module members', async () => {
      const env = TestEnvironment({
        circuitModuleLoader: () => {
          return Promise.resolve(new CircuitModule.PlayBuildModule([
            { name: 'a', type: 'data' },
            { name: 'b', type: 'data' },
          ]));
        },
      });
      CircuitModule.unbind = mock.fn(CircuitModule.unbind);
      await env.exec([
        ':new x Module',
        ':new y Module',
        ':bind x.a y.b',
        ':unbind x.a y.b',
      ]);
      const a = env.variableTable.x.circuitModule.get('a');
      const b = env.variableTable.y.circuitModule.get('b');
      assert(CircuitModule.unbind.mock.calls[0].arguments[0], a);
      assert(CircuitModule.unbind.mock.calls[0].arguments[1], b);
      assert.strictEqual(env.bindings.length, 0);
    });

    it('send data to a member of circuit module', async () => {
      const env = TestEnvironment({
        circuitModuleLoader: () => {
          return Promise.resolve(new CircuitModule.PlayBuildModule([
            { name: 'a', type: 'data' },
          ]));
        },
      });
      await env.exec([
        ':new x Module',
        ':send x.a data_text',
      ]);
      const a = env.variableTable.x.circuitModule.get('a');
      assert.strictEqual(a(), 'data_text');
    });

    it('delete variable', async () => {
      const f = mock.fn(() => Promise.resolve());
      const env = TestEnvironment({ circuitModuleUnloader: f });
      await env.exec([
        ':new x Module',
        ':delete x',
      ]);
      assert.strictEqual(Object.keys(env.variableTable).length, 0);
      assert.strictEqual(f.mock.callCount(), 1);
    });

    it('unbind all circuit module members on deleting variable', async () => {
      const env = TestEnvironment({
        circuitModuleLoader: (variableName, moduleName) => {
          return Promise.resolve(new CircuitModule.PlayBuildModule([
            { name: 'a', type: 'data' },
            { name: 'b', type: 'data' },
          ]));
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
      x = env.variableTable.x;
      y = env.variableTable.y;
      z = env.variableTable.z;
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
      const f = mock.fn(() => Promise.resolve());
      const env = TestEnvironment({ circuitModuleUnloader: f });
      await env.exec([
        ':new x Module',
        ':new y Module',
        ':reset',
      ]);
      assert.strictEqual(Object.keys(env.variableTable).length, 0);
      assert(f.mock.callCount(), 2);
    });

    it('load command', async () => {
      const f = mock.fn(() => {
        return Promise.resolve({
          text: ':new x Module',
          fileName: 'test.pb',
        });
      });
      const env = TestEnvironment({ scriptLoader: f });
      await env.exec(':load /path/to/script');
      assert(env.variableTable.hasOwnProperty('x'));
      assert.strictEqual(f.mock.calls[0].arguments[0], '/path/to/script');
    });

    it('save command', async () => {
      const f = mock.fn(() => Promise.resolve());
      const env = TestEnvironment({ scriptSaver: f });
      await env.exec([
        ':new x Module',
        ':save /path/to/script',
      ]);
      assert.strictEqual(f.mock.calls[0].arguments[0], '/path/to/script');
      assert.strictEqual(f.mock.calls[0].arguments[1], 'x:Module\n');
    });
  });
});
