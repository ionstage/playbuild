export class Command {
  static parse(s) {
    const tokens = tokenize(s);
    const nodes = makeNodes(tokens);
    if (!isValidNodes(nodes)) {
      throw new SyntaxError('PlayBuildScript parse error: Unexpected identifier "' +  s + '"');
    }
    return makeArgs(nodes);
  }
}

function tokenize(s) {
  const tokens = s.match(/".*?[^\\]"|'.*?[^\\]'|\.|#|:|>>|<<|[\w"'\/\\]+/g) || [];
  const index = tokens.indexOf('#');
  return (index !== -1 ? tokens.slice(0, index) : tokens);
}

function makeNodes(tokens) {
  const nodes = tokens.slice();
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
}

function isValidNodes(nodes) {
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
}

function makeArgs(nodes) {
  return nodes.filter(node => {
    return (node !== '.');
  }).map(node => {
    const first = node.charAt(0);
    const last = node.slice(-1);
    if (first === last && (first === '\'' || first === '"')) {
      node = node.slice(1, -1);
    }
    return node.replace(/\\(["'])/g, '$1');
  });
}
