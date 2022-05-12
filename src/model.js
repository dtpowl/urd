import { Uid } from './uid.js'
import { SemanticSet } from './semanticSet.js'
import { SemanticMap } from './semanticMap.js'
import { AtomList } from './atomList.js'
import { Relation } from './relation.js'
import { Invariant } from './invariant.js'
import { EventResolutionCycle } from './eventResolutionCycle.js'

export class Model {
  static fromParent(parent) {
    const newModel = parent.clone();

    // this is the only place outside of the constructor that we should assign to _parent
    newModel._parent = parent;
    return newModel;
  }

  constructor({ atoms, relations, derivedRelations, invariants, _atomSet, _parent, _relationTable }) {
    this._uid = Uid.next();

    if (_atomSet) {
      this._atoms = _atomSet;
    } else {
      this._atoms = new SemanticSet();
      this._addAtoms(atoms);
    }

    if (_relationTable) {
      this._relations = _relationTable;
    } else {
      this._relations = new SemanticMap();
      relations.forEach((relationTuple) => this._addRelation(...relationTuple));
    }

    this._parent = _parent;

    this._derivedRelationsInput = derivedRelations; // this will be used to clone the Model
    this._derivedRelationArities = new Map();
    this._derivedRelationQueryMakers = new Map();
    derivedRelations.forEach((tuple) => {
      let name = tuple[0];
      let arity = tuple[1];
      let queryMaker = tuple[2];
      this._derivedRelationArities.set(name, arity);
      this._derivedRelationQueryMakers.set(name, queryMaker);
    });

    this._invariantInput = invariants; // this will be used to clone the Model
    this._invariants = new Set();
    invariants.forEach((invariantTuple) => this._addInvariant(...invariantTuple));

    this._queryCache = new Map();
    this._frozen = false;
  }

  // accessors
  get frozen() { return this._frozen; }
  get uid() { return this._uid; }
  //

