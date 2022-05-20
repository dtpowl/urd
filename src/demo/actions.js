import { AtomList } from '../atomList.js';
import { Model } from '../model.js';
import { Relation } from '../relation.js';
import { Unique, Symmetric } from '../invariant.js';
import { World } from '../world.js'
import { Action } from '../action.js'
import { Coordinator } from '../coordinator.js'

import { template } from '../presentable.js'
import { ActionGenerator } from '../actionGenerator.js'
import { indefArt } from './languageHelpers.js'


export class GameStartAction extends Action {
  constructor(tag, message) {
    super(
      {},
      {
        tag: '',
        message: "You have returned home after a long journey. Standing on your balcony overlooking the city, you find that you crave chips and salsa. You're pretty sure there's a jar of salsa in that locked chest, but you can't remember where you left the key."
      }
    )
  }
}

export class MoveAction extends Action {
  constructor(subject, destination) {
    super({
      relate: [
        ['locatedIn', new AtomList(subject, destination)],
      ]
    },
    {
      destinationName: (query, conceptTable) => {
        return conceptTable.
          get(destination).
          render('shortDescription', query, conceptTable);
      },
      message: template`You go to ${'destinationName'}.`,
      tag: template`Go to ${'destinationName'}`
    });
  }
}
export class MoveActionGenerator extends ActionGenerator {
  generateActions(world) {
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
      containerPhrase: (query, conceptTable) => {
        const container = query({firstWhich: ['containedIn', object]});
        if (!container) {
          return '';
        } else {
          return `from the ${conceptTable.get(container).render('title', query, conceptTable)}`;
        }
      },
      message: 'Taken.',
      tag: template`Take the ${'objectName'} ${'containerPhrase'}`
    });
  }
}
export class TakeActionGenerator extends ActionGenerator {
  generateActions(world) {
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
      message: 'Dropped.',
      tag: template`Drop the ${'objectName'}`
    });
  }
}
export class DropActionGenerator extends ActionGenerator {
  generateActions(world) {
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
      tag: template`Erase the writing on the ${'subjectName'}`,
      beforeMessage: (query, conceptTable) => {
        const mutObj = conceptTable.get('object:mut-1');

        if (query({check: ['canSee', ['person:player', 'object:mut-1']]})) {
          return `<i>Zorp!</i> In a flash of blue light, the ${mutObj.render('title', query, conceptTable)} vanishes!`;

        } else if (query({check: ['canHear', ['person:player', 'object:mut-1']]})) {
          const location = conceptTable.get(query({ firstWhich: ['locatedIn', 'object:mut-1'] }));
          return `You hear a muffled <i>zorp!</i> from the direction of ${location.render('shortDescription', query, conceptTable)}.`;

        } else {
          return null;
        }
      },
      message: 'You wipe the slate clean.'
    });
  }
}
export class EraseActionGenerator extends ActionGenerator {
  generateActions(world) {
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
      message: template`You carefully inscribe the word ${'wordName'} on the slate.`,
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
      message: template`You carefully inscribe the word ${'wordName'} on the slate.`,
      tag: template`Write ${'wordName'} on the ${'objectName'}, after ${'adjectiveName'}`,
      message: (query, conceptTable) => {
        const mutObj = conceptTable.get('object:mut-1');
        return `There is a flash of green light! On the poesiograph's receiving tray, ${indefArt(mutObj.render('title', query, conceptTable))} has appeared.`
      },

    });
  }
}
export class WriteActionGenerator extends ActionGenerator {
  generateActions(world) {
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
      message: template`You unlock the ${'unlockableName'} with the ${'keyName'}.`,
      failMessage: template`The ${'keyName'} doesn't fit the lock.`
    },
    opts);
  }
}
export class UnlockActionGenerator extends ActionGenerator {
  generateActions(world) {
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

        return new UnlockAction(unlockable, key, {willFail: willFail});
      })
    }).flat();
  }
}

