import { SemanticSet } from './semanticSet.js'

export class Observer {
  constructor({ query, stateConditions, modelCondition, effect }) {
    this._query = query;
    this._stateConditions = stateConditions || [];
    this._modelCondition = modelCondition;
    this._effect = effect;

    this._preEventStateValues = null;
    this._preEventModelValue = null;
  }

  examineModel(model) {
    if (this._query) {
      return model.query(this._query);
    } else {
      return null;
    }
  }

  examineConceptState(world) {
    return this._stateConditions.map((condition) => {
      const concept = world.getConcept(condition[0]);
      const stateValue = concept.getState(world, condition[1]);
    });
  }

  stateChangedAndMatches(world) {
    if (!this._stateCondtions) {
      return false;
    }

    if (this.examineConceptState(world).every((val, i) => {
      return val == this._preEventStateValues[i];
    })) {
      return false;
    }

    return this._stateConditions.every((condition) => {
      const concept = world.getConcept(condition[0]);
      const stateValue = concept.getState(world, condition[1]);
      const targetValue = condition[2];
      return stateValue == targetValue;
    });
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
    this._preEventStateValues = this.examineConceptState(world);
    this._preEventModelValue = this.examineModel(world._model);
  }

  shouldFire(world) {
    return this.modelChanged(world) || this.stateChangedAndMatches(world);
  }

  consider(world) {
    const newModelValue = this.newModelValue(world);
    if (newModelValue !== null) {
      debugger
      return this._effect(newModelValue, this._preEventModelValue, world._model);
    }
    return null;
  }
}
