export class GameView {
  constructor(window) {
    this._choices = null;
    this._gameMessages = [];
    this._window = window;
  }

  get choices() { return this._choices; }
  set choices(newChoices) { this._choices = newChoices; }

  render(coordinator) {
    this._renderMessages(coordinator);
    this._renderChoices(coordinator);
  }

  _renderMessages(coordinator) {

  }

  _renderChoices(coordinator) {
    const $ = this._window.$;

    $("#action-list").empty();

    this._choices.forEach((pair) => {
      const choiceEl = $(`<li><a href="#">${pair[0]}</a></li>`);
      choiceEl.click((e) => {
        coordinator.input(pair[1]);
        e.preventDefault();
      });

      $("#action-list").append(choiceEl);
    });
  }
}
