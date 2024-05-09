import { jCore } from '../bundle/jcore.js';
import { dom } from '../dom.js';

export class FileInput extends jCore.Component {
  constructor(props) {
    super(props);
  }

  async load() {
    const file = await new Promise(resolve => {
      const onchange = event => {
        resolve(dom.file(dom.target(event)));
      };
      dom.on(this.element(), 'change', onchange);
      dom.click(this.element());
      dom.once(dom.body(), 'focus', () => {
        dom.off(this.element(), 'change', onchange);
      }, true);
    });
    const fileName = dom.fileName(file);
    dom.value(this.element(), '');
    const text = await dom.readFile(file);
    return { text, fileName };
  }
}
