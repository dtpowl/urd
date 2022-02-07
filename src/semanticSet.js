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

// All object values that are members of SemanticSet must implement deep copy as
// `clone`. (immutable types or frozen instances may return self from clone)

// todo: better name?
// todo: immutable version of this?

// todo: uid needed?
//import { Uid } from './uid.js'

export class SemanticSet {
  static isSemanticSet(arg) {
    return arg.constructor == this;
  }

  constructor (iterable, {inverted, _map}={})  {
//    this._uid = Uid.next();
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

//  get uid() { return this._uid; }

  invert() {
    let clonedValues = Array.from(this._map.values()).map((x) => {
      if (typeof x == 'object') {
        return x.clone();
      } else {
        return x;
      }
    });
    return new SemanticSet(clonedValues, {inverted: !this._inverted});
  }

  clone() {
    let clonedValues = Array.from(this._map.values()).map((x) => {
      if (typeof x == 'object') {
        return x.clone();
      } else {
        return x;
      }
    });
    return new SemanticSet(clonedValues, {inverted: this._inverted});
  }

  get size() {
    return this._map.size;
  }


  // every type that can be a model query result must implement `identical`
  identical(otherSemanticSet) {
    if (!otherSemanticSet) { return false; }
    if (otherSemanticSet.constructor != SemanticSet) { return false; }

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
    if (el === null) { return false; }
    if (el === undefined) { return false; }

    if (this._inverted) {
      return !this._map.has(SemanticSet.keyFor(el));
    } else {
      return this._map.has(SemanticSet.keyFor(el));
    }
  }

  every(cb) {
    return Array.from(this._map.values()).every(cb);
  }

  some(cb) {
    return Array.from(this._map.values()).some(cb);
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
