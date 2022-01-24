import { Model } from '../model.js';
import { Relation } from '../relation.js';
import { Unique, Symmetric } from '../invariant.js';
import { World } from '../world.js'
import { Observer } from '../observer.js'
import { Action } from '../action.js'
import { Transitor } from '../transitor.js'
import { Coordinator } from '../coordinator.js'

export class Concept {
  constructor({name, title, shortDescription, description, noAutomention}={}) {
    this._name = name;
    this._title = title;
    this._shortDescription = shortDescription || this._title;
    this._description = description || this._shortDescription;
    this._noAutomention = noAutomention;
  }

  get name() { return this._name; }
  get title() { return this._title; }
  get shortDescription() { return this._shortDescription; }
  get description() { return this._description; }
  get automention() { return !this._noAutomention }
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

export class TakeAction extends Action {
  constructor(subject, object) {
    super({
      relate: [ ['possesses', subject, object] ]
    });
    this.subject = subject;
    this.object = object;
  }
}

export class DropAction extends Action {
  constructor(subject, object) {
    super({
      unrelate: [ ['possesses', subject, object] ]
    });
    this.subject = subject;
    this.object = object;
  }
}

export class WriteAction extends Action {
  constructor(subject, object) {
    super({
      relate: [ ['hasWrittenOn', subject, object] ]
    });
  }
}

export class EraseAction extends Action {
  constructor(subject, object1, object2) {
    super({
      unrelate: [
        ['hasWrittenOnFirst', subject, object1],
        ['hasWrittenOnSecond', subject, object2]
      ]
    });
  }
}
