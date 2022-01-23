import { TakeAction, DropAction, MoveAction } from './game.js'

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

  sceneTitle(world) {
    let sceneAtom = world.which('locatedIn', 'person:player')[0][0];
    return this._conceptTable.get(sceneAtom).title;
  }

  sceneDescription(world) {
    let sceneAtom = world.which('locatedIn', 'person:player')[0][0];
    let sceneDesc = this._conceptTable.get(sceneAtom).description;

    let takeable = world.which('canTake', 'person:player').
        map((x) => x[0]).
        sort((x) => x).
        filter((x) => {
          return this._conceptTable.get(x).automention;
        });
    let objectNames = takeable.map((x) => {
      return this._conceptTable.get(x).shortDescription;
    });
    if (objectNames.length > 0) {
      let objectSentence = assertionFromSubjects(objectNames, 'here');
      sceneDesc += "<br><br>" + objectSentence;
    }

    return sceneDesc;
  }

  choices(world) {
    let destinationAtoms = world.which('canGoTo', 'person:player').map((e) => e[0]);
    let moveChoices = destinationAtoms.map((destinationAtom) => {
      let destinationShort = this._conceptTable.get(destinationAtom).shortDescription;
      return [
        `Go to ${destinationShort}`,
        new MoveAction('person:player', destinationAtom)
      ];
    });

    let takeable = world.which('canTake', 'person:player').
        map((x) => x[0]).
        sort((x) => x);
    let takeChoices = takeable.map((takeableAtom) => {
      let takeableTitle = this._conceptTable.get(takeableAtom).title;
      return [
        `Take ${takeableTitle}`,
        new TakeAction('person:player', takeableAtom)
      ];
    });

    let heldObjects = world.which('possesses', 'person:player').map((x) => x[0]);
    let dropChoices = heldObjects.
        map((heldAtom) => {
          let heldTitle = this._conceptTable.get(heldAtom).title;
          return [
            `Drop ${heldTitle}`,
            new DropAction('person:player', heldAtom)
          ];
        });

    return moveChoices.concat(takeChoices).concat(dropChoices);
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
