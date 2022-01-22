import { Uid } from './uid.js'
import { SemanticSet } from './semanticSet.js'

export class Relation {
  constructor(name, arity, defaultValue=false) {
    this._name = name;
    this._uid = Uid.next();
    this._arity = arity;
    this._defaultValue = defaultValue;
    this._table = new Map();
  }
  // accessor methods
  get name() { return this._name; }
  get uid() { return this._uid; }
  get category() { return 'Relation'; }
  get arity() { return this._arity; }
  get defaultValue() { return this._defaultValue; }
  // end accessor methods

  clone() {
    let newRelation = new Relation(this.name, this.arity, this.defaultValue);
    for (const entry of this._table.entries()) {
      let subject = entry[0];
      let semanticSet = entry[1];
      semanticSet.forEach((objects) => {
        let argumentArray = [subject].concat(objects)
        newRelation.relate(...argumentArray);
      });
    }
    return newRelation;
  }

  get(subject) {
    let tableValue = this._table.get(subject);
    if (!tableValue) {
      tableValue = new SemanticSet();
      this._table.set(subject, tableValue);
    }
    return tableValue;
  }

  relatedObjectsForSubject(subject) {
    return Array.from(this.get(subject).values());
  }

  relate(...atoms) {
    if (atoms.length != this._arity) {
      throw `Cannot relate; Wrong arity for relation ${this.name}`;
    }
    const subject = atoms[0];
    const objects = atoms.splice(1);
    this.get(subject).add(objects);
  }

  unrelate(...atoms) {
    if (atoms.length != this._arity) {
      throw `Cannot unrelate; Wrong arity for relation ${this.name}`;
    }
    const subject = atoms[0];
    const objects = atoms.splice(1);
    this.get(subject).delete(objects);
  }

  check(...atoms) {
    if (atoms.length != this._arity) {
      throw `Cannot check; Wrong arity for relation ${this.name}`;
    }
    const subject = atoms[0];
    const objects = atoms.splice(1);
    return this.get(subject).has(objects);
  }
}
