class Atom {
  constructor(name) {
    this._name = name;
  }

  get name() { return this._name; }

  is(atom) {
    return this._name == atom.name;
  }
}
