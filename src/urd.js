import { Context } from './context.js';
import { Relation } from './relation.js';
import { Unique, Symmetric } from './invariant.js';

function init(window, document) {
  console.log("initializing");
  let cx = new Context('cx');
  let locatedIn = new Relation('locatedIn', 2, cx);
  let friends = new Relation('friends', 2, cx);
  let uniqueLocation = new Unique(locatedIn);
  let symmetricFriendship = new Symmetric(friends);

  cx._invariants.add(uniqueLocation);
  cx._invariants.add(symmetricFriendship);
  cx.addAtoms('nyar', 'bedroom', 'kitchen', 'den', 'yard', 'daniel', 'zoe');

  cx.relate(locatedIn, 'nyar', 'den');
  cx.relate(friends, 'daniel', 'nyar');
  cx.relate(friends, 'nyar', 'zoe');

  console.log("is she friends with daniel?", cx.check(friends, 'nyar', 'daniel'));
  console.log("is she friends with zoe?", cx.check(friends, 'nyar', 'zoe'));

  console.log("is she in the den?", cx.check(locatedIn, 'nyar', 'den'));
  console.log("is she in the kitchen?", cx.check(locatedIn, 'nyar', 'kitchen'));
  console.log("is she in the bedroom?", cx.check(locatedIn, 'nyar', 'bedroom'));
  console.log("is she in the yard?", cx.check(locatedIn, 'nyar', 'yard'));

  cx.relate(locatedIn, 'nyar', 'kitchen');
  cx.relate(locatedIn, 'nyar', 'den');
  cx.relate(locatedIn, 'nyar', 'yard');
  cx.relate(locatedIn, 'nyar', 'yard');

  console.log("is she in the den?", cx.check(locatedIn, 'nyar', 'den'));
  console.log("is she in the kitchen?", cx.check(locatedIn, 'nyar', 'kitchen'));
  console.log("is she in the bedroom?", cx.check(locatedIn, 'nyar', 'bedroom'));
  console.log("is she in the yard?", cx.check(locatedIn, 'nyar', 'yard'));

  console.log("zoe doesn't want to be friends!")
  cx.unrelate(friends, 'zoe', 'nyar');
  console.log("is she friends with daniel?", cx.check(friends, 'daniel', 'nyar'));
  console.log("is she friends with zoe?", cx.check(friends, 'nyar', 'zoe'));


  console.log('relation', locatedIn);
}

export { init };
