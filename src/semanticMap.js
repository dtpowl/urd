// a map that respects semantic equality of reference type instances

import { SemanticSet } from './semanticSet.js'

export class SemanticMap {
  constructor() {
    this._map = new Map();
  }

  set(k, v) {
    this._map.set(SemanticSet.keyFor(k), v);
  }

  values() {
    return this._map.values();
  }

  mapValues(cb) {
    let out = [];
    for (const v of this._map.values()) {
      out.push(cb(v));
    }
    return out;
  }

  get(k) {
    return this._map.get(SemanticSet.keyFor(k));
  }

  delete(k) {
    this._map.delete(SemanticSet.keyFor(k));
  }
}
