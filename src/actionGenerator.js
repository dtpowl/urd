export class ActionGenerator {
  constructor() {
    this._lastWorldVersion = null;
    this._cachedActions = null;
  }

  getActions(world) {
    if (world.uid == this._lastWorldVersion) {
      return this._cachedActions;
    }

    this._lastWorldVersion = world.uid;
    this._cachedActions = this._generateActions(world);
    return this._cachedActions;
  }

  _generateActions(world) {
    throw "Not implemented in abstract class";
  }
}
