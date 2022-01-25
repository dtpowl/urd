import { SemanticSet } from './semanticSet.js'

export class EventResolutionCycle {
  constructor(model) {
    this._model = model;
    this._relateTriggers = new SemanticSet();
    this._unrelateTriggers = new SemanticSet();
  }

  get relateTriggers() { return this._relateTriggers; }
  get unrelateTriggers() { return this._relateTriggers; }

  addTriggers({ relate, unrelate }) {
    if (relate) {
      this.checkRelateContradiction(relate);
      this.runRelateTriggers(relate);
    }
    if (unrelate) {
      this.checkUnrelateContradiction(unrelate);
      this.runUnrelateTriggers(unrelate);
    }
  }

  checkRelateContradiction(relateTriggers) {
    relateTriggers.forEach((trigger) => {
      if (this._unrelateTriggers.has(trigger)) {
        throw `relate trigger is contradictive: ${trigger[0]._name} ${trigger[1]}`;
      }
    });
  }

  checkUnrelateContradiction(unrelateTriggers) {
    unrelateTriggers.forEach((trigger) => {
      if (this._relateTriggers.has(trigger)) {
        throw `unrelate trigger is contradictive: ${trigger[0]._name} ${trigger[1]}`;
      }
    });
  }

  runRelateTriggers(relateTriggers) {
    relateTriggers.forEach((trigger) => {
      if (!this._relateTriggers.has(trigger)) {
        this._relateTriggers.add(trigger);

        this._model._performRelateCycle(trigger[0], this, trigger[1]);
      }
    });
  }

  runUnrelateTriggers(unrelateTriggers) {
    unrelateTriggers.forEach((trigger) => {
      if (!this._unrelateTriggers.has(trigger)) {
        this._unrelateTriggers.add(trigger);
        this._model._performUnrelateCycle(trigger[0], this, trigger[1]);
      }
    });
  }
}
