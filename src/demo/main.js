import { World } from '../world.js'
import {
  Unique,
  Symmetric, Supervenient,
  Converse, Mutex, Implies
} from '../invariant.js';
import { Observer } from '../observer.js'
import { SemanticSet } from '../semanticSet.js'
import { SemanticMap } from '../semanticMap.js'

import { AtomList } from '../atomList.js'
import { Relation } from '../relation.js'

import { template } from '../presentable.js'
import { Concept } from '../concept.js'
import { ConceptTable } from '../conceptTable.js'

import { GameCoordinator } from './gameCoordinator.js'
import { GamePresenter } from './gamePresenter.js'

import {
  GameStartAction,
  MoveActionGenerator,
  TakeActionGenerator,
  DropActionGenerator,
  WriteActionGenerator,
  EraseActionGenerator,
  UnlockActionGenerator,
  OpenActionGenerator,
  CloseActionGenerator,
  ExamineActionGenerator,
  PayDollarActionGenerator,
  BuyChipsActionGenerator
} from './actions.js'

//

const mutObjectNames = {
  [SemanticSet.keyFor(new AtomList('adjective:paper', 'noun:money'))]: 'dollar bill',
  [SemanticSet.keyFor(new AtomList('adjective:paper', 'noun:bird'))]: 'origami crane',

  [SemanticSet.keyFor(new AtomList('adjective:glass', 'noun:key'))]: 'glass key',
  [SemanticSet.keyFor(new AtomList('adjective:glass', 'noun:bird'))]: 'porcelain dove',

  [SemanticSet.keyFor(new AtomList('adjective:metal', 'noun:money'))]: 'golden coin',
  [SemanticSet.keyFor(new AtomList('adjective:metal', 'noun:key'))]: 'brass key'
};

