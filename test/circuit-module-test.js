const assert = require('node:assert');
const { describe, it, mock } = require('node:test');
const CircuitModule = require('../js/models/circuit-module.js');

describe('CircuitModule.PlayBuildModule', () => {
  it('has members without value', () => {
    const m = new CircuitModule.PlayBuildModule([
      { name: 'a', type: 'prop' },
      { name: 'b', type: 'event' },
    ]);
    const a = m.get('a');
    const b = m.get('b');
    assert.equal(a.name, 'a');
    assert.equal(b.name, 'b');
    assert(typeof a() === 'undefined');
    assert(typeof b() === 'undefined');
  });

  it('has prop members with value', () => {
    const m = new CircuitModule.PlayBuildModule([{ name: 'a', type: 'prop', arg: 1 }]);
    const a = m.get('a');
    assert.equal(a(), 1);
    a(2);
    assert.equal(a(), 2);
  });

  it('has event members with listener', () => {
    const l = mock.fn();
    const m = new CircuitModule.PlayBuildModule([{ name: 'a', type: 'event', arg: l }]);
    const a = m.get('a');
    a();
    assert.equal(l.mock.callCount(), 1);
  });

  it('should make the latter member definition a priority', () => {
    const l0 = mock.fn();
    const l1 = mock.fn();
    const m = new CircuitModule.PlayBuildModule([
      { name: 'a', type: 'prop', arg: 1 },
      { name: 'b', type: 'event', arg: l0 },
      { name: 'a', type: 'prop', arg: 2 },
      { name: 'b', type: 'event', arg: l1 },
    ]);
    const a = m.get('a');
    const b = m.get('b');
    assert.equal(a(), 2);
    b();
    assert.equal(l0.mock.callCount(), 0);
    assert.equal(l1.mock.callCount(), 1);
  });

  it('bind members', () => {
    const m0 = new CircuitModule.PlayBuildModule([{ name: 'a', type: 'prop' }]);
    const m1 = new CircuitModule.PlayBuildModule([{ name: 'b', type: 'prop' }]);
    const a = m0.get('a');
    const b = m1.get('b');
    CircuitModule.bind(a, b);
    a(0);
    assert.equal(b(), 0);
  });

  it('unbind members', () => {
    const m0 = new CircuitModule.PlayBuildModule([{ name: 'a', type: 'prop' }]);
    const m1 = new CircuitModule.PlayBuildModule([{ name: 'b', type: 'prop' }]);
    const a = m0.get('a');
    const b = m1.get('b');
    CircuitModule.bind(a, b);
    a(0);
    CircuitModule.unbind(a, b);
    a(1);
    assert.equal(b(), 0);
  });
});
