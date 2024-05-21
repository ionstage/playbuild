import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { CircuitModule } from '../js/models/circuit-module.js';

describe('CircuitModule.PlayBuildModule', () => {
  it('has members without value', () => {
    const m = new CircuitModule.PlayBuildModule([
      { name: 'a', type: 'data' },
      { name: 'b', type: 'event' },
    ]);
    const a = m.get('a');
    const b = m.get('b');
    assert.strictEqual(a.name, 'a');
    assert.strictEqual(b.name, 'b');
    assert.strictEqual(typeof a(), 'undefined');
    assert.strictEqual(typeof b(), 'undefined');
  });

  it('has data members with value', () => {
    const m = new CircuitModule.PlayBuildModule([{ name: 'a', type: 'data', arg: 1 }]);
    const a = m.get('a');
    assert.strictEqual(a(), 1);
    a(2);
    assert.strictEqual(a(), 2);
  });

  it('has event members with listener', () => {
    const l = mock.fn();
    const m = new CircuitModule.PlayBuildModule([{ name: 'a', type: 'event', arg: l }]);
    const a = m.get('a');
    a();
    assert.strictEqual(l.mock.callCount(), 1);
  });

  it('should make the latter member definition a priority', () => {
    const l0 = mock.fn();
    const l1 = mock.fn();
    const m = new CircuitModule.PlayBuildModule([
      { name: 'a', type: 'data', arg: 1 },
      { name: 'b', type: 'event', arg: l0 },
      { name: 'a', type: 'data', arg: 2 },
      { name: 'b', type: 'event', arg: l1 },
    ]);
    const a = m.get('a');
    const b = m.get('b');
    assert.strictEqual(a(), 2);
    b();
    assert.strictEqual(l0.mock.callCount(), 0);
    assert.strictEqual(l1.mock.callCount(), 1);
  });

  it('bind members', () => {
    const m0 = new CircuitModule.PlayBuildModule([{ name: 'a', type: 'data' }]);
    const m1 = new CircuitModule.PlayBuildModule([{ name: 'b', type: 'data' }]);
    const a = m0.get('a');
    const b = m1.get('b');
    CircuitModule.bind(a, b);
    a(0);
    assert.strictEqual(b(), 0);
  });

  it('unbind members', () => {
    const m0 = new CircuitModule.PlayBuildModule([{ name: 'a', type: 'data' }]);
    const m1 = new CircuitModule.PlayBuildModule([{ name: 'b', type: 'data' }]);
    const a = m0.get('a');
    const b = m1.get('b');
    CircuitModule.bind(a, b);
    a(0);
    CircuitModule.unbind(a, b);
    a(1);
    assert.strictEqual(b(), 0);
  });

  it('has not options', () => {
    const m = new CircuitModule.PlayBuildModule([]);
    assert.doesNotThrow(() => m.deserialize('data_text'));
  });

  it('options.deserialize', () => {
    const f = mock.fn();
    const m = new CircuitModule.PlayBuildModule([], { deserialize: f });
    const s = 'data_text';
    m.deserialize(s);
    assert.strictEqual(f.mock.calls[0].arguments[0], s);
  });
});
