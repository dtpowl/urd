import { Coordinator } from './coordinator.js'

export class domCoordinator extends Coordinator {
  constructor({ world, view, inputHandlerFactory, renderWorld, window }) {
    const onNextWorld = (coordinator, world) => {
      renderWorld(coordinator, world, window);
    }
    super({
      world: world,
      view: view,
      inputHandlerFactory: inputHandlerFactory,
      onNextWorld: onNextWorld,
    });
  }
}
