import { World } from './world.js'
import { Unique, Symmetric, Supervenient, Converse, Mutex } from './invariant.js';
import { Observer } from './observer.js'
import { IterableArithmetic } from './iterableArithmetic.js'
import { SemanticSet } from './semanticSet.js'

import { GameCoordinator } from './game/gameCoordinator.js'
import { GamePresenter } from './game/gamePresenter.js'

import { Concept } from './game/game.js'

let conceptTable = new Map();
([
  new Concept(
    'person:player',
    'You',
    'you',
    "It's you.",
    { noAutomention: true }
  ),
  new Concept(
    'scene:atelier',
    'The Atelier',
    'the atelier',
    'You are in your studio. In the center of the room rests your trusty poesiograph. To the north, a pair of French doors open onto a balcony.'
  ),
  new Concept(
    'scene:balcony',
    'On the Balcony',
    'the balcony',
    'You stand on a balcony overlooking the city.'
  ),
  new Concept(
    'object:p-graph',
    'your poesiograph',
    'a poesiograph',
    'An elaborate device surmounted by a writing slate.',
    { noAutomention: true }
  ),
  new Concept(
    'object:crane',
    'the paper crane',
    'a paper crane',
    'A folded paper crane.'
  ),
  new Concept(
    'object:key',
    'the brass key',
    'a brass key',
    'A weighty key, made of brass.'
  ),

  new Concept(
    'word:ka',
    'the word ka'
  ),
  new Concept(
    'adjective:paper'
  ),
  new Concept(
    'noun:key'
  ),

  new Concept(
    'word:lo',
    'the word lo'
  ),
  new Concept(
    'adjective:glass'
  ),
  new Concept(
    'noun:money'
  ),

  new Concept(
    'word:beh',
    'the word beh'
  ),
  new Concept(
    'adjective:burning'
  ),
  new Concept(
    'noun:bird'
  ),

]).forEach((s) => {
  conceptTable.set(s.name, s);
});


let atoms = Array.from(conceptTable.keys());
let relations = [
  ['locatedIn', 2],
  ['locusOf', 2],

  ['canCarry', 2],
  ['possesses', 2],
  ['adjacentTo', 2],

  ['knowsWord', 2],

  ['hasAdjectiveMeaning', 2],
  ['isAdjectiveMeaningOf', 2],

  ['hasNounMeaning', 2],
  ['isNounMeaningOf', 2],

  ['hasSpokenAsAdjective', 2],
  ['hasSpokenAsNoun', 2],

  ['madeOfPaper', 1],
  ['madeOfGlass', 1],
  ['isBurning', 1],
];
let invariants = [
  [['locatedIn'], Unique],
  [['locusOf', 'locatedIn'], Converse],
  [['adjacentTo'], Symmetric],
  [['locatedIn', 'possesses'], Supervenient],

  [['hasAdjectiveMeaning', 'isAdjectiveMeaningOf'], Converse],
  [['hasNounMeaning', 'isNounMeaningOf'], Converse],

  [['hasSpokenAsAdjective'], Unique],
  [['hasSpokenAsNoun'], Unique],
];
let derivedRelations = [
  [
    'canSee', 2, (subject) => {
      return { which: [ 'locusOf', { firstWhich: ['locatedIn', subject] } ] }
    }
  ],
  [
    'canTake', 2, (taker) => {
      return {
        and: [
          { which: ['canSee', taker] },
          { which: [ 'canCarry', taker ] },
          { not: { which: [ 'possesses', taker ] } }
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
    'hasSpoken', 2, (subject) => {
      return {
        or: [
          { which: [ 'hasSpokenAsAdjective', subject ] },
          { which: [ 'hasSpokenAsNoun', subject ] }
        ]
      }
    }
  ],
  [
    'hasExpressed', 2, (subject) => {
      return {
        or: [
          { which: [ 'hasAdjectiveMeaning', { firstWhich: [ 'hasSpokenAsAdjective', subject ] } ] },
          { which: [ 'hasNounMeaning', { firstWhich: [ 'hasSpokenAsNoun', subject ] } ] },
        ]
      }
    }
  ],
  [
    'hasCompletedAnExpression', 1, (subject) => {
      return {
        and: [
          { subjects: 'hasSpokenAsAdjective' },
          { subjects: 'hasSpokenAsNoun' }
        ]
      }
    }
  ]
];

let world = new World({
  atoms: atoms,
  relations: relations,
  derivedRelations: derivedRelations,
  invariants: invariants,
  observers: [],
  transitors: []
}).event({
  relate: [
    ['locatedIn', 'person:player', 'scene:atelier'],
    ['locatedIn', 'object:p-graph', 'scene:atelier'],
    ['locatedIn', 'object:crane', 'scene:atelier'],
    ['locatedIn', 'object:key', 'scene:balcony'],

    ['canCarry', 'person:player', 'object:crane'],
    ['canCarry', 'person:player', 'object:key'],

    ['madeOfPaper', 'object:crane'],

    ['adjacentTo', 'scene:atelier', 'scene:balcony'],

    ['hasAdjectiveMeaning', 'word:ka', 'adjective:paper'],
    ['hasAdjectiveMeaning', 'word:lo', 'adjective:glass'],
    ['hasAdjectiveMeaning', 'word:beh', 'adjective:burning'],

    ['hasNounMeaning', 'word:ka', 'noun:key'],
    ['hasNounMeaning', 'word:lo', 'noun:money'],
    ['hasNounMeaning', 'word:beh', 'noun:bird'],

    ['hasSpokenAsAdjective', 'person:player', 'word:ka'],
    ['hasSpokenAsNoun', 'person:player', 'word:lo']
  ]
});

console.log("world", world);
world.event({
  relate: [
    ['hasSpokenAsAdjective', 'person:player', 'word:lo'],
    ['hasSpokenAsNoun', 'person:player', 'word:ka']
  ]
})

function init(window) {
  new GameCoordinator({
    window: window,
    world: world,
    gamePresenter: new GamePresenter(conceptTable)
  }).init();
}


export { init };
