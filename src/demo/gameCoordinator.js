import { domCoordinator } from '../domCoordinator.js'

export class GameCoordinator extends domCoordinator {
  constructor({ gamePresenter, world, window }) {
    super({
      world: world,
      window: window,
      renderWorld: function (coordinator, world, window) {
        const $ = window.$;

        const title = coordinator.gamePresenter.sceneTitle(world);
        const description = coordinator.gamePresenter.sceneDescription(world);
        const choices = coordinator.gamePresenter.choices(world);

        $('#scene-head').html(title);
        $('#scene-body').html(description);
        $("#action-list").empty();

        choices.forEach((choice) => {
          const choiceText = coordinator.gamePresenter.renderActionProperty(choice, 'tag', world);
          const choiceEl = $(`<li><a href="#">${choiceText}</a></li>`);
          choiceEl.click((e) => {
            coordinator.input(choice);
            e.preventDefault();
          });
          $("#action-list").append(choiceEl);
        });
      },
    });
    this._gamePresenter = gamePresenter;
  }

  get gamePresenter() { return this._gamePresenter; }
}
