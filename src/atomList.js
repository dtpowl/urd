// monadic representation of one or more atoms
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

  // every type that can be a model query result must implement `identical`
  identical(otherAtomList) {
    if (!otherAtomList) { return false; }
    if (otherAtomList.constructor != AtomList) { return false; }

    return this._atoms.every((atom, i) => atom == otherAtomList._atoms[i]);
  }

  // bind returns a new AtomList
  bind(cb) {
    return new AtomList(this.map(cb));
  }

  // map returns an Array
  map(cb) {
    return this._atoms.map(cb);
  }

  reduce(...args) {
    return this._atoms.reduce(...args);
  }

  forEach(cb) {
    this._atoms.each((el) => {
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
