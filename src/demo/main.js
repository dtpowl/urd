import { World } from '../world.js'
import {
  Unique, Symmetric, Supervenient,
  Converse, Mutex
} from '../invariant.js';
import { Observer } from '../observer.js'
import { SemanticSet } from '../semanticSet.js'
import { SemanticMap } from '../semanticMap.js'

import { AtomList } from '../atomList.js'
import { Relation } from '../relation.js'

import { template } from '../presentable.js'
import { Concept } from '../concept.js'

import { GameCoordinator } from './gameCoordinator.js'
import { GamePresenter } from './gamePresenter.js'

import {
  MoveActionGenerator,
  TakeActionGenerator,
  DropActionGenerator,
  WriteActionGenerator,
  EraseActionGenerator,
  UnlockActionGenerator
} from './actions.js'

//

const conceptTable = new SemanticMap();
const mutObjectNames = {
  [SemanticSet.keyFor(new AtomList('adjective:paper', 'noun:money'))]: 'dollar bill',
  [SemanticSet.keyFor(new AtomList('adjective:paper', 'noun:bird'))]: 'origami crane',

  [SemanticSet.keyFor(new AtomList('adjective:glass', 'noun:key'))]: 'glass key',
  [SemanticSet.keyFor(new AtomList('adjective:glass', 'noun:bird'))]: 'porcelain dove',

  [SemanticSet.keyFor(new AtomList('adjective:metal', 'noun:money'))]: 'golden coin',
  [SemanticSet.keyFor(new AtomList('adjective:metal', 'noun:key'))]: 'brass key'
};
([
  new Concept('person:player', {
    title: 'you'
  }),
  new Concept('object:knife', {
    title: 'silver knife',
    shortDescription: 'a silver knife'
  }),
  new Concept('scene:studio', {
    title: 'The Studio',
    shortDescription: 'the studio',
    writingDescription: (query, conceptTable) => {
      const firstWordAtom = query({firstWhich: ['hasWrittenOnFirst', 'object:pg']});
      const secondWordAtom = query({firstWhich: ['hasWrittenOnSecond', 'object:pg']});
      if (secondWordAtom) {
        const firstWord = conceptTable.get(firstWordAtom).wordForSlateDescription();
        const secondWord = conceptTable.get(secondWordAtom).wordForSlateDescription();
        return ` On its slate is written "${firstWord} ${secondWord}."`
      } else if (firstWordAtom) {
        const firstWord = conceptTable.get(firstWordAtom).wordForSlateDescription();
        return ` On its slate is written "${firstWord}."`
      } else {
        return '';
      }
    },
    description: template`You are in your studio. In the center of the room rests your trusty poesiograph.${'writingDescription'}`
  }),
  new Concept('scene:balcony', {
    title: 'On the Balcony',
    shortDescription: 'the balcony',
    chestStatus: (query, conceptTable) => {
      const locked = query({check: ['isLocked', 'object:chest']});
      if (locked) {
        return 'locked';
      } else {
        return 'unlocked';
      }
    },
    description: template`You stand on a balcony overlooking the city. A wooden chest is here. It is fitted with shiny brass hasps and a brass lock. It is ${'chestStatus'}.`
  }),
  new Concept('scene:hallway', {
    title: 'In the Hallway',
    shortDescription: 'the hallway',
    description: template`You are in the hallway of your apartment building.`
  }),
  new Concept('object:pg', {
    title: 'poesiograph',
    shortDescription: 'your poesiograph',
    description: template`An elaborate device surmounted by a writing slate. ${'writingDescription'}`,
  }),
  new Concept('object:mut-1', {
    adjective: (query, conceptTable) => {
      const adjConcept = query({firstWhich: ['hasAdjectiveProperty', 'object:mut-1']});
      return conceptTable.get(adjConcept).title();
    },
    noun: (query, conceptTable) => {
      const nounConcept = query({firstWhich: ['hasNounProperty', 'object:mut-1']});
      return conceptTable.get(nounConcept).title();
    },
    title: (query, conceptTable) => {
      const adjConcept = query({firstWhich: ['hasAdjectiveProperty', 'object:mut-1']});
      const nounConcept = query({firstWhich: ['hasNounProperty', 'object:mut-1']});
      const key = new AtomList(adjConcept, nounConcept);
      return mutObjectNames[SemanticSet.keyFor(key)] || 'inscrutable lump of protomatter';
    },
  }),

  new Concept('word:ka', {
    title: 'the word ka',
    wordForSlateDescription: 'ka',
  }),
  new Concept('adjective:paper', {
    title: 'paper'
  }),
  new Concept('noun:key', {
    title: 'key'
  }),

  new Concept('word:lo', {
    title: 'the word lo',
    wordForSlateDescription: 'lo',
  }),
  new Concept('adjective:glass', {
    title: 'glass'
  }),
  new Concept('noun:money', {
    title: 'coin'
  }),

  new Concept('word:beh', {
    title: 'the word beh',
    wordForSlateDescription: 'beh'
  }),
  new Concept('adjective:metal', {
    title: 'metal'
  }),
  new Concept('noun:bird', {
    title: 'bird'
  }),

  new Concept('object:chest', {
    title: 'wooden chest'
  }),

]).forEach((s) => {
  conceptTable.set(new AtomList(s.atom), s);
});