  clone() {
    let clonedRelationTable = new Map();
    for (const entry of this._relations) {
      clonedRelationTable.set(entry[0], entry[1].clone());
    }
    return new Model(
      {
        _atomSet: this._atoms,
        _relationTable: this._relations.clone(),
        _parent: this._parent,
        derivedRelations: this._derivedRelationsInput,
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
    let triggers = {};
    if (statements.relate) {
      triggers.relate = statements.relate.map((statement) => {
        return [
          this._relations.get(statement[0]),
          AtomList.from(statement[1])
        ];
      });
    }

    if (statements.unrelate) {
      triggers.unrelate = statements.unrelate.map((statement) => {
        return [
          this._relations.get(statement[0]),
          AtomList.from(statement[1])
        ];
      });
    }
    let cycle = new EventResolutionCycle(this);
    cycle.addTriggers(triggers);
  }

  _resolveQueryArgument(queryArgument) {
    // todo: better way to determine if something is a subquery
    if (queryArgument.constructor.name == 'Object') {
      return this.query(queryArgument);
    } else {
      return queryArgument;
    }
  }

  _resolveQueryArguments(queryArguments) {
    if (!Array.isArray(queryArguments)) {
      return this._resolveQueryArgument(queryArguments);
    }

    return queryArguments.map((qa) => this._resolveQueryArgument(qa));
  }

  // todo: is this needed or should we be using _resolveQueryArguments instead
  atoms(subqueries) {
    if (!Array.isArray(subqueries)) {
      return this.atoms([subqueries])
    }

    return new AtomList(
      subqueries.map((atomOrQuery) => {
        if (atomOrQuery.constructor.name == 'Object') {
          return this.query(atomOrQuery);
        } else {
          return atomOrQuery;
        }
      })
    );
  }

  check(relationName, atoms) {
    const resolvedAtoms = this.atoms(atoms);
    const allAtomsInModel = resolvedAtoms.reduce((ac, atom) => {
      return ac &&= this._atoms.has(atom);
    }, true);
    if (!allAtomsInModel) {
      throw "Cannot evaluate predicate for unknown atoms";
    }

    const relation = this._relations.get(relationName);
    if (relation) {
      return relation.check(resolvedAtoms);
    };

    const derivedRelationArity = this._derivedRelationArities.get(relationName);
    if (!derivedRelationArity) {
      throw `unknown relation ${relationName}`;
    }

    if (derivedRelationArity != resolvedAtoms.length) {
      throw `wrong arity for relation ${relationName}`;
    }

    const subject = resolvedAtoms.first();
    const objects = resolvedAtoms.rest();
    return this.which(relationName, subject).has(objects);
  }

  subjects(relationName) {
    let relation = this._relations.get(relationName);
    if (relation) {
      return relation.subjects();
    };

    // for derived relations, there's no speedy way to look up subjects. we just have to exhaust
    // todo: think about this
    let derivedRelationQueryMaker = this._derivedRelationQueryMakers.get(relationName);
    if (derivedRelationQueryMaker) {
      return this._atoms.filter((atom) => {
        return this.query(derivedRelationQueryMaker(atom)).length > 0;
      });
    }

    throw `unknown relation ${relationName}`;
  }

  parentQuery(queryBody) {
    if (!this._parent) { return null; }
    return this._parent.query(queryBody);
  }

  propositions(relationName) {
    let relation = this._relations.get(relationName);
    if (relation) {
      return relation.propositions();
    }

    // for derived relations, there's no speedy way to look up subjects. we just have to exhaust
    // todo: think about this
    let derivedRelationQueryMaker = this._derivedRelationQueryMakers.get(relationName);
    if (derivedRelationQueryMaker) {
      return new SemanticSet(
        this._atoms.arrayMap((atom) => {
          return this.query(derivedRelationQueryMaker(atom)).arrayMap((objectVals) => {
            return objectVals.map((objects) => {
              if (objects.length > 0) {
                return new AtomList(relationName, atom, objects);
              } else {
                return null;
              }
            });
        }).flat().filter((x) => Boolean(x));
        }).flat()
      );
    }

    throw `unknown relation ${relationName}`;
  }

  which(relationName, subject) {
    if (subject.constructor.name == 'Object') {
      let queryResult = this.query(subject) || [];
      if (typeof queryResult == 'boolean' || queryResult.length > 1) {
        throw "`which` query requires at most one subject atom";
      }
      return this.which(relationName, queryResult);
    }

    let relation = this._relations.get(relationName);
    if (relation) {
      return relation.relatedObjectsForSubject(subject);
    };

    let derivedRelationQueryMaker = this._derivedRelationQueryMakers.get(relationName);
    if (derivedRelationQueryMaker) {
      return this.query(derivedRelationQueryMaker(subject));
    }

    throw `unknown relation ${relationName}`;
  }

  firstWhich(relationName, subject) {
    return this.which(relationName, subject).take();
  }

  anyWhich(relationName, subjects) {
    const resolvedSubjects = this._resolveQueryArguments(subjects);
    const subqs = resolvedSubjects.arrayMap((subject) => {
      return { which: [relationName, subject] }
    });

    return this.query({ or: subqs });
  }

  allWhich(relationName, subjects) {
    const resolvedSubjects = this._resolveQueryArguments(subjects);
    const subqs = resolvedSubjects.arrayMap((subject) => {
      return { which: [relationName, subject] }
    });
    return this.query({ and: subqs });
  }

  not(queryArg) {
    let subqVal = this.query(queryArg);
    if (subqVal == null || typeof subqVal == 'boolean') { return !subqVal; }
    return subqVal.invert(); // SemanticSet
  }

  or(queryArg) {
    let subqVals = this._resolveQueryArguments(queryArg);

    if (subqVals.length == 0) {
      return new SemanticSet();
    }

    if (subqVals.every((x) => typeof x == 'boolean')) {
      return new SemanticSet(subqVals.reduce((x, ac) => ac || x));
    } else {
      return new SemanticSet(
        subqVals.
          filter((x) => typeof x != 'boolean').
          reduce((x, ac) => ac.union(x))
      );
    }
  }

  and(queryArg) {
    let subqVals = queryArg.map((subq) => this.query(subq));
    let booleanReduction = subqVals.
        filter((x) => typeof x == 'boolean').
        reduce((x, ac) => ac && x, true);
    let iterableSubqVals = subqVals.
        filter((x) => typeof x != 'boolean');
    if (iterableSubqVals.length === 0) {
      return booleanReduction;
    } else if (!booleanReduction) {
      return new SemanticSet();
    } else {
      return iterableSubqVals.reduce((x, ac) => ac.intersection(x));
    }
  }

  query({ and, or, not, which, firstWhich, anyWhich, allWhich, check, subjects, propositions, parent }) {
    let argCount = [and, or, not, which, check].filter((x) => Boolean(x));
    if (argCount > 1) {
      throw "query accepts only one of: and, or, not, which, firstWhich, check, subjects, propositions";
    }

    let key;
    let returnVal;
    if (this.frozen) {
      key = JSON.stringify(arguments[0]);
      returnVal = this._queryCache.get(key);
      if (returnVal) { return returnVal; }
    }

    if (check) {
      returnVal = this.check(...check);

    } else if (which) {
      returnVal = this.which(...which);

    } else if (firstWhich) {
      returnVal = this.firstWhich(...firstWhich);

    } else if (anyWhich) {
      returnVal = this.anyWhich(...anyWhich);

    } else if (allWhich) {
      returnVal = this.allWhich(...allWhich);

    } else if (not) {
      returnVal = this.not(not);

    } else if (or) {
      returnVal = this.or(or);

    } else if (and) {
      returnVal = this.and(and);

    } else if (subjects) {
      returnVal = this.subjects(subjects);

    } else if (parent) {
      returnVal = this.parentQuery(parent);

    } else if (propositions) {
      returnVal = this.propositions(propositions);

    } else {
      throw `Unrecognized query clause \`${key}\``;
    }

    if (this.frozen) {
      this._queryCache.set(key, returnVal);
    }
    return returnVal;
  }

  _addAtoms(atoms) {
    atoms.forEach((atom) => this._atoms.add(atom));
  }

  _addRelation(name, arity) {
    let relation = new Relation(name, arity);
    this._relations.set(name, relation);
  }

  _addInvariant(relationNames, type) {
    let relations = relationNames.map((name) => this._relations.get(name));
    let invariant = new type(...relations);
    this._invariants.add(invariant);
  }

  _assert(relationName, atoms) {
    throw 'Unused?'; // todo

    atoms = AtomList.from(atoms);

    let relation = this._relations.get(relationName);
    let cycle = new EventResolutionCycle(this);

    this._performRelateCycle(relation, cycle, atoms);
  }

  _unrelate(relationName, atoms) {
    throw 'Unused?'; // todo

    atoms = AtomList.from(atoms);

    let relation = this._relations.get(relationName);
    let cycle = new EventResolutionCycle(this);
    this._performUnrelateCycle(relation, cycle, atoms);
  }

  _performRelateCycle(relation, cycle, atoms) {
    atoms = AtomList.from(atoms);

    this._invariants.forEach((invariant) => {
      let triggers = invariant.beforeRelate(relation, atoms);
      cycle.addTriggers(triggers);
    });

    relation.relate(atoms);

    this._invariants.forEach((invariant) => {
      let triggers = invariant.afterRelate(relation, atoms);
      cycle.addTriggers(triggers);
    });
  }

  _performUnrelateCycle(relation, cycle, atoms) {
    atoms = AtomList.from(atoms);

    this._invariants.forEach((invariant) => {
      let triggers = invariant.beforeUnrelate(relation, atoms);
      cycle.addTriggers(triggers);
    });

    relation.unrelate(atoms);

    this._invariants.forEach((invariant) => {
      let triggers = invariant.afterUnrelate(relation, atoms);
      cycle.addTriggers(triggers);
    });
  }
}
