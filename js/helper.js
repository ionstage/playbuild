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
        return Object.defineProperty(wrapper, 'unwrap', { value: Wrapper.unwrap.bind(self) });
      }

      static unwrap(key) {
        return (key === Wrapper.KEY ? this : null);
      }

      static KEY = {};
    }
  };
}
