import { SemanticSet } from './semanticSet.js'

export class Observer {
  constructor({ query, effect }) {
    this._query = query;
    this._effect = effect;
  }

  examine(model) {
    return model.query(this._query);
  }

  consider(model, oldValue) {
    let newValue = this.examine(model);
    if (!newValue.identical(oldValue)) {
      return this._effect(newValue, oldValue, model);
    } else {
      return null;
    }
  }
}
