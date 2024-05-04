(function(app) {
  'use strict';

  var Command = {};

  Command.parse = (function() {
    var tokenize = function(s) {
      var tokens = s.match(/".*?[^\\]"|'.*?[^\\]'|\.|#|:|>>|<<|[\w"'\/\\]+/g) || [];
      var index = tokens.indexOf('#');
      return (index !== -1 ? tokens.slice(0, index) : tokens);
    };

    var makeNodes = function(tokens) {
      var nodes = tokens.slice();
      if (nodes[0] === ':' && nodes.length >= 2) {
        nodes.shift();
        nodes[0] = nodes[0].toLowerCase();
      } else if (nodes[1] === ':') {
        nodes.splice(1, 1);
        nodes.unshift('new');
      } else if (nodes[1] === '.' && nodes[3] === '>>' && nodes[5] === '.') {
        nodes.splice(3, 1);
        nodes.unshift('bind');
      } else if (nodes[1] === '.' && nodes[3] === '<<') {
        nodes.splice(3, 1);
        nodes.unshift('send');
      }
      return nodes;
    };

    var isValidNodes = function(nodes) {
      switch (nodes[0]) {
        case 'new':
          return (nodes.length === 3 && /^[a-zA-Z]/.test(nodes[1]) && /^[a-zA-Z]/.test(nodes[2]));
        case 'bind':
        case 'unbind':
          return (nodes.length === 7 && nodes[2] === '.' && nodes[5] === '.');
        case 'send':
          return (nodes.length >= 4 && nodes.length <= 5 && nodes[2] === '.');
        case 'delete':
          return (nodes.length === 2 && /^[a-zA-Z]/.test(nodes[1]));
        case 'reset':
          return (nodes.length === 1);
        case 'load':
        case 'save':
          return (nodes.length <= 2);
        default:
          return (nodes.length === 0);
      }
    };

    var makeArgs = function(nodes) {
      return nodes.filter(function(node) {
        return (node !== '.');
      }).map(function(node) {
        var first = node.charAt(0);
        var last = node.slice(-1);
        if (first === last && (first === '\'' || first === '"')) {
          node = node.slice(1, -1);
        }
        return node.replace(/\\(["'])/g, '$1');
      });
    };

    return function(s) {
      var tokens = tokenize(s);
      var nodes = makeNodes(tokens);
      if (!isValidNodes(nodes)) {
        throw new SyntaxError('OrderScript parse error: Unexpected identifier "' +  s + '"');
      }
      return makeArgs(nodes);
    };
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Command;
  } else {
    app.Command = Command;
  }
})(this.app || (this.app = {}));
