import { domCoordinator } from '../domCoordinator.js'
import { GameView } from './gameView.js'

export class GameCoordinator extends domCoordinator {
  constructor({ gamePresenter, world, window }) {
    super({
      world: world,
      window: window,
      view: new GameView(window),
      renderWorld: function (coordinator, world) {
        const view = coordinator._view;

        view.sceneHead = coordinator.gamePresenter.sceneTitle(world);
        coordinator._view.sceneBody = coordinator.gamePresenter.sceneDescription(world);
        coordinator._view.choices = coordinator.gamePresenter.choices(world).map((choice) => {
          const choiceText = coordinator.gamePresenter.renderProperty(choice, 'tag', world);
          return [choiceText, choice];
        });
        coordinator._view.messages = [coordinator.gamePresenter.lastActionMessage(world)];
        coordinator._view.lastAction = coordinator.gamePresenter.lastActionDesc(world);
        coordinator._view.inventory = coordinator.gamePresenter.inventory(world);
        coordinator._view.render(coordinator);
      }
    });
    this._gamePresenter = gamePresenter;
  }

  get gamePresenter() { return this._gamePresenter; }
}
