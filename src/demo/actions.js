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
      tag: template`Drop ${'objectName'}`
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
      tag: template`Erase the writing on ${'subjectName'}`
    });
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
      tag: template`Write ${'wordName'} on ${'objectName'}`
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
      tag: template`Write ${'wordName'} on ${'objectName'}, after ${'adjectiveName'}`
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