const atoms = Array.from(conceptTable.mapValues((v) => v.atom));
const relations = [
  // movement and place
  ['locatedIn', 2],
  ['locusOf', 2],
  ['adjacentTo', 2],

  // inventory
  ['canCarry', 2],
  ['possesses', 2],
  ['possessedBy', 2],

  // object properties
  ['isPgraph', 1],
  ['exists', 1],
  ['isLocked', 1],

  ['unlockableByKeyType', 2],
  ['keyTypeUnlocks', 2],

  // poesiograph mechanics
  ['knowsWord', 2],
  ['isWrittenFirstOn', 2],
  ['hasWrittenOnFirst', 2],
  ['isWrittenSecondOn', 2],
  ['hasWrittenOnSecond', 2],
  ['hasWriting', 1],

  // magic word semantics
  ['hasAdjectiveMeaning', 2],
  ['isAdjectiveMeaningOf', 2],

  ['hasNounMeaning', 2],
  ['isNounMeaningOf', 2],

  ['hasNounProperty', 2],
  ['hasAdjectiveProperty', 2],

  ['isNounPropertyOf', 2],
  ['isAdjectivePropertyOf', 2]
];
let invariants = [
  [['locatedIn'], Unique],
  [['locusOf', 'locatedIn'], Converse],
  [['adjacentTo'], Symmetric],

  [['possesses', 'possessedBy'], Converse],
  [['locatedIn', 'possesses'], Supervenient],

  [['isWrittenFirstOn', 'hasWrittenOnFirst'], Converse],
  [['isWrittenSecondOn', 'hasWrittenOnSecond'], Converse],

  [['hasAdjectiveMeaning', 'isAdjectiveMeaningOf'], Converse],
  [['hasNounMeaning', 'isNounMeaningOf'], Converse],

  [['hasNounProperty'], Unique],
  [['hasAdjectiveProperty'], Unique],

  [['hasNounProperty', 'isNounPropertyOf'], Converse],
  [['hasAdjectiveProperty', 'isAdjectivePropertyOf'], Converse],

  [['keyTypeUnlocks', 'unlockableByKeyType'], Converse]
];
let derivedRelations = [
  [
    'canBeUnlockedBy', 2, (subject) => {
      return {
        and: [
          { which: ['isNounPropertyOf', 'noun:key'] },
          { anyWhich: [
            'isAdjectivePropertyOf', {
              which: ['unlockableByKeyType', subject]
            }
          ] }
        ]
      }
    }
  ],
  [
    'canUnlock', 2, (subject) => {
      return {
        and: [
          { check: ['hasNounProperty', [subject, 'noun:key']] },
          {
            anyWhich: [
              'keyTypeUnlocks',
              { which: ['hasAdjectiveProperty', subject] }
            ]
          }
        ]
      }
    }
  ],
  [
    'isNear', 2, (subject) => {
      return { which: [ 'locusOf', { firstWhich: ['locatedIn', subject] } ] }
    }
  ],
  [
    'canGoTo', 2, (subject) => {
      return { which: [ 'adjacentTo', { firstWhich: ['locatedIn', subject] } ] }
    }
  ],
  [
    'canTake', 2, (subject) => {
      return {
        and: [
          { which: ['isNear', subject] },
          { which: [ 'canCarry', subject ] },
          { not: { which: [ 'possesses', subject ] } }
        ]
      }
    }
  ],
  [
    'canAttemptUnlock', 2, (subject) => {
      return {
        and: [
          { which: ['isNear', subject] },
          { subjects: 'isLocked' }
        ]
      }
    }
  ],
  [
    'canWriteOn', 2, (subject) => {
      return {
        and: [
          { which: ['isNear', subject] },
          { subjects: 'isPgraph' }
        ]
      }
    }
  ],
  [
    'isWrittenOn', 2, (word) => {
      return {
        or: [
          { which: ['isWrittenFirstOn', word] },
          { which: ['isWrittenSecondOn', word] }
        ]
      }
    }
  ],
  [
    'hasWrittenOn', 2, (pg) => {
      return {
        or: [
          { which: ['hasWrittenOnFirst', pg] },
          { which: ['hasWrittenOnSecond', pg] }
        ]
      }
    }
  ]
];

