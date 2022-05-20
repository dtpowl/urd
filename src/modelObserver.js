import { SemanticSet } from './semanticSet.js'

// todo: This class is friendly with World. Decouple?
export class ModelObserver {
  constructor({ query, modelCondition, effect }) {
    this._query = query;
    this._modelCondition = modelCondition;
    this._preEventModelValue = null;
    this._effect = effect;
  }

  examineModel(model) {
    if (this._query) {
      return model.query(this._query);
    } else {
      return null;
    }
  }

  newModelValue(world) {
    const val = this.examineModel(world._model);
    if (!val || val.identical(this._preEventModelValue)) {
      return null;
    } else {
      return val;
    }
  }

  prepare(world) {
    this._preEventModelValue = this.examineModel(world._model);
  }

  consider(world) {
    const newModelValue = this.newModelValue(world);
    if (newModelValue !== null) {
      return this._effect(newModelValue, this._preEventModelValue, world._model);
    }
    return null;
  }
}
