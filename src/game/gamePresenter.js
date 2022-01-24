import { TakeAction, DropAction, MoveAction, EraseAction } from './game.js'

function assertionFromSubjects(subjects, predicate, plural=false) {
  var verb;
  if (subjects.length < 2 && !plural) {
    verb = 'is';
  } else {
    verb = 'are';
  }
  var conjunction;
  if (subjects.length > 2) {
    conjunction = ', and';
  } else if (subjects.length == 2) {
    conjunction = 'and';
  } else {
    conjunction = null;
  }
  if (subjects.length == 0) {
    subjects = ['Nothing'];
  }
  let firstSubjects = subjects.slice(0, -1);
  let lastSubject = subjects.slice(-1);
  var subjectPhraseBeginning;
  if (firstSubjects) {
    subjectPhraseBeginning = firstSubjects.join(', ');
  } else {
    subjectPhraseBeginning = null;
  }
  let unformatted = [subjectPhraseBeginning, conjunction, lastSubject, verb, predicate].
      filter((x) => Boolean(x)).
      join(' ');
  let formatted = unformatted.charAt(0).toLocaleUpperCase() + unformatted.slice(1) + '.';

  return formatted;
}

export class GamePresenter {
  constructor(conceptTable) {
    this._cache = {};
    this._worldVersion = null;
    this._conceptTable = conceptTable;
  }


  renderConceptProperty(conceptName, property, world) {
    let concept = this._conceptTable.get(conceptName);
    let prop = concept[property];
    if (typeof prop === 'string') {
      return prop;
    } else {
      return prop(world);
    }
  }

  sceneTitle(world) {
    let sceneAtom = world.which('locatedIn', 'person:player')[0][0];
    return this._conceptTable.get(sceneAtom).title;
  }

  sceneDescription(world) {
    let sceneAtom = world.which('locatedIn', 'person:player')[0][0];
    let sceneDesc = this.renderConceptProperty(sceneAtom, 'description', world);

    let takeable = world.which('canTake', 'person:player').
        map((x) => x[0]).
        sort((x) => x).
        filter((x) => {
          return this._conceptTable.get(x).automention;
        });
    let objectNames = takeable.map((x) => {
      return this.renderConceptProperty(x, 'shortDescription', world);
    });
    if (objectNames.length > 0) {
      let objectSentence = assertionFromSubjects(objectNames, 'here');
      sceneDesc += "<br><br>" + objectSentence;
    }

    return sceneDesc;
  }

  moveChoices(world) {
    let destinationAtoms = world.flatWhich('canGoTo', 'person:player');
    return destinationAtoms.map((destinationAtom) => {
      let destinationShort = this.renderConceptProperty(destinationAtom, 'shortDescription', world);
      return [
        `Go to ${destinationShort}`,
        new MoveAction('person:player', destinationAtom)
      ];
    });
  }

  takeChoices(world) {
    let takeable = world.flatWhich('canTake', 'person:player');
    return takeable.map((takeableAtom) => {
      let takeableTitle = this.renderConceptProperty(takeableAtom, 'title', world);
      return [
        `Take ${takeableTitle}`,
        new TakeAction('person:player', takeableAtom)
      ];
    });
  }

  dropChoices(world) {
    let heldObjects = world.flatWhich('possesses', 'person:player');
    return heldObjects.
      map((heldAtom) => {
        let heldTitle = this.renderConceptProperty(heldAtom, 'title', world);
        return [
          `Drop ${heldTitle}`,
          new DropAction('person:player', heldAtom)
        ];
      });
  }

  writeChoices(world) {
    let knownWords = world.flatWhich('knowsWord', 'person:player');
    let writeableThings = world.flatWhich('canWriteOn', 'person:player');

    return writeableThings.map((thing) => {
      let action;
      let thingTitle = this.renderConceptProperty(thing, 'title', world);
      action = new SpeakAdjectiveAction('person:player', thing);

      return [`Write on ${thingTitle}`, action];
    });
  }

  eraseChoices(world) {
    let writeableThings = world.flatWhich('canWriteOn', 'person:player');
    return writeableThings.map((thing) => {
      let thingTitle = this.renderConceptProperty(thing, 'title', world);
      let firstWord = world.firstWhich('hasWrittenOnFirst', 'object:pg')[0];
      let secondWord = world.firstWhich('hasWrittenOnSecond', 'object:pg')[0];

      let action = new EraseAction(thing, firstWord, secondWord);

      return [`Erase the writing on ${thingTitle}`, action];
    });

  }

  choices(world) {
    return this.moveChoices(world).
      concat(this.takeChoices(world)).
      concat(this.dropChoices(world)).
      concat(this.eraseChoices(world))
  }

  _cached(world, key, cb) {
    if (world.uid != this.worldVersion) {
      this._worldVersion = world.uid;
      this._cache = {};
    }
    if (typeof this._cache[key] !== 'undefined') {
      return this._cache[key];
    } else {
      let val = cb(world);
      this._cache[key] = val;
      return val;
    }
  }
}
