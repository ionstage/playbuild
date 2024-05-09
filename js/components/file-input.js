import { jCore } from '../bundle/jcore.js';
import { dom } from '../dom.js';

export class FileInput extends jCore.Component {
  constructor(props) {
    super(props);
  }

  load() {
    return new Promise(function(resolve) {
      var onchange = function(event) {
        resolve(dom.file(dom.target(event)));
      };
      dom.on(this.element(), 'change', onchange);
      dom.click(this.element());
      dom.once(dom.body(), 'focus', function() {
        dom.off(this.element(), 'change', onchange);
      }.bind(this), true);
    }.bind(this)).then(function(file) {
      var fileName = dom.fileName(file);
      dom.value(this.element(), '');
      return dom.readFile(file).then(function(text) {
        return {
          text: text,
          fileName: fileName,
        };
      });
    }.bind(this));
  }
}
