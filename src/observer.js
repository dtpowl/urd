import { SemanticSet } from './semanticSet.js'

export class Observer {
  constructor({ query, stateConditions, modelCondition, effect }) {
    this._query = query;
    this._stateConditions = stateConditions || [];
    this._modelCondition = modelCondition;
    this._effect = effect;
  }

  examine(model) {
    if (this._query) {
      return model.query(this._query);
    } else {
      return null;
    }
  }

  consider(world, model, oldValue) {
    const stateConditionMet = !this._stateConditions ||
          this._stateConditions.every((condition) => {
            const concept = world.getConcept(condition[0]);
            const stateValue = concept.getState(world, condition[1]);
            const targetValue = condition[2];
            return stateValue == targetValue;
          });


    if (!stateConditionMet) { return null; }

    if (this._modelCondition && !model.query(this._modelCondition)) {
      return null;
    }

    if (this._query) {
      const newValue = this.examine(model);
      if (!newValue.identical(oldValue)) {
        return this._effect(newValue, oldValue, model);
      }
    } else {
      return this._effect(null, null, model);
    }

    return null;
  }
}
