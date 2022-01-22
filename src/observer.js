export class Observer {
  constructor(relationName, atoms, effect) {
    this._relationName = relationName;
    this._atoms = atoms;
    this._effect = effect;
  }

  check(model) {
    return model.check(this._relationName, ...this._atoms);
  }

  consider(model, oldValue) {
    let newValue = model.check(this._relationName, ...this._atoms);
    if (newValue != oldValue) {
      return this._effect(newValue);
    } else {
      return null;
    }
  }
}