const conceptTable = new ConceptTable(
  [
    new Concept('person:player', {
      title: 'you'
    }),
    new Concept('object:jar', {
      title: 'jar of salsa',
      shortDescription: 'a jar of salsa'
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
      description: template`You are in your studio. On a table in the center of the room rests your trusty poesiograph.${'writingDescription'}`
    }),
    new Concept('scene:balcony', {
      title: 'On the Balcony',
      shortDescription: 'the balcony',
      chestStatus: (query, conceptTable) => {
        const open = query({not: { check: ['isClosed', ['object:chest']] }});
        if (open) {
          return 'open';
        }

        const locked = query({check: ['isLocked', ['object:chest']]});
        if (locked) {
          return 'closed and locked';
        } else {
          return 'closed and unlocked';
        }
      },
      salsaHint: (query, conceptTable) => {
        const showHint = query({not: {check: ['hasBeenOpenedAtLeastOnce', ['object:chest']]}});
        if (showHint) {
          return 'You think there might be salsa in it. ';
        } else {
          return '';
        }
      },
      description: template`You stand on a balcony overlooking the city. A wooden chest is here. It is fitted with shiny brass hasps and a brass lock. ${'salsaHint'}It is ${'chestStatus'}.`
    }),
    new Concept('scene:hallway', {
      title: 'In the Hallway',
      shortDescription: 'the hallway',
      whitespace: (query, conceptTable, state) => {
        const amount = state('object:vending-machine', 'amount');
        const shouldShowPriceMessage = query({
          and: [
            { check: ['contains', ['object:vending-machine', 'object:chips']] },
            { check: ['isClosed', ['object:vending-machine']] }
          ]
        });
        if (amount != 0 || shouldShowPriceMessage) {
          return '<br>';
        } else {
          return '';
        }
      },
      vendingMachineStateMessage: (query, conceptTable, state) => {
        const amount = state('object:vending-machine', 'amount');
        if (amount == 0) {
          return '';
        } else {
          return ` The vending machine's red LED display shows "$${amount}.00."`
        }
      },
      chipsPriceMessage: (query, conceptTable, state) => {
        const shouldShowMessage = query({
          and: [
            { check: ['contains', ['object:vending-machine', 'object:chips']] },
            { check: ['isClosed', ['object:vending-machine']] }
          ]
        });
        if (shouldShowMessage) {
          return "A bag of tortilla chips costs three dollars.";
        } else {
          return "";
        }
      },
      description: template`You are in the hallway of your apartment building. A vending machine stands against the wall.${'whitespace'}${'chipsPriceMessage'}${'vendingMachineStateMessage'}`
    }),
    new Concept('object:pg', {
      title: 'poesiograph',
      shortDescription: 'your poesiograph',
      description: 'An elaborate device surmounted by a writing slate.',
    }),
    new Concept('object:vending-machine', {
      title: 'vending machine',
    }, {
      amount: 0
    }),
    new Concept('object:cash-box', {
      title: 'cash box'
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
      carryMessage: (query, conceptTable) => {
        return `You pick up the ${this.title(query, conceptTable)}`;
      }
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

    new Concept('object:jar', {
      title: 'jar of salsa'
    }),

    new Concept('object:chips', {
      title: 'bag of tortilla chips'
    }),

  ]);

const relations = [
  // movement and place
  ['locatedIn', 2],
  ['locationOf', 2],
  ['adjacentTo', 2],
  ['isRoom', 1],

  // inventory
  ['canCarry', 2],
  ['possesses', 2],
  ['possessedBy', 2],
  ['contains', 2],
  ['containedIn', 2],

  // object properties
  ['isPgraph', 1],
  ['isExaminable', 1],
  ['isLocked', 1],
  ['isClosed', 1],
  ['canBeOpenedAndClosedManually', 1],
  ['unlockableByKeyType', 2],
  ['keyTypeUnlocks', 2],
  ['hasBeenOpenedAtLeastOnce', 1],

  // poesiograph mechanics
  ['knowsWord', 2],
  ['isWrittenFirstOn', 2],
  ['hasWrittenOnFirst', 2],
  ['isWrittenSecondOn', 2],
  ['hasWrittenOnSecond', 2],
  ['hasWriting', 1],

  // vending machine mechanics
  ['isPaidEnough', 1],

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
  [['possessedBy'], Unique],

  [['locationOf', 'locatedIn'], Converse],
  [['adjacentTo'], Symmetric],

  [['possesses', 'possessedBy'], Converse],
  [['locatedIn', 'possesses'], Supervenient],

  [['contains', 'containedIn'], Converse],
  [['locatedIn', 'contains'], Supervenient],

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
    'testUnary', 1, (subject) => {
      return { not: { check: ['isPgraph', [subject]] } }
    }
  ],
  [
    'canHear', 2, (subject) => {
      return {
        or: [
          {
            // located in the same room as the subject
            anyWhich: [
              'locationOf',
              { which: ['locatedIn', subject] }
            ]
          },
          {
            // contained in something located in the same room as the subject
            anyWhich: [
              'contains',
              {
                anyWhich: [
                  'locationOf',
                  { which: ['locatedIn', subject] }
                ]
              }
            ]
          },
          {
            // located in a room adjacent to the room the subject is in
            anyWhich: [
              'locationOf',
              { anyWhich: ['adjacentTo', { which: ['locatedIn', subject] }] }
            ]
          },
          {
            // contained in something located in a room adjacent to the room the subject is in
            anyWhich: [
              'contains',
              {
                anyWhich: [
                  'locationOf',
                  { anyWhich: ['adjacentTo', { which: ['locatedIn', subject] }] }
                ]
              }
            ]
          }
        ]
      }
    }
  ],
  [
    'canBeUnlockedBy', 2, (subject) => {
      return {
        and: [
          { which: ['isNounPropertyOf', 'noun:key'] },
          { anyWhich: [
            'isAdjectivePropertyOf', {
              which: ['unlockableByKeyType', subject]
            } ]
          }
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
    'canOpen', 2, (subject) => {
      return {
        and: [
          { which: [ 'isColocatedWith', subject ] },
          { subjects: 'canBeOpenedAndClosedManually' },
          { subjects: 'isClosed' },
          { not: { subjects: 'isLocked' } },
        ]
      }
    }
  ],
  [
    'canClose', 2, (subject) => {
      return {
        and: [
          { which: [ 'isColocatedWith', subject ] },
          { subjects: 'canBeOpenedAndClosedManually' },
          { not: { subjects: 'isClosed' } },
        ]
      }
    }
  ],
  [
    'canExamine', 2, (subject) => {
      return {
        and: [
          { which: [ 'isColocatedWith', subject ] },
          { subjects: 'isExaminable' },
        ]
      }
    }
  ],
  [
    'openlyContains', 2, (subject) => {
      return {
        and: [
          { not: { check: [ 'isClosed', [subject] ] } },
          { which: [ 'contains', subject ] },
        ]
      }
    }
  ],
  [
    'inaccessiblyContains', 2, (subject) => {
      return {
        and: [
          { check: [ 'isClosed', [subject] ] },
          { which: [ 'contains', subject ] },
        ]
      }
    }
  ],
  [
    'isColocatedWith', 2, (subject) => {
      return {
        which: ['locationOf', { firstWhich: [ 'locatedIn', subject ] }]
      }
    }
  ],
  [
    'canSee', 2, (subject) => {
      return {
        or: [
          { which: ['isColocatedWith', subject] },
          { anyWhich: ['openlyContains', { which: ['isColocatedWith', subject] }] }
        ]
      }
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
          { not: { anyWhich: ['contains', { subjects: 'isClosed' }] } },
          { which: ['canSee', subject] },
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
          { which: ['canSee', subject] },
          { subjects: 'isLocked' }
        ]
      }
    }
  ],
  [
    'canWriteOn', 2, (subject) => {
      return {
        and: [
          { which: ['canSee', subject] },
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
  ],
  [
    'canPay', 2, (subject) => {
      return {
        and: [
          { check: ['possessedBy', ['object:mut-1', subject]] },
          { check: ['hasAdjectiveProperty', ['object:mut-1', 'adjective:paper']] },
          { check: ['hasNounProperty', ['object:mut-1', 'noun:money']] },
          { which: ['canSee', subject] }
        ]
      }
    }
  ],
  [
    'canGetChipsFrom', 2, (subject) => {
      return {
        and: [
          { which: ['canSee', subject] },
          { subjects: 'isPaidEnough' },
          { subjects: 'isClosed' },
        ]
      }
    }
  ]
];

const observers = [
  new Observer({
    query: {
      or: [
        { propositions: 'hasWrittenOnFirst' },
        { propositions: 'hasWrittenOnSecond' },
      ]
    },
    effect: (newValue, oldValue, world) => {
      let noun = world.firstWhich(
        'hasNounMeaning', { firstWhich: [ 'hasWrittenOnSecond', 'object:pg' ] }
      );

      let adjective = world.firstWhich(
        'hasAdjectiveMeaning', { firstWhich: [ 'hasWrittenOnFirst', 'object:pg' ] }
      );

      let pgLocation = world.firstWhich('locatedIn', 'object:pg');
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
        let possessedBy = world.firstWhich('possessedBy', objectAtom);
        let locatedIn = world.firstWhich('locatedIn', objectAtom);
        let containedIn = world.firstWhich('containedIn', objectAtom);
        let unrelates = [];

        if (possessedBy) {
          unrelates.push(['possessedBy', [objectAtom, possessedBy]]);
        }
        if (locatedIn) {
          unrelates.push(['locatedIn', [objectAtom, locatedIn]]);
        }
        if (containedIn) {
          unrelates.push(['containedIn', [objectAtom, containedIn]]);
        }

        events = [{
          unrelate: unrelates
        }]
      }

      return { events: events };
    }
  }),
  new Observer({
    stateConditions: [
      ['object:vending-machine', 'amount', 3]
    ],
    modelCondition: {
      not: { check: ['isPaidEnough', ['object:vending-machine']] }
    },
    effect: (newValue, oldValue, world) => {
      const events = [
        {
          relate: [
            ['isPaidEnough', ['object:vending-machine']]
          ]
        }
      ];
      return { events: events };
    }
  })
];

const actionGenerators = [
  new MoveActionGenerator(),
  new TakeActionGenerator(),
  new EraseActionGenerator(),
  new WriteActionGenerator(),
  new UnlockActionGenerator(),
  new OpenActionGenerator(),
  new CloseActionGenerator(),
  new PayDollarActionGenerator(),
  new BuyChipsActionGenerator()
];

let world = new World({
  relations: relations,
  derivedRelations: derivedRelations,
  invariants: invariants,
  observers: observers,
  actionGenerators: actionGenerators,
  conceptTable: conceptTable,
  init: {
    relate: [
      ['isRoom', ['scene:balcony']],
      ['isRoom', ['scene:hallway']],
      ['isRoom', ['scene:studio']],

      ['locatedIn', ['person:player', 'scene:balcony']],
      ['locatedIn', ['object:pg', 'scene:studio']],

      ['locatedIn', ['object:chest', 'scene:balcony']],
      ['contains', ['object:chest', 'object:jar']],

      ['locatedIn', ['object:vending-machine', 'scene:hallway']],
      ['contains', ['object:vending-machine', 'object:chips']],
      ['isClosed', ['object:vending-machine']],

      ['locatedIn', ['object:cash-box', 'scene:hallway']],
      ['isClosed', ['object:cash-box']],

      ['canBeOpenedAndClosedManually', ['object:chest']],
      ['isClosed', ['object:chest']],
      ['isLocked', ['object:chest']],

      ['canCarry', ['person:player', 'object:mut-1']],
      ['canCarry', ['person:player', 'object:jar']],
      ['canCarry', ['person:player', 'object:chips']],

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

      ['unlockableByKeyType', ['object:chest', 'adjective:metal']],

      ['isWrittenFirstOn', ['word:lo', 'object:pg']],
      ['isWrittenSecondOn', ['word:ka', 'object:pg']]
    ]
  }
}).applyAction(
  new GameStartAction()
)

function init(window) {
  new GameCoordinator({
    window: window,
    world: world,
    gamePresenter: new GamePresenter(conceptTable)
  }).init();
}

export { init };
