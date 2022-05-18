import { SemanticSet } from './semanticSet.js'

// introduced this for relation subject caching,
// which I removed. todo: remove this once I'm
// sure I won't need it
export class SemanticMultiset {
  constructor() {
    this._map = new Map();
    this._keys = new Set();
  }

  add(element) {
    const key = SemanticSet.keyFor(element);
    this._keys.add(key, element);
    if (this._map.has(key)) {
      const count = this._map.get(key);
      this._map.set(key, count+1);
    } else {
      this._map.set(key, 1);
    }
  }

  remove(element) {
    const key = SemanticSet.keyFor(element);
    if (this._map.has(key)) {
      const count = this._map.get(key);
      if (count == 0) {
        this._keys.delete(key);
        this._map.delete(key);
      } else {
        this._map.set(key, count-1);
      }
    }
  }

  count(element) {
    return this._map.get(key) || 0;
  }

  keys() {
    return new SemanticSet(this._keys);
  }
}
