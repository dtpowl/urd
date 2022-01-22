import { Uid } from './uid.js'
import { SemanticSet } from './semanticSet.js'
import { Relation } from './relation.js'
import { Invariant } from './invariant.js'
import { EventResolutionCycle } from './eventResolutionCycle.js'

export class Model {
  constructor({ atoms, relations, invariants, _relationTable, _atomSet }) {
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
      {
        _atomSet: this._atoms,
        _relationTable: this._relations,
        invariants: this._invariantInput
      }
    );
  }

  freeze() {
    this._frozen = true;
  }

  assert(statements) {
    if (this._frozen) {
      throw "Can't add assertions to frozen model!";
    }

    // translate statements into trigger format
    let triggers = {}
    if (statements.relate) {
      triggers.relate = statements.relate.map((statement) => {
        if (typeof statement === 'undefined') { debugger }
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
    let cycle = new EventResolutionCycle(this);
    cycle.addTriggers(triggers);
  }

  check(relationName, ...atoms) {
    let relation = this._relations.get(relationName);
    let allAtomsInModel = atoms.reduce((ac, atom) => {
      return ac &&= this._atoms.has(atom);
    }, true);
    if (!allAtomsInModel) {
      debugger
      throw "Cannot evaluate predicate for unknown atoms";
    }
    return relation.check(...atoms);
  }

  which(relationName, subject) {
    return this._relations.get(relationName).relatedObjectsForSubject(subject);
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

  _assert(relationName, ...atoms) {
    let relation = this._relations.get(relationName);
    let cycle = new EventResolutionCycle(this);
    this._performRelateCycle(relation, cycle, atoms);
  }

  _unrelate(relationName, ...atoms) {
    let relation = this._relations.get(relationName);
    let cycle = new EventResolutionCycle(this);
    this._performUnrelateCycle(relation, cycle, atoms);
  }

  _performRelateCycle(relation, cycle, atoms) {
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

  _performUnrelateCycle(relation, cycle, atoms) {
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
