// This is needed because:
//
// 1.) `Set.has` doesn't return true
//      when the argument is a reference type that evaluates
//      as equal to an element of the Set
//
// 2.) `Set` doesn't implement `forEach`
//
// 3.) `Set` deosn't implement `filter`
//
// 4.) It's not possible to take the complement of a `Set`
//
// 5.) It's not possible to clone a `Set`

export class SemanticSet {
  constructor (iterable, {inverted}={})  {
    this._map = new Map();

    // add the elements before setting the inverted flag
    if (iterable) {
      for (const el of iterable) {
        this.add(el);
      }
    }

    this._inverted = Boolean(inverted);
  }

  clone() {
    return new SemanticSet(this._map.values(), {inverted: this._inverted});
  }

  add(el) {
    if (this._inverted) {
      this._map.delete(SemanticSet.keyFor(el));
    } else {
      this._map.set(SemanticSet.keyFor(el), el);
    }
    return el;
  }

  delete(el) {
    if (this._inverted) {
      this._map.set(SemanticSet.keyFor(el), el);
    } else {
      this._map.delete(SemanticSet.keyFor(el));
    }
  }

  has(el) {
    if (this._inverted) {
      return !this._map.has(SemanticSet.keyFor(el));
    } else {
      return this._map.has(SemanticSet.keyFor(el));
    }
  }

  forEach(cb) {
    if (this._inverted) {
      throw "[TODO] Can't iterate on inverted SemanticSet";
    }
    this._map.forEach((value, key) => cb(value));
  }

  filter(cb) {
    if (this._inverted) {
      throw "[TODO] Can't filter inverted SemanticSet";
    }

    let output = new SemanticSet();
    this.forEach((el) => {
      if (cb(el)) {
        output.add(el);
      }
    });

    return output;
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
