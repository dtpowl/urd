// A set that respects semantic equality of reference type instances,
// and which also adds some other useful features.

// This is needed because:
//
// 1.) `AtomList` and other classes have a natural equivalence relation
//
// 2.) `Set` doesn't implement `forEach`
//
// 3.) `Set` doesn't implement `filter`
//
// 4.) It's not possible to take the complement of a `Set`
//
// 5.) It's not possible to clone a `Set`

export class SemanticSet {
  static isSemanticSet(arg) {
    return arg.constructor == this;
  }

  constructor (iterable, {inverted, _map}={})  {
    this._map = _map || new Map();

    // add the elements before setting the inverted flag
    if (iterable) {
      try {
        for (const el of iterable) {
          this.add(el);
        }
      } catch(e) { debugger }
    }

    this._inverted = Boolean(inverted);
  }

  invert() {
    return new SemanticSet(this._map.values(), {inverted: !this._inverted});
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

  every(cb) {
    return Array.from(this.map.values()).every(cb);
  }

  some(cb) {
    return Array.from(this.map.values()).some(cb);
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

  map(cb) {
    if (this._inverted) {
      throw "[TODO] Can't map inverted SemanticSet";
    }

    let output = new SemanticSet();
    this.forEach((el) => {
      output.add(cb(el));
    });

    return output;
  }

  arrayMap(cb) {
    if (this._inverted) {
      throw "[TODO] Can't map inverted SemanticSet";
    }

    let output = [];
    this.forEach((el) => {
      output.push(cb(el));
    });

    return output;
  }

  values() {
    return this._map.values();
  }

  take() {
    return this.values().next().value;
  }

  static keyFor(el) {
    if (typeof el.semanticHashValue == 'function') {
      return el.semanticHashValue();
    } else {
      return SemanticSet.defaultHashValueFor(el);
    }
  }

  static defaultHashValueFor(el) {
    try {
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
    } catch(e) { debugger }
  }
}
