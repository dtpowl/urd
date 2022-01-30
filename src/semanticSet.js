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
//
// 6.) We need `union`, `intersection`, and `identical`
//
// 7.) It's useful to us to make `add(null)` a no-op

// todo: immutable version of this, with memoized keyForSelf
export class SemanticSet {
  static isSemanticSet(arg) {
    return arg.constructor == this;
  }

  constructor (iterable, {inverted, _map}={})  {
    this._map = _map || new Map();

    // add the elements before setting the inverted flag
    if (iterable) {
      for (const el of iterable) {
        this.add(el);
      }
    }

    this._inverted = Boolean(inverted);
    this[Symbol.iterator] = () => this._map.values();
  }

  invert() {
    return new SemanticSet(this._map.values(), {inverted: !this._inverted});
  }

  clone() {
    return new SemanticSet(this._map.values(), {inverted: this._inverted});
  }

  get size() {
    return this._map.size;
  }

  identical(otherSemanticSet) {
    return (
      this.size == otherSemanticSet.size &&
        this.intersection(otherSemanticSet).size == this.size
    );
  }

  add(el) {
    if (el === null) { return el; }
    if (el === undefined) { return el; }

    if (this._inverted) {
      this._map.delete(SemanticSet.keyFor(el));
    } else {
      this._map.set(SemanticSet.keyFor(el), el);
    }
    return el;
  }

  delete(el) {
    if (el === null) { return; }
    if (el === undefined) { return; }

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

  semanticHashValue() {
    SemanticSet.keyFor(this.values());
  }

  take() {
    return this.values().next().value;
  }

  union(otherSemanticSet) {
    if (this._inverted && otherSemanticSet._inverted) {
      let otherValueSet = new Set(otherSemanticSet.values());
      return new SemanticSet(
        Array.from(this.values()).filter((x) => otherValueSet.has(x)),
        {inverted: true}
      )

    } else if (this._inverted) {
      let otherValueSet = new Set(otherSemanticSet.values());
      return new SemanticSet(
        Array.from(this.values()).filter((x) => !otherValueSet.has(x)),
        {inverted: true}
      );

    } else if (otherSemanticSet._inverted) {
      let thisValueSet = new Set(this.values());
      return new SemanticSet(
        Array.from(otherSemanticSet.values()).filter((x) => !thisValueSet.has(x)),
        {inverted: true}
      );

    } else {
      return new SemanticSet(
        Array.from(this.values()).concat(Array.from(otherSemanticSet.values()))
      );
    }
  }

  intersection(otherSemanticSet) {
    if (this._inverted && otherSemanticSet._inverted) {
      return new SemanticSet(
        Array.from(this.values()) + Array.from(otherSemanticSet.values()),
        {inverted: true}
      );

    } else if (this._inverted) {
      return otherSemanticSet.filter((thisEl) => this.has(thisEl));

    } else {
      return this.filter((thisEl) => otherSemanticSet.has(thisEl));
    }
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
