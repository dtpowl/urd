import { Uid } from './uid.js'
import { SemanticSet } from './semanticSet.js'
import { Relation } from './relation.js'
import { Invariant } from './invariant.js'

class InvariantResolutionCycle {
  constructor(context) {
    this._context = context;
    this._relateTriggers = new SemanticSet();
    this._unrelateTriggers = new SemanticSet();
  }

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
        this._context.performRelateInvariantCycle(trigger[0], this, trigger[1]);
      }
    });
  }

  runUnrelateTriggers(unrelateTriggers) {
    unrelateTriggers.forEach((trigger) => {
      if (!this._unrelateTriggers.has(trigger)) {
        this._unrelateTriggers.add(trigger);
        this._context.performUnrelateInvariantCycle(trigger[0], this, trigger[1]);
      }
    });
  }
}

export class Context {
  constructor(name) {
    this._name = name;
    this._uid = Uid.next();
    this._atoms = new Set();
    this._invariants = new Set();
  }

  addAtoms(...atoms) {
    atoms.forEach((atom) => this._atoms.add(atom));
  }

  relate(relation, ...atoms) {
    let cycle = new InvariantResolutionCycle(this);
    this.addAtoms(atoms);
    this.performRelateInvariantCycle(relation, cycle, atoms);
  }

  unrelate(relation, ...atoms) {
    let cycle = new InvariantResolutionCycle(this);
    this.addAtoms(atoms);
    this.performUnrelateInvariantCycle(relation, cycle, atoms);
  }

  check(relation, ...atoms) {
    let allAtomsInContext = atoms.reduce((ac, atom) => {
      return ac &&= this._atoms.has(atom);
    }, true);
    if (!allAtomsInContext) {
      throw "Cannot evaluate predicate for out-of-context atoms";
    }
    return relation.check(...atoms);
  }

  performRelateInvariantCycle(relation, cycle, atoms) {
    this._invariants.forEach((invariant) => {
      let triggers = invariant.beforeRelate(relation, ...atoms);
      cycle.addTriggers(triggers);
    });

    relation.relate(...atoms);

    this._invariants.forEach((invariant) => {
      let triggers = invariant.afterRelate(relation, ...atoms);
      cycle.addTriggers(triggers);
    });
  }

  performUnrelateInvariantCycle(relation, cycle, atoms) {
    this._invariants.forEach((invariant) => {
      let triggers = invariant.beforeUnrelate(relation, ...atoms);
      cycle.addTriggers(triggers);
    });

    relation.unrelate(...atoms);

    this._invariants.forEach((invariant) => {
      let triggers = invariant.afterUnrelate(relation, ...atoms);
      cycle.addTriggers(triggers);
    });
  }
}
