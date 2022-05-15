// represents a vector one or more atoms
// this is useful because:
// 1.) it lets us implement the "query result" interface on this class
// 2.) it lets us implement the "semantic set member" interface on this class
export class AtomList {
  static isAtomList(arg) {
    return arg && arg.constructor && arg.constructor.name == 'AtomList';
  }

  static from(val) {
    if (AtomList.isAtomList(val)) {
      return val;
    } else {
      return new AtomList(val);
    }
  }

  constructor(...elements) {
    this._atoms = [];
    elements.flat().forEach((el) => {
      if (AtomList.isAtomList(el)) {
        this._atoms = this._atoms.concat(el._unwrap());
      } else {
        this._atoms.push(el);
      }
    })
  }

  get length() { return this._atoms.length; }

  clone() {
    return this; // immutable
  }

  first () {
    return new AtomList(this._atoms[0]);
  }

  rest () {
    return new AtomList(this._atoms.slice(1));
  }

  reverse() {
    return new AtomList(this._atoms.slice().reverse());
  }

  inspect() {
    return [
      'div',
      {style: 'font-style: italic'},
      `AtomList[ ${this._atoms.join(', ')} ]`
    ];
  }

  asString() {
    return this._atoms.join(', ');
  }

  // every type that can be a model query result must implement `identical`
  identical(otherAtomList) {
    if (!otherAtomList) { return false; }
    if (otherAtomList.constructor != AtomList) { return false; }

    return this._atoms.every((atom, i) => atom == otherAtomList._atoms[i]);
  }

  // map returns an Array
  map(cb) {
    return this._atoms.map(cb);
  }

  reduce(...args) {
    return this._atoms.reduce(...args);
  }

  forEach(cb) {
    this._atoms.forEach((el) => {
      cb(new AtomList(el));
    });
  }

  semanticHashValue() {
    return this._atoms.join(',');
  }

  _unwrap() {
    return this._atoms;
  }
}
