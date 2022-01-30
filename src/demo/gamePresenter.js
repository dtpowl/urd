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

  renderConceptProperty(conceptName, property, world) {
    let concept = this._conceptTable.get(conceptName);
    return concept.render(property, world.queryFn(), this._conceptTable);
  }

  renderActionProperty(action, property, world) {
    return action.render(property, world.queryFn(), this._conceptTable);
  }

  sceneTitle(world) {
    let sceneAtom = world.firstWhich('locatedIn', 'person:player');
    return this.renderConceptProperty(sceneAtom, 'title', world);
  }

  sceneDescription(world) {
    let sceneAtom = world.firstWhich('locatedIn', 'person:player');
    let sceneDesc = this.renderConceptProperty(sceneAtom, 'description', world);

    let takeable = world.which('canTake', 'person:player');
    let objectNames = takeable.arrayMap((x) => {
      return indefArt(this.renderConceptProperty(x, 'title', world));
    });
    if (objectNames.length > 0) {
      let objectSentence = assertionFromSubjects(objectNames, 'here');
      sceneDesc += "<br><br>" + objectSentence;
    }
    return sceneDesc;
  }

  moveChoices(world) {
    let destinationAtoms = world.which('canGoTo', 'person:player');
    return destinationAtoms.arrayMap((destinationAtom) => {
      return new MoveAction('person:player', destinationAtom);
    });
  }

  takeChoices(world) {
    let takeable = world.which('canTake', 'person:player');
    return takeable.arrayMap((takeableAtom) => {
      return new TakeAction('person:player', takeableAtom);
    });
  }

  dropChoices(world) {
    let heldObjects = world.which('possesses', 'person:player');
    return heldObjects.arrayMap((heldAtom) => {
      return new DropAction('person:player', heldAtom);
    });
  }

  eraseChoices(world) {
    let writeableThings = world.which('canWriteOn', 'person:player');
    return writeableThings.arrayMap((thing) => {
      let firstWord = world.firstWhich('hasWrittenOnFirst', thing);
      let secondWord = world.firstWhich('hasWrittenOnSecond', thing);

      if (firstWord && secondWord) {
        return new EraseAction(thing, firstWord, secondWord);
      } else {
        return null;
      }
    }).filter((x) => x);
  }

  writeChoices(world) {
    let writeableThings = world.which('canWriteOn', 'person:player');
    let currentFirstWord = world.firstWhich('hasWrittenOnFirst', 'object:pg');
    let currentSecondWord = world.firstWhich('hasWrittenOnSecond', 'object:pg');
    let knownWords = world.which('knowsWord', 'person:player');

    if (currentSecondWord) { return []; }
    if (currentFirstWord) {
      return writeableThings.arrayMap((thing) => {
        return knownWords.filter((word) => {
          return !word.identical(currentFirstWord);
        }).arrayMap((word) => {
          return new WriteNounAction(word, thing);
        });
      }).flat();
    }

    return writeableThings.arrayMap((thing) => {
      return knownWords.arrayMap((word) => {
        return new WriteAdjectiveAction(word, thing);
      });
    }).flat();
  }

  choices(world) {
    return this.moveChoices(world).
      concat(this.takeChoices(world)).
      concat(this.dropChoices(world)).
      concat(this.eraseChoices(world)).
      concat(this.writeChoices(world));
  }
}
