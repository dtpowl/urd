import { Uid } from './uid.js'
import { SemanticSet } from './semanticSet.js'
import { AtomList } from './atomList.js'

export class Relation {
  constructor(name, arity, defaultValue=false, _table=null) {
    this._name = name;
//    this._uid = Uid.next();
    this._arity = arity;
    this._defaultValue = defaultValue;
    this._table = _table || new Map();
  }
  // accessor methods
  get name() { return this._name; }
//  get uid() { return this._uid; }
  get category() { return 'Relation'; }
  get arity() { return this._arity; }
  get defaultValue() { return this._defaultValue; }
  // end accessor methods

  clone() {
    let newTable = new Map();
    for (const entry of this._table.entries()) {
      let subject = entry[0];
      let semanticSet = entry[1];
      newTable.set(subject, semanticSet.clone());
    }
    let newRelation = new Relation(this.name, this.arity, this.defaultValue, newTable);
    return newRelation;
  }

  subjects() {
    // todo: if we tracked subjects in a multiset, we wouldn't need to recalc this every time
    let asAtomLists = new SemanticSet();
    for (const entry of this._table) {
      if (entry[1].size > 0) {
        asAtomLists.add(new AtomList(entry[0]));
      }
    }
    return asAtomLists;
  }

  propositions() {
    let asAtomLists = new SemanticSet();
    for (const k of this._table.keys()) {
      let vals = Array.from(this._table.get(k).values());
      if (vals.length > 0) {
        asAtomLists.add(new AtomList(this._name, k, vals));
      }
    }
    return asAtomLists;
  }

  _get(subject) {
    let tableValue = this._table.get(subject);
    if (!tableValue) {
      tableValue = new SemanticSet();
      this._table.set(subject, tableValue);
    }
    return tableValue;
  }

  // todo: when converting to TypeScript, require args for all of these methods to be AtomLists
  relatedObjectsForSubject(subject) {
    subject = AtomList.from(subject);
    return new SemanticSet(this._get(subject.semanticHashValue()).values());
  }

  relate(atoms) {
    atoms = AtomList.from(atoms);
    if (atoms.length != this._arity) {
      throw `Cannot relate; Wrong arity for relation ${this.name}`;
    }
    const subject = atoms.first();
    const objects = atoms.rest();
    this._get(subject.semanticHashValue()).add(objects);
  }

  unrelate(atoms) {
    atoms = AtomList.from(atoms);
    if (atoms.length != this._arity) {
      throw `Cannot unrelate; Wrong arity for relation ${this.name}`;
    }
    const subject = atoms.first();
    const objects = atoms.rest();
    this._get(subject.semanticHashValue()).delete(objects);
  }

  check(atoms) {
    atoms = AtomList.from(atoms);
    if (atoms.length != this._arity) {
      throw `Cannot check; Wrong arity for relation ${this.name}`;
    }
    const subject = atoms.first();
    const objects = atoms.rest();
    return this._get(subject.semanticHashValue()).has(objects);
  }
}
