import { Presentable } from './presentable.js'
import { SemanticMap } from './semanticMap.js'

export class Concept extends Presentable {
  constructor(atom, props, state) {
    super(props);
    // todo: prevent one concept from belonging to multiple world lineages?
    this._atom = atom;
    if (state) {
      this._hasState = true;
      this._initState = new Map();
      for (let k in state) {
        this._initState.set(k, state[k]);
      }
      this._stateTable = new Map();
      // todo: typed array here
      this._committedWorldIds = []; // DESCENDING ORDER
    } else {
      this._hasState = false;
    }
  }

  get atom() { return this._atom; }
  get hasState() { return this._hasState; }

  setState(world, key, value) {
    if (!this._hasState && !this._initState.has(key)) {
      throw "Can't set state of undeclared key!";
    }
    if (this._committedWorldIds.indexOf(world.uid) >= 0) {
      throw "Can't set state for committed world!";
    }
    if (!this._stateTable.has(world.uid)) {
      this._stateTable.set(world.uid, new Map());
    }
    const worldStateMap = this._stateTable.get(world.uid);

    if (worldStateMap.has(key)) {
      throw "Can't set state key twice!";
    } else {
      worldStateMap.set(key, value);
    }
  }

  getState(world, key) {
    if (!this._initState.has(key)) {
      throw "Can't get state of undeclared key!";
    }

    // todo: use bsearch here.
    // note that the array is in descending order
    const bestWorldId = this._committedWorldIds.find((id) => id <= world.uid);
    if (bestWorldId) {
      return this._stateTable.get(bestWorldId).get(key);
    } else {
      return this._initState.get(key);
    }
  }

  commitWorld(world) {
    const maxWorldId = this._committedWorldIds[0];
    const currentState = this._stateTable.get(maxWorldId);
    if (!this._stateTable.has(world.uid)) {
      this._stateTable.set(world.uid, new Map());
    }
    const nextState = this._stateTable.get(world.uid);

    if (currentState) {
      for (let k in currentState) {
        nextState.set(k, currentState.get(k));
      }
    }
    for (let entry of this._initState) {
      if (!nextState.has(entry[0])) {
        nextState.set(entry[0], entry[1]);
      }
    }

    this._committedWorldIds.unshift(world.uid);
  }
}
