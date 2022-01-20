import { Uid } from './uid.js'
import { SemanticSet } from './semanticSet.js'
import { Relation } from './relation.js'
import { Invariant } from './invariant.js'

export class Model {
  constructor(name, { atoms, relations, invariants, _relationTable, _atomSet }) {
    this._name = name;
    this._uid = Uid.next();

    if (_atomSet) {
      this._atoms = _atomSet;
    } else {
      this._atoms = new Set();
      this._addAtoms(...atoms);
    }

    if (_relationTable) {
      this._relations = _relationTable;
    } else {
      this._relations = new Map();
      relations.forEach((relationTuple) => this._addRelation(...relationTuple));
    }

    this._invariantInput = invariants; // this will be used to clone the Model
    this._invariants = new Set();
    invariants.forEach((invariantTuple) => this._addInvariant(...invariantTuple));

    this._frozen = false;
  }

  // accessors
  get frozen() { return this._frozen; }
  //

  clone() {
    let clonedRelationTable = new Map();
    for (const entry of this._relations) {
      clonedRelationTable.set(entry[0], entry[1].clone());
    }
    return new Model(
      this._name, {
        _atomSet: this._atoms,
        _relationTable: this._relations,
        invariants: this._invariantInput
      }
    );
  }

  freeze() {
    this._frozen = true;
  }

  _addAtoms(...atoms) {
    atoms.forEach((atom) => this._atoms.add(atom));
  }

  _addRelation(name, arity) {
    let relation = new Relation(name, arity);
    this._relations.set(name, relation);
  }

  _addInvariant(relationName, type) {
    let relation = this._relations.get(relationName);
    let invariant = new type(relation);
    this._invariants.add(invariant);
  }

  assert(statements) {
    if (this._frozen) {
      throw "Can't add assertions to frozen model!";
    }

    // translate statements into trigger format
    let triggers = {}
    if (statements.relate) {
      triggers.relate = statements.relate.map((statement) => {
        return [
          this._relations.get(statement[0]),
          statement.slice(1)
        ];
      });
    }
    if (statements.unrelate) {
      triggers.unrelate = statements.unrelate.map((statement) => {
        return [
          this._relations.get(statement[0]),
          statement.slice(1)
        ];
      });
    }
    let cycle = new ResolutionCycle(this);
    cycle.addTriggers(triggers);
  }

  _relate(relationName, ...atoms) {
    let relation = this._relations.get(relationName);
    let cycle = new ResolutionCycle(this);
    this.performRelateCycle(relation, cycle, atoms);
  }

  _unrelate(relationName, ...atoms) {
    let relation = this._relations.get(relationName);
    let cycle = new ResolutionCycle(this);
    this.performUnrelateCycle(relation, cycle, atoms);
  }

  check(relationName, ...atoms) {
    let relation = this._relations.get(relationName);
    let allAtomsInModel = atoms.reduce((ac, atom) => {
      return ac &&= this._atoms.has(atom);
    }, true);
    if (!allAtomsInModel) {
      throw "Cannot evaluate predicate for unknown atoms";
    }
    return relation.check(...atoms);
  }

  performRelateCycle(relation, cycle, atoms) {
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

  performUnrelateCycle(relation, cycle, atoms) {
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

class ResolutionCycle {
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
        this._model.performRelateCycle(trigger[0], this, trigger[1]);
      }
    });
  }

  runUnrelateTriggers(unrelateTriggers) {
    unrelateTriggers.forEach((trigger) => {
      if (!this._unrelateTriggers.has(trigger)) {
        this._unrelateTriggers.add(trigger);
        this._model.performUnrelateCycle(trigger[0], this, trigger[1]);
      }
    });
  }
}
