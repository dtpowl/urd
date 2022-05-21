import { Presentable } from './presentable.js'
export class Action extends Presentable {
  constructor(event, props, { willFail }={}) {
    super(props);
    this._event = event;
    this._failed = Boolean(willFail);
    this._failMessages = null;

    this._onSuccess = [];
  }

  // accessor methods
  get event() { return this._event; }
  get failed() { return this._failed; }
  // end accessor methods

  onSuccess(cb) {
    this._onSuccess.push(cb);
  }

  onFailure(cb) {
    if (this.failed) {
      cb(this.failMessages);
    } else {
      this._onFailure.push(cb);
    }
  }

  perform(world) {
    return world.applyAction(this);
  }

  succeed(world) {
    this._onSuccess.forEach((cb) => cb(world));
    world.commitState();
  }

  fail(messages) {
    this._failMessages = messages;
    return this._onFailure.forEach((cb) => cb(messages));
  }
}
