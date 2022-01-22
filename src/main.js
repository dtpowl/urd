import { World } from './world.js'
import { Unique, Symmetric } from './invariant.js';
import { Observer } from './observer.js'

import { GameCoordinator } from './game/gameCoordinator.js'
import { GamePresenter } from './game/gamePresenter.js'

import { Scene } from './game/game.js'

let den = new Scene(
  'scene:den',
  'The Den',
  'the den',
  'You are in your den. Nyar sleeps peacefully on the green chair.'
);
let yard = new Scene(
  'scene:yard',
  'The Yard',
  'the yard',
  "You are in your yard. Yesterday's light dusting of snow has melted away."
);
let dining = new Scene(
  'scene:dining',
  'The Dining Room',
  'the dining room',
  "You are in your dining room. The table is piled high with boxes and clearly disused."
);

let sceneTable = new Map();
([den, yard, dining]).forEach((s) => {
  sceneTable.set(s.name, s);
});


let atoms = ['player'].concat(Array.from(sceneTable.keys()));
let relations = [
  ['locatedIn', 2],
  ['adjacentTo', 2]
];
let invariants = [
  ['locatedIn', Unique],
  ['adjacentTo', Symmetric]
];
let observers = [
  new Observer('locatedIn', ['player', 'scene:yard'],
    (val) => {
      if (val) { console.log('player entered yard'); }
    }
  )
];

let world = new World({
  atoms: atoms,
  relations: relations,
  invariants: invariants,
  observers: observers,
  transitors: []
}).event({
  relate: [
    ['locatedIn', 'player', 'scene:dining'],
    ['adjacentTo', 'scene:yard', 'scene:den'],
    ['adjacentTo', 'scene:den', 'scene:dining']
  ]
});


function init(window) {
  console.log("initializing");
  new GameCoordinator({
    window: window,
    world: world,
    gamePresenter: new GamePresenter(sceneTable)
  }).init();
}

export { init };
