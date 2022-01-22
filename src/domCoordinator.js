import { Coordinator } from './coordinator.js'

export class domCoordinator extends Coordinator {
  constructor({ world, inputHandlerFactory, renderWorld, window }) {
    const onNextWorld = (coordinator, world) => {
      renderWorld(coordinator, world, window);
    }
    super({
      world: world,
      inputHandlerFactory: inputHandlerFactory,
      onNextWorld: onNextWorld
    });
  }
}
