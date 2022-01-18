export class Uid {
  static _lastUid = 0;
  static next() {
    Uid._lastUid += 1;
    return Uid._lastUid;
  }
}
