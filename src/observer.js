export class Observer {
  constructor(relationName, atoms, effects) {
    this._relationName = relationName;
    this._atoms = atoms;
    this._effects = effects;
  }

  check(model) {
    return model.check(this._relationName, ...this._atoms);
  }

  consider(model, oldValue) {
    let newValue = model.check(this._relationName, ...this._atoms);
    if (newValue != oldValue) {
      return this._effects(newValue);
    } else {
      return null;
    }
  }
}
