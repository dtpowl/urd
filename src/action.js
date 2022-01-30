import { Presentable } from './presentable.js'
export class Action extends Presentable {
  constructor(event, props) {
    super(props);
    this._event = event;

    this._onSuccess = [];
    this._onFailure = [];
  }

  // accessor methods
  get event() { return this._event; }
  // end accessor methods

  onSuccess(cb) {
    this._onSuccess.push(cb);
  }

  onFailure(cb) {
    this._onSuccess.push(cb);
  }

  perform(world) {
    return world.applyAction(this);
  }

  succeed(world) {
    return this._onSuccess.forEach((cb) => cb(world));
  }

  fail(world, messages) {
    return this._onFailure.forEach((cb) => cb(world));
  }
}
