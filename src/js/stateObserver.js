import { SemanticSet } from './semanticSet.js'

export class StateObserver {
  constructor({ query, stateConditions, modelCondition, effect }) {
    this._query = query;
    this._stateConditions = stateConditions;
    this._effect = effect;
  }

  examineConceptState(world) {
    return this._stateConditions.map((condition) => {
      const concept = world.getConcept(condition[0]);
      return concept.getState(world, condition[1]);
    });
  }

  consider(world) {
    const newStateValues = this.examineConceptState(world);
    if (newStateValues.every((v, i) => v == this._stateConditions[i][2])) {
      return this._effect(null, null, world._model);
    }

    return null;
  }
}
