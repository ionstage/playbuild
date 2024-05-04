var assert = require('assert');
var sinon = require('sinon');
var CircuitModule = require('../js/models/circuit-module.js');

describe('CircuitModule.OrderModule', function() {
  it('has members without value', function() {
    var m = new CircuitModule.OrderModule([
      { name: 'a', type: 'prop' },
      { name: 'b', type: 'event' },
    ]);
    var a = m.get('a');
    var b = m.get('b');
    assert.equal(a.name, 'a');
    assert.equal(b.name, 'b');
    assert(typeof a() === 'undefined');
    assert(typeof b() === 'undefined');
  });

  it('has prop members with value', function() {
    var m = new CircuitModule.OrderModule([{ name: 'a', type: 'prop', arg: 1 }]);
    var a = m.get('a');
    assert.equal(a(), 1);
    a(2);
    assert.equal(a(), 2);
  });

  it('has event members with listener', function() {
    var l = sinon.spy();
    var m = new CircuitModule.OrderModule([{ name: 'a', type: 'event', arg: l }]);
    var a = m.get('a');
    a();
    assert(l.calledOnce);
  });

  it('should make the latter member definition a priority', function() {
    var l0 = sinon.spy();
    var l1 = sinon.spy();
    var m = new CircuitModule.OrderModule([
      { name: 'a', type: 'prop', arg: 1 },
      { name: 'b', type: 'event', arg: l0 },
      { name: 'a', type: 'prop', arg: 2 },
      { name: 'b', type: 'event', arg: l1 },
    ]);
    var a = m.get('a');
    var b = m.get('b');
    assert.equal(a(), 2);
    b();
    assert(l0.notCalled);
    assert(l1.calledOnce);
  });

  it('bind members', function() {
    var m0 = new CircuitModule.OrderModule([{ name: 'a', type: 'prop' }]);
    var m1 = new CircuitModule.OrderModule([{ name: 'b', type: 'prop' }]);
    var a = m0.get('a');
    var b = m1.get('b');
    CircuitModule.bind(a, b);
    a(0);
    assert.equal(b(), 0);
  });

  it('unbind members', function() {
    var m0 = new CircuitModule.OrderModule([{ name: 'a', type: 'prop' }]);
    var m1 = new CircuitModule.OrderModule([{ name: 'b', type: 'prop' }]);
    var a = m0.get('a');
    var b = m1.get('b');
    CircuitModule.bind(a, b);
    a(0);
    CircuitModule.unbind(a, b);
    a(1);
    assert.equal(b(), 0);
  });
});
