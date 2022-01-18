import { Uid } from './uid.js'
import { SemanticSet } from './semanticSet.js'

export class Relation {
  constructor(name, arity, context, defaultValue=false) {
    this._name = name;
    this._uid = Uid.next();
    this._arity = arity;
    this._context = context;
    this._table = new Map();
    this._defaultValue = defaultValue;
  }
  // accessor methods
  get name() { return this._name; }
  get uid() { return this._uid; }
  get category() { return 'Relation'; }
  get arity() { return this._arity; }
  get context() { return this._context; }
  get defaultValue() { return this._defaultValue; }
  // end accessor methods

  get(subject) {
    let tableValue = this._table.get(subject);
    if (!tableValue) {
      tableValue = new SemanticSet();
      this._table.set(subject, tableValue);
    }
    return tableValue;
  }

  relate(...atoms) {
    if (atoms.length != this._arity) {
      throw "Wrong arity for relation `${this.name}`";
    }
    const subject = atoms[0];
    const objects = atoms.splice(1);
    this.get(subject).add(objects);
  }

  unrelate(...atoms) {
    if (atoms.length != this._arity) {
      throw "Wrong arity for relation `${this.name}`";
    }
    const subject = atoms[0];
    const objects = atoms.splice(1);
    this.get(subject).delete(objects);
  }

  check(...atoms) {
    if (atoms.length != this._arity) {
      throw "Wrong arity for relation `${this.name}`";
    }
    const subject = atoms[0];
    const objects = atoms.splice(1);
    return this.get(subject).has(objects);
  }
}
