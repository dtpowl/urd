export class Coordinator {
  constructor({ world, inputHandlerFactory, onNextWorld }) {
    this._world = world;
    this._inputHandlerFactory = inputHandlerFactory || ((world) => {
      return (action) => action
    }),
    this._onNextWorld = onNextWorld;
  }

  init() {
    this._onNextWorld(this, this._world);
    return this;
  }

  inputAcceptor() {
    if (!this._inputAcceptor) {
      let acceptor = {};
      let inputHandler = this._inputHandlerFactory(this._world);
      let promise = new Promise((resolve, reject) => {
        acceptor.resolve = (value) => { resolve(value); };
        acceptor.reject = (msg) => { reject(msg); }
      });
      promise.then((inputValue) => {
        let action = inputHandler(inputValue);
        let nextWorld = action.perform(this._world);
        this._onNextWorld(this, nextWorld);
        this._world = nextWorld;
        this._inputAcceptor = null;
      })
      this._inputAcceptor = acceptor;
    }
    return this._inputAcceptor;
  }

  input(value) {
    this.inputAcceptor().resolve(value);
  }
}
