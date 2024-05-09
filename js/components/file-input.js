import { jCore } from '../bundle/jcore.js';
import { dom } from '../dom.js';

export class FileInput extends jCore.Component {
  constructor(props) {
    super(props);
  }

  load() {
    return new Promise(resolve => {
      const onchange = event => {
        resolve(dom.file(dom.target(event)));
      };
      dom.on(this.element(), 'change', onchange);
      dom.click(this.element());
      dom.once(dom.body(), 'focus', () => {
        dom.off(this.element(), 'change', onchange);
      }, true);
    }).then(file => {
      const fileName = dom.fileName(file);
      dom.value(this.element(), '');
      return dom.readFile(file).then(text => {
        return {
          text: text,
          fileName: fileName,
        };
      });
    });
  }
}
