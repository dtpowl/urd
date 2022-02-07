// a map that respects semantic equality of reference type instances
//
// all object values must implement deep copy as `clone`. (immutable
// types may return self from clone)

// todo: better name? also a better name for SemanticSet

import { SemanticSet } from './semanticSet.js'

export class SemanticMap {
  constructor(_map) {
    this._map = _map || new Map();
    this[Symbol.iterator] = () => this._map.entries();
  }

  set(k, v) {
    this._map.set(SemanticSet.keyFor(k), v);
  }

  values() {
    return this._map.values();
  }

  clone() {
    let clonedMap = new Map();
    for (const entry of this._map) {
      let clonedVal;
      if (typeof entry[1] == 'object') {
        clonedVal = entry[1].clone();
      } else {
        clonedVal = entry[1];
      }
      clonedMap.set(entry[0], clonedVal);
    }

    return new SemanticMap(clonedMap);
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
