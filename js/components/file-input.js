import { jCore } from '../bundle/jcore.js';
import { dom } from '../dom.js';

export class FileInput extends jCore.Component {
  constructor(el) {
    super(el);
  }

  async load() {
    const file = await new Promise(resolve => {
      const onchange = event => {
        resolve(dom.file(dom.target(event)));
      };
      dom.on(this.el, 'change', onchange);
      dom.click(this.el);
      dom.once(dom.body(), 'focus', () => {
        dom.off(this.el, 'change', onchange);
      }, true);
    });
    const fileName = dom.fileName(file);
    dom.value(this.el, '');
    const text = await dom.readFile(file);
    return { text, fileName };
  }
}
