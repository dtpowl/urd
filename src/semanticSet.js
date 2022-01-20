// This is needed because `Set.has` doesn't return true
// when the argument is a reference type that evaluates
// as equal to an element of the Set

export class SemanticSet {
  constructor (iterable)  {
    this._map = new Map();

    if (iterable) {
      iterable.forEach((el) => {
        this.add(el);
      });
    }
  }

  add(el) {
    this._map.set(SemanticSet.keyFor(el), el);
    return el;
  }

  delete(el) {
    this._map.delete(SemanticSet.keyFor(el));
  }

  has(el) {
    return this._map.has(SemanticSet.keyFor(el));
  }

  forEach(cb) {
    this._map.forEach((value, key) => cb(value));
  }

  values() {
    return this._map.values();
  }

  static keyFor(el) {
    if (typeof el.semanticHashValue == 'function') {
      return el.semanticHashValue();
    } else {
      return SemanticSet.defaultHashValueFor(el);
    }
  }

  static defaultHashValueFor(el) {
    if (typeof el.map == 'function') {
      return '<' + String(el.map((subEl) => SemanticSet.keyFor(subEl))) + '>';
    }

    if (el.name || el.uid) {
      let parts = [
        el.constructor.name,
        el.name,
        el.uid,
      ].filter((x) => Boolean(x));
      return SemanticSet.defaultHashValueFor(parts);
    }

    return el;
  }
}
