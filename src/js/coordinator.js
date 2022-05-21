export class Coordinator {
  constructor({ world, view, inputHandlerFactory, onNextWorld }) {
    this._world = world;
    this._view = view;
    this._inputHandlerFactory = inputHandlerFactory || ((world) => {
      return (action) => action
    }),
    this._onNextWorld = onNextWorld;
  }

  get world() { return this._world; }

  init() {
    this._onNextWorld(this, this._world);
    return this;
  }

  inputAcceptor() {
    if (!this._inputAcceptor) {
      const acceptor = {};
      const inputHandler = this._inputHandlerFactory(this._world);
      const promise = new Promise((resolve, reject) => {
        acceptor.resolve = (value) => { resolve(value); };
        acceptor.reject = (msg) => { reject(msg); }
      });
      promise.then((inputValue) => {
        const action = inputHandler(inputValue);
        const nextWorld = action.perform(this._world);
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
