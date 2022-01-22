export class Transitor {
  constructor(testFunction) {
    this._testFunction = testFunction;
  }

  test(action, world) {
    return this._testFunction(action, world);
  }
}
