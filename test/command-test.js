var assert = require('assert');
var Command = require('../js/models/command.js');

describe('Command', function() {
  describe('.parse', function() {
    [
      [':new x Module', ['new', 'x', 'Module']],
      [':new  x \t Module', ['new', 'x', 'Module']],
      [':New x Module', ['new', 'x', 'Module']],
      [':NEW x Module', ['new', 'x', 'Module']],
      [':bind x.member0 y.member1', ['bind', 'x', 'member0', 'y', 'member1']],
      [':unbind x.member0 y.member1', ['unbind', 'x', 'member0', 'y', 'member1']],
      [':send x.member0', ['send', 'x', 'member0']],
      [':send x.member0 data_text', ['send', 'x', 'member0', 'data_text']],
      [':send x.member0 \'data text\'', ['send', 'x', 'member0', 'data text']],
      [':send x.member0 "data text"', ['send', 'x', 'member0', 'data text']],
      [':send x.member0 "data_text"', ['send', 'x', 'member0', 'data_text']],
      [':send x.member0 \\"data_text"', ['send', 'x', 'member0', '"data_text"']],
      [':send x.member0 "data_text\'', ['send', 'x', 'member0', '"data_text\'']],
      [':send x.member0 \'data \\\' text\'', ['send', 'x', 'member0', 'data \' text']],
      [':send x.member0 \'data \\\\ text\'', ['send', 'x', 'member0', 'data \\\\ text']],
      [':delete x', ['delete', 'x']],
      [':reset', ['reset']],
      [':load', ['load']],
      [':load /path/to/script', ['load', '/path/to/script']],
      [':save', ['save']],
      [':save /path/to/script', ['save', '/path/to/script']],

      ['x:Module', ['new', 'x', 'Module']],
      ['x :Module', ['new', 'x', 'Module']],
      ['x: Module', ['new', 'x', 'Module']],
      ['x : Module', ['new', 'x', 'Module']],

      ['x.member0 >> y.member1', ['bind', 'x', 'member0', 'y', 'member1']],
      ['x.member0>>y.member1', ['bind', 'x', 'member0', 'y', 'member1']],
      ['x.member0 >>y.member1', ['bind', 'x', 'member0', 'y', 'member1']],
      ['x.member0>> y.member1', ['bind', 'x', 'member0', 'y', 'member1']],

      ['x.member0 <<', ['send', 'x', 'member0']],
      ['x.member0<<', ['send', 'x', 'member0']],
      ['x.member0 << data_text', ['send', 'x', 'member0', 'data_text']],
      ['x.member0<<data_text', ['send', 'x', 'member0', 'data_text']],
      ['x.member0 <<data_text', ['send', 'x', 'member0', 'data_text']],
      ['x.member0<< data_text', ['send', 'x', 'member0', 'data_text']],
      ['x.member0 << "data_text"', ['send', 'x', 'member0', 'data_text']],

      ['', []],
      [' ', []],
      [' \t ', []],

      ['#', []],
      ['# comment', []],
      [' # comment ', []],
      ['# x:Module', []],
      [' :reset # comment', ['reset']],

      [' :reset ', ['reset']],
      [':send x.member0 ">>y.member1"', ['send', 'x', 'member0', '>>y.member1']],
      [':send x.member0 "<<"', ['send', 'x', 'member0', '<<']],
    ].forEach(function(p) {
      it('"' + p[0] + '"', function() {
        assert.deepEqual(Command.parse(p[0]), p[1]);
      });
    });
  });

  describe('.parse (error)', function() {
    [
      ':',
      ':_command',
      'command',
      ':new',
      ':new x',
      ':new x y z',
      ':new x.y z',
      ':new x y.z',
      ':new _x y',
      ':new x _y',
      ':bind',
      ':bind x.member0',
      ':bind x.member0 y.member1 z.member2',
      ':bind x y',
      ':bind x.member0 y',
      ':bind x.member0 y.member1.member2',
      ':unbind',
      ':unbind x.member0',
      ':unbind x.member0 y.member1 z.member2',
      ':unbind x y',
      ':unbind x.member0 y',
      ':unbind x.member0 y.member1.member2',
      ':send',
      ':send x',
      ':send x.member0.member1',
      ':send x.member0 data text',
      ':send x.member0 \\"data text\\"',
      ':delete',
      ':delete x y',
      ':delete _x',
      ':delete x.y',
      ':reset x',
      ':load x y',
      ':save x y',
    ].forEach(function(p) {
      it('"' + p + '"', function() {
        assert.throws(function() {
          Command.parse(p);
        }, SyntaxError);
      });
    });
  });
});
