export class Invariant {
  beforeRelate(...args) { return {} }
  beforeUnrelate(...args) { return {} }
  afterRelate(...args) { return {} }
  afterUnrelate(...args) { return {} }
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

  afterRelate(relation, ...atoms) {
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

  afterUnrelate(relation, ...atoms) {
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

  afterRelate(relation, ...atoms) {
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

  beforeRelate(relation, ...atoms) {
    if (relation != this._relation) { return {}; }

    let subject = atoms[0];
    let objectAtoms = atoms.slice(1);
    let existingSaturations = relation.get(subject);
    let output = {
      unrelate: []
    };
    existingSaturations.forEach((existingObjectAtoms) => {
      if (!objectAtoms.every((el, i) => el == existingObjectAtoms[i])) {
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

  afterRelate(relation, ...atoms) {
    if (relation != this._relation) { return {}; }

    let subject = atoms[0];
    let object = atoms[1];
    return {
      relate: [ [this._relation, [object, subject]] ]
    };
  }

  afterUnrelate(relation, ...atoms) {
    if (relation != this._relation) { return {}; }

    let subject = atoms[0];
    let object = atoms[1];
    return {
      unrelate: [ [this._relation, [object, subject]] ]
    };
  }
}

export class Supervenient extends Invariant {
  // f(x,y) && g(x,z) => g(y,z)
  constructor(locatedIn, possesses) {
    super();
    this._locatedIn = locatedIn;
    this._possesses = possesses;
  }

  afterRelate(relation, ...atoms) {
    let subject = atoms[0];
    let objects = atoms.slice(1);

    if (relation != this._locatedIn) { return {}; }

    return {
      relate: this._possesses.relatedObjectsForSubject(subject).map((possessedObjects) => {
        return [this._locatedIn, possessedObjects.concat(objects)];
      })
    };
  }
}

export class Converse extends Invariant {
  constructor(lhs, rhs) {
    super();

    this._lhs = lhs;
    this._rhs = rhs;
  }

  afterRelate(relation, ...atoms) {
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

  afterUnrelate(relation, ...atoms) {
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
