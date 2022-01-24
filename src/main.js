import { World } from './world.js'
import {
  Unique, Symmetric, Supervenient,
  Converse, Mutex
} from './invariant.js';
import { Observer } from './observer.js'
import { IterableArithmetic } from './iterableArithmetic.js'
import { SemanticSet } from './semanticSet.js'

import { GameCoordinator } from './game/gameCoordinator.js'
import { GamePresenter } from './game/gamePresenter.js'

import { Concept } from './game/game.js'

let conceptTable = new Map();
([
  new Concept({
    name: 'person:player',
    title: 'you',
    noAutomention: true
  }),
  new Concept({
    name: 'scene:atelier',
    title: 'The Atelier',
    shortDescription: 'the atelier',
    description: 'You are in your studio. In the center of the room rests your trusty poesiograph. To the north, a pair of French doors open onto a balcony.'
  }),
  new Concept({
    name: 'scene:balcony',
    title: 'On the Balcony',
    shortDescription: 'the balcony',
    description: 'You stand on a balcony overlooking the city.'
  }),
  new Concept({
    name: 'object:pg',
    title: 'your poesiograph',
    shortDescription: 'a poesiograph',
    description: 'An elaborate device surmounted by a writing slate.',
    noAutomention: true
  }),

  new Concept({
    name: 'object:mut-1',
    title: (model) => {
      let adjective = model.firstWhich('hasAdjectiveProperty', 'object:mut-1')[0];
      let noun = model.firstWhich('hasNounProperty', 'object:mut-1')[0];

      return `a ${adjective.split(':')[1]} ${noun.split(':')[1]}`
    },
  }),

  new Concept({
    name: 'word:ka',
    title: 'the word ka'
  }),
  new Concept({
    name: 'adjective:paper'
  }),
  new Concept({
    name: 'noun:key'
  }),

  new Concept({
    name: 'word:lo',
    title: 'the word lo'
  }),
  new Concept({
    name: 'adjective:glass'
  }),
  new Concept({
    name: 'noun:coin'
  }),

  new Concept({
    name: 'word:beh',
    title: 'the word beh'
  }),
  new Concept({
    name: 'adjective:burning'
  }),
  new Concept({
    name: 'noun:bird'
  }),

]).forEach((s) => {
  conceptTable.set(s.name, s);
});


let atoms = Array.from(conceptTable.keys());
let relations = [
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
];
let derivedRelations = [
  [
    'isNear', 2, (subject) => {
      return { which: [ 'locusOf', { firstWhich: ['locatedIn', subject] } ] }
    }
  ],
  [
    'canTake', 2, (taker) => {
      return {
        and: [
          { which: ['isNear', taker] },
          { which: [ 'canCarry', taker ] },
          { not: { which: [ 'possesses', taker ] } }
        ]
      }
    }
  ],
  [
    'canWriteOn', 2, (writer) => {
      return {
        and: [
          { which: ['isNear', 'person:player'] },
          { subjects: 'isPgraph' }
        ]
      }
    }
  ],
  [
    'canGoTo', 2, (goer) => {
      return { which: [ 'adjacentTo', { firstWhich: ['locatedIn', goer] } ] }
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

let pgraphObserver = new Observer({
  query: {
    which: [ 'hasWrittenOn', 'object:pg' ]
  },
  effect: (newValue, oldValue, model) => {
    let adjectiveWord = model.firstWhich('hasWrittenOnFirst', 'object:pg');
    let adjective;
    if (adjectiveWord) {
      adjective = model.firstWhich('hasAdjectiveMeaning', adjectiveWord[0])[0];
    }

    let nounWord = model.firstWhich('hasWrittenOnSecond', 'object:pg');
    let noun;
    if (nounWord) {
      noun = model.firstWhich('hasNounMeaning', nounWord[0])[0];
    }

    let pgLocation = model.firstWhich('locatedIn', 'object:pg')[0];
    let objectAtom = 'object:mut-1';

    let events;
    if (adjective && noun) {
      events = [
        {
          relate: [
            ['hasAdjectiveProperty', objectAtom, adjective],
            ['hasNounProperty', objectAtom, noun],
            ['locatedIn', objectAtom, pgLocation]
          ]
        }
      ]
    } else {
      let possessedBy = model.firstWhich('possessedBy', objectAtom);
      let locatedIn = model.firstWhich('locatedIn', objectAtom);
      let unrelates = [];
      debugger
      if (possessedBy) {
        unrelates.push(['possessedBy', objectAtom, possessedBy[0]]);
      }
      if (locatedIn) {
        unrelates.push(['locatedIn', objectAtom, locatedIn[0]]);
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
  observers: [pgraphObserver],
  transitors: [],
  init: {
    relate: [
      ['locatedIn', 'person:player', 'scene:atelier'],
      ['locatedIn', 'object:pg', 'scene:atelier'],

      ['canCarry', 'person:player', 'object:mut-1'],

      ['isPgraph', 'object:pg'],

      ['adjacentTo', 'scene:atelier', 'scene:balcony'],

      ['hasAdjectiveMeaning', 'word:ka', 'adjective:paper'],
      ['hasAdjectiveMeaning', 'word:lo', 'adjective:glass'],
      ['hasAdjectiveMeaning', 'word:beh', 'adjective:burning'],

      ['hasNounMeaning', 'word:ka', 'noun:key'],
      ['hasNounMeaning', 'word:lo', 'noun:money'],
      ['hasNounMeaning', 'word:beh', 'noun:bird'],

      ['knowsWord', 'person:player', 'word:ka'],
      ['knowsWord', 'person:player', 'word:lo'],
    ]
  }
});
world = world.event({
  relate: [
    ['isWrittenFirstOn', 'word:beh', 'object:pg'],
    ['isWrittenSecondOn', 'word:ka', 'object:pg']
  ]
});
console.log("w", world);

function init(window) {
  new GameCoordinator({
    window: window,
    world: world,
    gamePresenter: new GamePresenter(conceptTable)
  }).init();
}


export { init };
