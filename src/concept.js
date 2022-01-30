import { Presentable } from './presentable.js'
export class Concept extends Presentable {
  constructor(atom, props) {
    super(props);
    this._atom = atom;
  }

  get atom() { return this._atom; }
}
