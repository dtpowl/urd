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
    this._multiaryDerivedRelationQueryMakers = new Map();
    this._unaryDerivedRelationQueryMakers = new Map();
    derivedRelations.forEach((tuple) => {
      const name = tuple[0];
      const arity = tuple[1];
      const queryMaker = tuple[2];
      this._derivedRelationArities.set(name, arity);
      if (arity > 1) {
        this._multiaryDerivedRelationQueryMakers.set(name, queryMaker);
      } else if (arity == 1) {
        this._unaryDerivedRelationQueryMakers.set(name, queryMaker);
      } else {
        throw `Invalid arity ${arity} for derived relation ${name}`;
      }
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
    const clonedRelationTable = new Map();
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
    const triggers = {};
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
    const cycle = new EventResolutionCycle(this);
    cycle.addTriggers(triggers);
  }

  _resolveQueryArgument(queryArgument) {
    // if it's an object, it's a subquery so we should run it.
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

  check(relationName, atoms) {
    let resolvedAtoms;
    resolvedAtoms = new AtomList(this._resolveQueryArguments(atoms));
    resolvedAtoms.forEach((atom) => {
      if (!this._atoms.has(atom)) {
        throw `Cannot evaluate predicate for unknown atom ${atom.asString()}`;
      }
    });

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
    if (derivedRelationArity == 1) {
      return this.subjects(relationName, atoms).has(subject);
    } else {
      return this.which(relationName, subject).has(objects);
    }
  }

  subjects(relationName) {
    const relation = this._relations.get(relationName);
    if (relation) {
      return relation.subjects();
    };

    // for derived relations, we just have to exhaust
    const derivedMultiaryRelationQueryMaker = this._multiaryDerivedRelationQueryMakers.get(relationName);
    if (derivedMultiaryRelationQueryMaker) {
      return this._atoms.filter((atom) => {
        return this.query(derivedMultiaryRelationQueryMaker(atom)).size > 0;
      });
    }

    const derivedUnaryRelationQueryMaker = this._unaryDerivedRelationQueryMakers.get(relationName);
    if (derivedUnaryRelationQueryMaker) {
      return this._atoms.filter((atom) => this.query(derivedUnaryRelationQueryMaker(atom)));
    }

    throw `unknown relation ${relationName}`;
  }

  bool(queryBody) {
    const intermediateVal = this.query(queryBody);
    if (typeof intermediateVal == 'bool') {
      return intermediateVal;
    }
    if (SemanticSet.isSemanticSet(intermediateVal)) {
      return intermediateVal.size > 0;
    }
    if (AtomList.isAtomList(intermediateVal)) {
      return intermediateVal.length > 0;
    }
    throw "unexpected query result type!";
  }

  parentQuery(queryBody) {
    if (!this._parent) { return null; }
    return this._parent.query(queryBody);
  }

  propositions(relationName) {
    const relation = this._relations.get(relationName);
    if (relation) {
      return relation.propositions();
    }

    // for derived relations, there's no speedy way to look up subjects. we just have to exhaust
    // todo: think about this
    const derivedRelationQueryMaker = this._multiaryDerivedRelationQueryMakers.get(relationName);
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
      const queryResult = this.query(subject) || [];
      if (typeof queryResult == 'boolean' || queryResult.length > 1) {
        throw "`which` query requires at most one subject atom";
      }
      return this.which(relationName, queryResult);
    }

    const relation = this._relations.get(relationName);
    if (relation && relation.arity > 1) {
      return relation.relatedObjectsForSubject(subject);
    } else if (relation && relation.arity == 1) {
      throw `invalid query type 'which' for relation ${relationName} of arity 1`;
    }

    const derivedRelationQueryMaker = this._multiaryDerivedRelationQueryMakers.get(relationName);
    if (derivedRelationQueryMaker) {
      return this.query(derivedRelationQueryMaker(subject));
    }

    if (this._unaryDerivedRelationQueryMakers.get(relationName)) {
      throw `invalid query type 'which' for relation ${relationName} of arity 1`;
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
    const subqVal = this.query(queryArg);
    if (subqVal == null || typeof subqVal == 'boolean') { return !subqVal; }
    return subqVal.invert(); // SemanticSet
  }

  or(queryArg) {
    const subqVals = this._resolveQueryArguments(queryArg);

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
    const subqVals = queryArg.map((subq) => this.query(subq));
    const booleanReduction = subqVals.
        filter((x) => typeof x == 'boolean').
        reduce((x, ac) => ac && x, true);
    const iterableSubqVals = subqVals.
        filter((x) => typeof x != 'boolean');
    if (iterableSubqVals.length === 0) {
      return booleanReduction;
    } else if (!booleanReduction) {
      return new SemanticSet();
    } else {
      return iterableSubqVals.reduce((x, ac) => ac.intersection(x));
    }
  }

  query({ and, or, not, which, firstWhich, anyWhich, allWhich, check, subjects, propositions, parent, bool }) {
    const argCount = [and, or, not, which, firstWhich, anyWhich,
                      allWhich, check, subjects, propositions,
                      parent, bool].filter((x) => Boolean(x));
    if (argCount > 1) {
      throw "query accepts exactly one of: and, or, not, which, firstWhich, check, subjects, propositions, parent, bool";
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

    } else if (bool) {
      returnVal = this.bool(bool);

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
    const relation = new Relation(name, arity);
    this._relations.set(name, relation);
  }

  _addInvariant(relationNames, type) {
    const relations = relationNames.map((name) => this._relations.get(name));
    const invariant = new type(...relations);
    this._invariants.add(invariant);
  }

  _performRelateCycle(relation, cycle, atoms) {
    atoms = AtomList.from(atoms);

    this._invariants.forEach((invariant) => {
      const triggers = invariant.beforeRelate(relation, atoms);
      cycle.addTriggers(triggers);
    });

    relation.relate(atoms);

    this._invariants.forEach((invariant) => {
      const triggers = invariant.afterRelate(relation, atoms);
      cycle.addTriggers(triggers);
    });
  }

  _performUnrelateCycle(relation, cycle, atoms) {
    atoms = AtomList.from(atoms);

    this._invariants.forEach((invariant) => {
      const triggers = invariant.beforeUnrelate(relation, atoms);
      cycle.addTriggers(triggers);
    });

    relation.unrelate(atoms);

    this._invariants.forEach((invariant) => {
      const triggers = invariant.afterUnrelate(relation, atoms);
      cycle.addTriggers(triggers);
    });
  }
}
