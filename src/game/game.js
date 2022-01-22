import { Model } from '../model.js';
import { Relation } from '../relation.js';
import { Unique, Symmetric } from '../invariant.js';
import { World } from '../world.js'
import { Observer } from '../observer.js'
import { Action } from '../action.js'
import { Transitor } from '../transitor.js'
import { Coordinator } from '../coordinator.js'

export class Scene {
  constructor(name, title, shortDescription, description) {
    this._name = name;
    this._title = title;
    this._shortDescription = shortDescription;
    this._description = description;
  }

  get name() { return this._name; }
  get title() { return this._title; }
  get shortDescription() { return this._shortDescription; }
  get description() { return this._description; }
}

export class SceneMap {
  constructor() {
    this._sceneMap = new Map();
    this._inverseSceneMap = new Map();
    this._directionMap = new Map();
  }

  get scenes() {
    return Array.from(this._sceneMap.keys());
  }

  sourcesForDestination(destination) {
    return this._inverseSceneMap.get(destination);
  }

  destinationsForSource(source) {
    return this._sceneMap.get(source);
  }

  connect(scene, direction, otherScene) {
    var submap;
    if (this._directionMap.has(scene.name)) {
      submap = this._directionMap.get(scene.name);
    } else {
      submap = new Map();
      this._directionMap.set(scene.name, submap);
    }
    submap.set(direction, otherScene);

    var adjacencies;
    if (this._sceneMap.has(scene.name)) {
      adjacencies = this._sceneMap.get(scene.name);
    } else {
      adjacencies = new Set();
      this._sceneMap.set(scene.name, adjacencies);
    }
    adjacencies.add(otherScene.name);

    if (this._inverseSceneMap.has(otherScene.name)) {
      adjacencies = this._inverseSceneMap.get(otherScene.name);
    } else {
      adjacencies = new Set();
      this._inverseSceneMap.set(otherScene.name, adjacencies);
    }
    adjacencies.add(scene.name);
  }
}

export class MoveAction extends Action {
  constructor(subject, destination) {
    super({
      relate: [ ['locatedIn', subject, destination ] ]
    });
    this.subject = subject;
    this.destination = destination;
  }
}
