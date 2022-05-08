export class GameView {
  constructor(window) {
    this._choices = null;
    this._sceneHead = null
    this._sceneBody = null;
    this._messages = [];
    this._window = window;
  }

  get $() { return this._window.$; };

  get choices() { return this._choices; }
  set choices(newChoices) { this._choices = newChoices; }

  get sceneHead() { return this._sceneHead; }
  set sceneHead(newSceneHead) { this._sceneHead = newSceneHead; }

  get sceneBody() { return this._sceneBody; }
  set sceneBody(newSceneBody) { this._sceneBody = newSceneBody; }
  get messages() { return this._messages; }
  set messages(newMessages) { this._messages = newMessages;  }

  render(coordinator) {
    this._renderScene(coordinator);
    this._renderMessages(coordinator);
    this._renderChoices(coordinator);
  }

  _renderScene(coordinator) {
    this.$('#scene-head').html(this.sceneHead);
    this.$('#scene-body').html(this.sceneBody.join('<br><br>'));
  }

  _renderMessages(coordinator) {
    this.$('#messages').html(this.messages.join('<br><br>'));
  }

  _renderChoices(coordinator) {
    this.$("#action-list").empty();

    this.choices.forEach((pair) => {
      const choiceEl = this.$(`<li><a href="#">${pair[0]}</a></li>`);
      choiceEl.click((e) => {
        coordinator.input(pair[1]);
        e.preventDefault();
      });

      this.$("#action-list").append(choiceEl);
    });
  }
}
