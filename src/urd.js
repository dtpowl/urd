import { Model } from './model.js';
import { Relation } from './relation.js';
import { Unique, Symmetric } from './invariant.js';
import { World } from './world.js'
import { Observer } from './observer.js'

function init(window, document) {
  console.log("initializing");
  let m = new Model('m', {
    atoms: ['nyar', 'bedroom', 'kitchen', 'den', 'yard', 'daniel', 'zoe'],
    relations: [
      ['locatedIn', 2],
      ['friends', 2]
    ],
    invariants: [
      ['locatedIn', Unique],
      ['friends', Symmetric]
    ]
  });

  let kitchenObserver = new Observer('locatedIn', ['nyar', 'kitchen'], (val) => {
    if (val) { console.log("she moved to the kitchen!"); }
  });
  let denObserver = new Observer('locatedIn', ['nyar', 'den'], (val) => {
    if (val) { console.log("she moved to the den!"); }
  });
  let bedroomObserver = new Observer('locatedIn', ['nyar', 'bedroom'], (val) => {
    if (val) { console.log("she moved to the bedroom!"); }
  });
  let yardObserver = new Observer('locatedIn', ['nyar', 'yard'], (val) => {
    if (val) { console.log("she moved to the yard!"); }
  });

  let w0 = new World(m,[
    kitchenObserver, denObserver, bedroomObserver, yardObserver
  ]);
  w0 = w0.event({
    relate: [
      ['locatedIn', 'nyar', 'den'],
      ['locatedIn', 'daniel', 'den'],
      ['friends', 'daniel', 'nyar'],
      ['friends', 'nyar', 'zoe']
    ]
  });

  let w1 = w0.event({
    relate: [ ['locatedIn', 'nyar', 'kitchen'] ]
  }).event({
    relate: [
      ['locatedIn', 'nyar', 'den'],
      ['locatedIn', 'daniel', 'kitchen']
    ]
  }).event({
    relate: [ ['locatedIn', 'nyar', 'kitchen'] ]
  }).event({
    relate: [ ['locatedIn', 'nyar', 'bedroom'] ]
  }).event({
    relate: [
      ['locatedIn', 'daniel', 'yard'],
      ['locatedIn', 'nyar', 'yard']
    ]
  })

  let w2 = w1.event({
    unrelate: [ ['friends', 'zoe', 'nyar'] ]
  });

  console.log("is she friends with daniel?", w0.check('friends', 'nyar', 'daniel'));
  console.log("is she friends with zoe?", w0.check('friends', 'nyar', 'zoe'));

  console.log("is she in the den?", w0.check('locatedIn', 'nyar', 'den'));
  console.log("is she in the kitchen?", w0.check('locatedIn', 'nyar', 'kitchen'));
  console.log("is she in the bedroom?", w0.check('locatedIn', 'nyar', 'bedroom'));
  console.log("is she in the yard?", w0.check('locatedIn', 'nyar', 'yard'));

  console.log("...they move around ... ")

  console.log("is she in the den?", w1.check('locatedIn', 'nyar', 'den'));
  console.log("is she in the kitchen?", w1.check('locatedIn', 'nyar', 'kitchen'));
  console.log("is she in the bedroom?", w1.check('locatedIn', 'nyar', 'bedroom'));
  console.log("is she in the yard?", w1.check('locatedIn', 'nyar', 'yard'));

  console.log("am i in the den?", w1.check('locatedIn', 'daniel', 'den'));
  console.log("am i in the kitchen?", w1.check('locatedIn', 'daniel', 'kitchen'));
  console.log("am i in the bedroom?", w1.check('locatedIn', 'daniel', 'bedroom'));
  console.log("am i in the yard?", w1.check('locatedIn', 'daniel', 'yard'));

  console.log("...zoe doesn't want to be friends!")

  console.log("is she friends with daniel?", w2.check('friends', 'daniel', 'nyar'));
  console.log("is she friends with zoe?", w2.check('friends', 'nyar', 'zoe'));
}

export { init };
