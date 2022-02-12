import { AtomList } from '../atomList.js'
import {
  TakeAction, DropAction, MoveAction, EraseAction,
  WriteNounAction, WriteAdjectiveAction
} from './actions.js'
import { assertionFromSubjects, indefArt } from './languageHelpers.js'

export class GamePresenter {
  constructor(conceptTable) {
    this._cache = {};
    this._worldVersion = null;
    this._conceptTable = conceptTable;
  }

  choices(world) {
    return world.generateActions();
  }

  getConcept(atom) {
    return this._conceptTable.get(atom);
  }

  renderProperty(presentable, prop, world) {
    return presentable.render(prop, world.queryFn(), this._conceptTable);
  }

  lastActionMessage(world) {
    const lastAction = world.lastAction;
    if (!lastAction) { return null; }

    if (lastAction.failed) {
      return lastAction.render('failMessage', world.queryFn(), this._conceptTable);
    } else {
      return lastAction.render('message', world.queryFn(), this._conceptTable);
    }
  }

  sceneTitle(world) {
    const sceneAtom = world.firstWhich('locatedIn', 'person:player');
    const sceneConcept = this.getConcept(sceneAtom);
    return this.renderProperty(sceneConcept, 'title', world);
  }

  sceneDescription(world) {
    const sceneAtom = world.firstWhich('locatedIn', 'person:player');
    const sceneConcept = this.getConcept(sceneAtom);
    let sceneDescParts = [this.renderProperty(sceneConcept, 'description', world)];

    const takeable = world.which('canTake', 'person:player');
    const objectNames = takeable.arrayMap((x) => {
      return indefArt(this.renderProperty(this.getConcept(x), 'title', world));
    });
    if (objectNames.length > 0) {
      const objectSentence = assertionFromSubjects(objectNames, 'here');
      sceneDescParts.push(objectSentence);
    }

    console.log("ww:", world);
    console.log("last action message");
    console.log(this.lastActionMessage(world));
    return sceneDescParts;
  }
}
