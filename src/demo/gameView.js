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

  get lastAction() { return this._lastAction; }
  set lastAction(newLastAction) { this._lastAction = newLastAction;  }

  render(coordinator) {
    this._appendNewOutputBlock();
    this._renderScene(coordinator);

    this._renderMessages(coordinator);
    this._renderChoices(coordinator);
    this._renderInventory(coordinator);
    this._scrollToBottom(coordinator);
  }

  _scrollToBottom(coordinator) {
    $("#game-log-wrapper").
      animate({
        scrollTop: $('#game-log-wrapper').prop("scrollHeight")
      }, 500);
  }

  _appendNewOutputBlock(coordinator) {
    if (this.$('#scene').length > 0) {
      this.$('#scene').attr('class', 'scene logback');
      this.$('#scene').removeAttr('id');
    }
    if (this.lastAction) {
      this.$('#game-log-wrapper').append(`
        <span class="user-action">&gt; ${this.lastAction}</span>
      `)
    }
    this.$('#action-list').html('');
    this.$('#game-log-wrapper').append(`
      <div id="scene" class="scene">
        <p id="messages" class="messages"></p>
        <p id="scene-head" class="scene-head"></p>
        <p id="scene-body" class="scene-body"></p>
      </div>
    `);
  }

  _renderScene(coordinator) {
    this.$('#scene > .scene-head').html(this.sceneHead);
    this.$('#scene > .scene-body').html(this.sceneBody.join('<br><br>'));
  }

  _renderMessages(coordinator) {
    this.$('#scene > .messages').html(this.messages.join('<br><br>'));
  }

  _renderChoices(coordinator) {
    this.$("#scene > .action-list").empty();

    this.choices.forEach((pair) => {
      const choiceEl = this.$(`<li><a href="#">${pair[0]}</a></li>`);
      choiceEl.click((e) => {
        coordinator.input(pair[1]);
        e.preventDefault();
      });

      this.$("#action-list").append(choiceEl);
    });
  }

  _renderInventory(coordinator) {
    this.$("#inventory-list").empty();
    if (this.inventory.length > 0) {
      this.$('#inventory-list-caption').show();
      this.inventory.forEach((item) => {
        const el = this.$(`<li>${item}</li>`);
        this.$("#inventory-list").append(el);
      });
    } else {
      this.$('#inventory-list-caption').hide();
    }
  }
}