export class OpenAction extends Action {
  constructor(object, lid, opts) {
    const relates = [ ['hasBeenOpenedAtLeastOnce', new AtomList(object)] ];
    if (lid) {
      relates.push(['possesses', ['person:player', lid]]);
    }
    super({
      relate: relates,
      unrelate: [ ['isClosed', new AtomList(object)] ]
    },
    {
      objectName: (query, conceptTable) => {
        return conceptTable.
          get(object).
          render('title', query, conceptTable);
      },
      handsFullObject: (query, conceptTable) => {
        const handsFullObject = query({firstWhich: ['handsAreFullWith', 'person:player']});
        if (handsFullObject) {
          return conceptTable.
            get(handsFullObject).
            render('title', query, conceptTable);
        } else {
          return '';
        }
      },
      message: template`You open the ${'objectName'}`,
      tag: template`Open the ${'objectName'}`,
      failMessage: template`You can't open the ${'objectName'} while your hands are full with the open ${'handsFullObject'}! That would be a mess.`
    },
    opts);
  }
}
export class OpenActionGenerator extends ActionGenerator {
  generateActions(world) {
    const openableThings = world.which('canOpen', 'person:player');
    return openableThings.arrayMap((openable) => {
      const handsFullObject = world.firstWhich('handsAreFullWith', 'person:player');
      const lid = world.firstWhich('hasLid', openable);
      return new OpenAction(openable, lid, {willFail: handsFullObject});
    });
  }
}

export class CloseAction extends Action {
  constructor(object, lid, opts) {
    const relates = [ ['isClosed', new AtomList(object)] ]
    const unrelates = [];
    if (lid) {
      unrelates.push(['possesses', ['person:player', lid]]);
      relates.push(['locatedIn', ['lid', 'void']]);
    }
    super({
      relate: relates,
      unrelate: unrelates
    },
    {
      objectName: (query, conceptTable) => {
        return conceptTable.
          get(object).
          render('title', query, conceptTable);
      },
      message: template`You close the ${'objectName'}`,
      tag: template`Close the ${'objectName'}`,
      failMessage: template`You can't close the ${'objectName'} without the lid!`
    },
    opts);
  }
}
export class CloseActionGenerator extends ActionGenerator {
  generateActions(world) {
    const closeableThings = world.which('canClose', 'person:player');
    return closeableThings.arrayMap((closeable) => {
      const lid = world.firstWhich('hasLid', closeable);
      const lidIsMissing = lid && !world.check('possesses', ['person:player', lid]);
      return new CloseAction(closeable, lid, {willFail: lidIsMissing});
    });
  }
}

export class ExamineAction extends Action {
  constructor(object) {
    super({
      relate: []
    },
    {
      objectName: (query, conceptTable) => {
        return conceptTable.
          get(object).
          render('title', query, conceptTable);
      },
      message: (query, conceptTable) => {
        return conceptTable.
          get(object).
          render('examineMessage', query, conceptTable);
      },
      tag: template`Examine the ${'objectName'}`
    });
  }
}
export class ExamineActionGenerator extends ActionGenerator {
  generateActions(world) {
    const examinableThings = world.which('canExamine', 'person:player');
    return examinableThings.arrayMap((examinable) => {
      return new ExamineAction(examinable);
    });
  }
}

export class PayDollarAction extends Action {
  constructor() {
    super({
      unrelate: [
        ['possesses', new AtomList('person:player', 'object:mut-1')],
      ],
      relate: [
        ['contains', new AtomList('object:cash-box', 'object:mut-1')],
      ],
    },
    {
      message: 'The vending machine accepts your money with a whir.',
      tag: 'Put a dollar in the vending machine'
    });
  }
  succeed(world) {
    const concept = world.getConcept('object:vending-machine')
    const oldAmount = concept.getState(world, 'amount');
    concept.setState(world, 'amount', oldAmount + 1);
    super.succeed(world);
  }
}
export class PayDollarActionGenerator extends ActionGenerator {
  generateActions(world) {
    if (world.check('canPay', ['person:player', 'object:vending-machine'])) {
      return new PayDollarAction();
    } else {
      return [];
    }
  }
}


export class BuyChipsAction extends Action {
  constructor() {
    super({
      unrelate: [
        ['isClosed', new AtomList('object:vending-machine')]
      ]
    },
    {
      message: 'The vending machine drops a bag of tortilla chips.',
      tag: 'Buy some chips from the vending machine'
    });
  }
  succeed(world) {
    const concept = world.getConcept('object:vending-machine')
    const oldAmount = concept.getState(world, 'amount');
    concept.setState(world, 'amount', oldAmount - 3);
    super.succeed(world);
  }
}
export class BuyChipsActionGenerator extends ActionGenerator {
  generateActions(world) {
    if (world.check('canGetChipsFrom', ['person:player', 'object:vending-machine'])) {
      return new BuyChipsAction();
    } else {
      return [];
    }
  }
}
