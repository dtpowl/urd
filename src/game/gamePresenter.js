import { MoveAction } from './game.js'

export class GamePresenter {
  constructor(sceneTable) {
    this._cache = {};
    this._worldVersion = null;
    this._sceneTable = sceneTable;
  }

  sceneTitle(world) {
    let sceneAtom = this._cached(world, 'sceneAtom', (world) => {
      return world.which('locatedIn', 'player')[0][0];
    });

    return this._cached(world, 'sceneTitle', (world) => {
      return this._sceneTable.get(sceneAtom).title;
    });
  }

  sceneDescription(world) {
    let sceneAtom = this._cached(world, 'sceneAtom', (world) => {
      return world.which('locatedIn', 'player')[0][0];
    });

    return this._cached(world, 'sceneDesc', (world) => {
      return this._sceneTable.get(sceneAtom).description;
    });
  }

  choices(world) {
    let sceneAtom = this._cached(world, 'sceneAtom', (world) => {
      return world.which('locatedIn', 'player')[0][0];
    });

    return this._cached(world, 'choices', (world) => {
      let locationAtoms = world.which('adjacentTo', sceneAtom).map((e) => e[0]);

      return locationAtoms.map((destinationAtom) => {
        let destinationShort = this._sceneTable.get(destinationAtom).shortDescription;
        return [`Go to ${destinationShort}`, new MoveAction('player', destinationAtom)];
      });
    });
  }

  _cached(world, key, cb) {
    if (world.uid != this.worldVersion) {
      this._worldVersion = world.uid;
      this._cache = {};
    }
    if (typeof this._cache[key] !== 'undefined') {
      return this._cache[key];
    } else {
      let val = cb(world);
      this._cache[key] = val;
      return val;
    }
  }
}
