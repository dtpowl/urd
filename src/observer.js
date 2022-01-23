export class Observer {
  constructor(query, effect) {
    this._query = query;
    this._effect = effect;
  }

  examine(model) {
    return model.query(this._query);
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
