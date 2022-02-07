import { domCoordinator } from '../domCoordinator.js'
import { GameView } from './gameView.js'

export class GameCoordinator extends domCoordinator {
  constructor({ gamePresenter, world, window }) {
    super({
      world: world,
      window: window,
      view: new GameView(window),
      renderWorld: function (coordinator, world) {
        const $ = window.$;

        const title = coordinator.gamePresenter.sceneTitle(world);
        const description = coordinator.gamePresenter.sceneDescription(world);

        $('#scene-head').html(title);
        $('#scene-body').html(description);
        $("#action-list").empty();

        const choices = coordinator.gamePresenter.choices(world);
        coordinator._view.choices = choices.map((choice) => {
          const choiceText = coordinator.gamePresenter.renderProperty(choice, 'tag', world);
          return [choiceText, choice];
        });

        coordinator._view.render(coordinator);
      }
    });
    this._gamePresenter = gamePresenter;
  }

  get gamePresenter() { return this._gamePresenter; }
}
