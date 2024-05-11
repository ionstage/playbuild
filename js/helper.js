export class helper {
  static remove(array, item) {
    const index = array.indexOf(item);
    if (index !== -1) {
      array.splice(index, 1);
    }
  }

  static wrapper = () => {
    return class Wrapper {
      constructor(self, wrapper) {
        return Object.defineProperty(wrapper, 'unwrap', { value: Wrapper._unwrap.bind(self) });
      }

      static _unwrap(key) {
        return (key === Wrapper.KEY ? this : null);
      }

      static KEY = {};
    }
  };
}
