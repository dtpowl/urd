import { SemanticMap } from './semanticMap.js'
import { AtomList } from './atomList.js'

export class ConceptTable {
  constructor(concepts) {
    this._map = new SemanticMap();
    concepts.forEach((s) => {
      this._map.set(new AtomList(s.atom), s);
    });
  }

  // delegate SemanticMap interface methods to _map
  set(k, v) {
    this._map.set(k, v);
  }

  values() {
    return this._map.values();
  }

  clone() {
    return this._map.clone();
  }

  mapValues(cb) {
    return this._map.mapValues(cb);
  }

  get(k) {
    return this._map.get(k);
  }

  delete(k) {
    this._map.delete(k);
  }
}