const pgraphObserver = new Observer({
  query: {
    or: [
      { propositions: 'hasWrittenOnFirst' },
      { propositions: 'hasWrittenOnSecond' },
    ]
  },
  effect: (newValue, oldValue, model) => {
    let noun = model.firstWhich(
      'hasNounMeaning', { firstWhich: [ 'hasWrittenOnSecond', 'object:pg' ] }
    );

    let adjective = model.firstWhich(
      'hasAdjectiveMeaning', { firstWhich: [ 'hasWrittenOnFirst', 'object:pg' ] }
    );

    let pgLocation = model.firstWhich('locatedIn', 'object:pg');
    let objectAtom = 'object:mut-1';

    let events;
    if (adjective && noun) {
      events = [
        {
          relate: [
            ['hasAdjectiveProperty', [objectAtom, adjective]],
            ['hasNounProperty', [objectAtom, noun]],
            ['locatedIn', [objectAtom, pgLocation]]
          ]
        }
      ]
    } else {
      let possessedBy = model.firstWhich('possessedBy', objectAtom);
      let locatedIn = model.firstWhich('locatedIn', objectAtom);
      let unrelates = [];

      if (possessedBy) {
        unrelates.push(['possessedBy', [objectAtom, possessedBy]]);
      }
      if (locatedIn) {
        unrelates.push(['locatedIn', [objectAtom, locatedIn]]);
      }

      events = [{
        unrelate: unrelates
      }]
    }

    return { events: events };
  }
});

let world = new World({
  atoms: atoms,
  relations: relations,
  derivedRelations: derivedRelations,
  invariants: invariants,
  observers: [
    pgraphObserver
  ],
  transitors: [],
  actionGenerators: [
    new MoveActionGenerator(),
    new TakeActionGenerator(),
//    new DropActionGenerator(),
    new EraseActionGenerator(),
    new WriteActionGenerator(),
    new UnlockActionGenerator()
  ],
  init: {
    relate: [
      ['locatedIn', ['person:player', 'scene:studio']],
      ['locatedIn', ['object:pg', 'scene:studio']],
//      ['locatedIn', ['object:knife', 'scene:studio']],
      ['locatedIn', ['object:mut-1', 'scene:balcony']],

      ['locatedIn', ['object:chest', 'scene:balcony']],
      ['isLocked', ['object:chest']],

      ['canCarry', ['person:player', 'object:mut-1']],
      ['canCarry', ['person:player', 'object:knife']],

      ['isPgraph', ['object:pg']],

      ['adjacentTo', ['scene:studio', 'scene:balcony']],
      ['adjacentTo', ['scene:studio', 'scene:hallway']],

      ['hasAdjectiveMeaning', ['word:ka', 'adjective:paper']],
      ['hasAdjectiveMeaning', ['word:lo', 'adjective:glass']],
      ['hasAdjectiveMeaning', ['word:beh', 'adjective:metal']],

      ['hasNounMeaning', ['word:ka', 'noun:key']],
      ['hasNounMeaning', ['word:lo', 'noun:money']],
      ['hasNounMeaning', ['word:beh', 'noun:bird']],

      ['knowsWord', ['person:player', 'word:ka']],
      ['knowsWord', ['person:player', 'word:lo']],
      ['knowsWord', ['person:player', 'word:beh']],

      ['unlockableByKeyType', ['object:chest', 'adjective:metal']]
    ]
  }
});

world = world.next([{
  relate: [
    ['locatedIn', ['person:player', 'scene:balcony']],
    ['isWrittenFirstOn', ['word:lo', 'object:pg']],
    ['isWrittenSecondOn', ['word:ka', 'object:pg']]
  ]
}]);


const qr = world.which('canUnlock', 'object:mut-1');
console.log("qr", qr);

//console.log("wr", world.check('canUnlock', ['object:mut-1', 'object:chest']));

function init(window) {
  new GameCoordinator({
    window: window,
    world: world,
    gamePresenter: new GamePresenter(conceptTable)
  }).init();
}

export { init };
