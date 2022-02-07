import { AtomList } from '../atomList.js';
import { Model } from '../model.js';
import { Relation } from '../relation.js';
import { Unique, Symmetric } from '../invariant.js';
import { World } from '../world.js'
import { Observer } from '../observer.js'
import { Action } from '../action.js'
import { Transitor } from '../transitor.js'
import { Coordinator } from '../coordinator.js'

import { template } from '../presentable.js'
import { ActionGenerator } from '../actionGenerator.js'

export class NullAction extends Action {
  constructor(tag, message) {
    super(
      {},
      {
        tag: tag,
        message: message
      }
    )
  }
}

export class MoveAction extends Action {
  constructor(subject, destination) {
    super({
      relate: [ ['locatedIn', new AtomList(subject, destination)] ]
    },
    {
      destinationName: (query, conceptTable) => {
        return conceptTable.
          get(destination).
          render('shortDescription', query, conceptTable);
      },
      tag: template`Go to ${'destinationName'}`
    });
  }
}
export class MoveActionGenerator extends ActionGenerator {
  _generateActions(world) {
    let destinationAtoms = world.which('canGoTo', 'person:player');
    return destinationAtoms.arrayMap((destinationAtom) => {
      return new MoveAction('person:player', destinationAtom);
    });
  }
}


export class TakeAction extends Action {
  constructor(subject, object) {
    super({
      relate: [ ['possesses', new AtomList(subject, object)] ]
    },
    {
      objectName: (query, conceptTable) => {
        return conceptTable.
          get(object).
          render('title', query, conceptTable);
      },
      tag: template`Take the ${'objectName'}`
    });
  }
}
export class TakeActionGenerator extends ActionGenerator {
  _generateActions(world) {
    let takeable = world.which('canTake', 'person:player');
    return takeable.arrayMap((takeableAtom) => {
      return new TakeAction('person:player', takeableAtom);
    });
  }
}


export class DropAction extends Action {
  constructor(subject, object) {
    super({
      unrelate: [ ['possesses', new AtomList(subject, object)] ]
    },
    {
      objectName: (query, conceptTable) => {
        return conceptTable.
          get(object).
          render('title', query, conceptTable);
      },
      tag: template`Drop the ${'objectName'}`
    });
  }
}
export class DropActionGenerator extends ActionGenerator {
  _generateActions(world) {
    let heldObjects = world.which('possesses', 'person:player');
    return heldObjects.arrayMap((heldAtom) => {
      return new DropAction('person:player', heldAtom);
    });
  }
}

export class EraseAction extends Action {
  constructor(subject, object1, object2) {
    super({
      unrelate: [
        ['hasWrittenOnFirst', new AtomList(subject, object1)],
        ['hasWrittenOnSecond', new AtomList(subject, object2)]
      ]
    },
    {
      subjectName: (query, conceptTable) => {
        return conceptTable.
          get(subject).
          render('title', query, conceptTable);
      },
      tag: template`Erase the writing on the ${'subjectName'}`
    });
  }
}
export class EraseActionGenerator extends ActionGenerator {
  _generateActions(world) {
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
}

export class WriteAdjectiveAction extends Action {
  constructor(word, object) {
    super({
      relate: [
        ['hasWrittenOnFirst', new AtomList(object, word)]
      ]
    },
    {
      wordName: (query, conceptTable) => {
        return conceptTable.
          get(word).
          render('title', query, conceptTable);
      },
      objectName: (query, conceptTable) => {
        return conceptTable.
          get(object).
          render('title', query, conceptTable);
      },
      tag: template`Write ${'wordName'} on the ${'objectName'}`
    });
  }
}

export class WriteNounAction extends Action {
  constructor(word, object) {
    super({
      relate: [
        ['hasWrittenOnSecond', new AtomList(object, word)]
      ]
    },
    {
      wordName: (query, conceptTable) => {
        return conceptTable.
          get(word).
          render('title', query, conceptTable);
      },
      objectName: (query, conceptTable) => {
        return conceptTable.
          get(object).
          render('title', query, conceptTable);
      },
      adjectiveName: (query, conceptTable) => {
        let currentFirstWord = query({firstWhich: ['hasWrittenOnFirst', object]});
        return conceptTable.
          get(currentFirstWord).
          render('title', query, conceptTable);
      },
      tag: template`Write ${'wordName'} on the ${'objectName'}, after ${'adjectiveName'}`
    });
  }
}

export class WriteTwoAction extends Action {
  constructor(subject, object1, object2) {
    super({
      relate: [
        ['hasWrittenOnFirst', new AtomList(subject, object1)],
        ['hasWrittenOnSecond', new AtomList(subject, object2)]
      ]
    },
    {
      subjectName: (query, conceptTable) => {
        return conceptTable.
          get(subject).
          render('title', query, conceptTable);
      },
      tag: template`Write something new on ${'subjectName'}`
    });
  }
}
export class WriteActionGenerator extends ActionGenerator {
  _generateActions(world) {
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
}

export class UnlockAction extends Action {
  constructor(unlockable, key, opts) {
    super({
      unrelate: [
        ['isLocked', new AtomList(unlockable)]
      ]
    },
    {
      unlockableName: (query, conceptTable) => {
        return conceptTable.
          get(unlockable).
          render('title', query, conceptTable);
      },
      keyName: (query, conceptTable) => {
        return conceptTable.
          get(key).
          render('title', query, conceptTable);
      },
      tag: template`Unlock the ${'unlockableName'} with the ${'keyName'}`,
      failMessage: "The key doesn't fit the lock."
    },
    opts);
  }
}
export class UnlockActionGenerator extends ActionGenerator {
  _generateActions(world) {
    const unlockableThings = world.which('canAttemptUnlock', 'person:player');
    const availableKeys = world.query({ and: [
      { which: ['possesses', 'person:player'] },
      { which: ['isNounPropertyOf', 'noun:key'] }
    ]});

    return unlockableThings.arrayMap((unlockable) => {
      return availableKeys.arrayMap((key) => {

        let willFail;
        if (world.check('canUnlock', [key, unlockable])) {
          willFail = false;
        } else {
          willFail = true;
        }
        console.log("willFail", willFail);

        return new UnlockAction(unlockable, key, {willFail: willFail});
      })
    }).flat();
  }
}
