import { AtomList } from './atomList.js'

export class Invariant {
  beforeRelate() { return {} }
  beforeUnrelate() { return {} }
  afterRelate() { return {} }
  afterUnrelate() { return {} }
}

export class Inverse extends Invariant {
  constructor(lhs, rhs) {
    super();

    if (lhs.defaultValue === rhs.defaultValue) {
      throw "Invariant not satisfiable: identical default values";
    }

    this._lhs = lhs;
    this._rhs = rhs;
  }

  afterRelate(relation, atoms) {
    if (relation == this._lhs) {
      return {
        unrelate: [ [this._rhs, atoms] ]
      }
    }

    if (relation == this._rhs) {
      return {
        unrelate: [ [this._lhs, atoms] ]
      }
    }

    return {};
  }

  afterUnrelate(relation, atoms) {
    if (relation == this._lhs) {
      return {
        relate: [ [this._rhs, atoms] ]
      }
    }

    if (relation == this._rhs) {
      return {
        relate: [ [this._lhs, atoms] ]
      }
    }

    return {};
  }
}

export class Mutex extends Invariant {
  constructor(lhs, rhs) {
    super();

    if (lhs.defaultValue && rhs.defaultValue) {
      throw "Invariant not satisfiable: invalid default values";
    }

    this._lhs = lhs;
    this._rhs = rhs;
  }

  afterRelate(relation, atoms) {
    if (relation == this._lhs) {
      return {
        unrelate: [ [this._rhs, atoms] ]
      }
    }

    if (relation == this._rhs) {
      return {
        unrelate: [ [this._lhs, atoms] ]
      }
    }

    return {};
  }
}

export class Unique extends Invariant {
  constructor(relation) {
    super();
    this._relation = relation;
  }

  beforeRelate(relation, atoms) {
    if (relation != this._relation) { return {}; }

    const subject = atoms.first();
    const objectAtoms = atoms.rest();
    const existingSaturations = relation.relatedObjectsForSubject(subject);
    const output = {
      unrelate: []
    };
    existingSaturations.forEach((existingObjectAtoms) => {
      if (!objectAtoms.identical(existingObjectAtoms)) {
        output.unrelate.push([this._relation, [subject].concat(existingObjectAtoms)])
      }
    });
    return output;
  }
}

export class Symmetric extends Invariant {
  constructor(relation) {
    super();
    this._relation = relation;
  }

  afterRelate(relation, atoms) {
    if (relation != this._relation) { return {}; }

    const subject = atoms.first();
    const object = atoms.rest()
    return {
      relate: [ [this._relation, [object, subject]] ]
    };
  }

  afterUnrelate(relation, atoms) {
    if (relation != this._relation) { return {}; }

    const subject = atoms.first();
    const object = atoms.rest();
    return {
      unrelate: [ [this._relation, [object, subject]] ]
    };
  }
}

export class Implies extends Invariant {
  constructor(lhs, rhs) {
    super();
    this._lhs = lhs;
    this._rhs = rhs;
  }

  afterRelate(relation, atoms) {
    if (relation != this._lhs) { return {}; }
    return {
      relate: [
        [this._rhs, atoms]
      ]
    }
  }

  afterUnrelate(relation, atoms) {
    if (relation != this._lhs) { return {}; }
    return {
      unrelate: [
        [this._rhs, atoms]
      ]
    }
  }
}

export class Supervenient extends Invariant {
  // f(x,y) && g(x,z) => g(y,z)
  constructor(locatedIn, possesses) {
    super();
    this._locatedIn = locatedIn;
    this._possesses = possesses;
  }

  afterRelate(relation, atoms) {
    const subject = atoms.first();
    const object = atoms.rest();

    if (relation == this._locatedIn) {
      return {
        relate: this._possesses.relatedObjectsForSubject(subject).arrayMap((possessedItem) => {
          return [this._locatedIn, new AtomList(possessedItem, object)];
        })
      };
    }

    if (relation == this._possesses) {
      return {
        relate: this._locatedIn.relatedObjectsForSubject(subject).arrayMap((location) => {
          return [this._locatedIn, new AtomList(object, location)];
        })
      };
    }


    return {};
  }
}

export class Converse extends Invariant {
  constructor(lhs, rhs) {
    super();

    this._lhs = lhs;
    this._rhs = rhs;
  }

  afterRelate(relation, atoms) {
    atoms = AtomList.from(atoms);

    if (relation == this._lhs) {
      return {
        relate: [ [this._rhs, atoms.reverse()] ]
      }
    }

    if (relation == this._rhs) {
      return {
        relate: [ [this._lhs, atoms.reverse()] ]
      }
    }

    return {};
  }

  afterUnrelate(relation, atoms) {
    atoms = AtomList.from(atoms);

    if (relation == this._lhs) {
      return {
        unrelate: [ [this._rhs, atoms.reverse()] ]
      }
    }

    if (relation == this._rhs) {
      return {
        unrelate: [ [this._lhs, atoms.reverse()] ]
      }
    }

    return {};
  }
}
