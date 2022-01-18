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
    let existingSaturations = relation.get(subject);
    let output = {
      unrelate: []
    };
    existingSaturations.forEach((objectAtoms) => {
      output.unrelate.push([this._relation, [subject].concat(objectAtoms)])
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
