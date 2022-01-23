import { SemanticSet } from './semanticSet.js'

export class IterableArithmetic {
  static difference(lhs, rhs) {
    let set;
    let filterable;
    if (rhs.constructor.name == 'SemanticSet') {
      set = rhs;
    } else {
      set = new SemanticSet(rhs);
    }
    if (!lhs.filter) {
      filterable = Array.from(filterablelhs);
    } else {
      filterable = lhs;
    }

    return filterable.filter((el) => !set.has(el));
  }

  static intersect(lhs, rhs) {
    let set;
    let filterable;
    if (rhs.constructor.name == 'SemanticSet') {
      set = rhs;
      filterable = lhs;
    } else if (lhs.constructor.name == 'SemanticSet') {
      set = lhs;
      filterable = rhs;
    } else {
      set = new SemanticSet(rhs);
      filterable = lhs;
    }
    if (!filterable.filter) {
      filterable = Array.from(filterable);
    }
    return filterable.filter((el) => set.has(el));
  }

  static union(lhs, rhs) {
    var set;
    if (rhs.constructor.name == 'SemanticSet') {
      set = lhs;
    } else {
      set = new SemanticSet(lhs);
    }

    let output = Array.from(lhs);
    rhs.forEach((el) => {
      if (!set.has(el)) {
        output.push(el);
      }
    });

    return output;
  }

  static sum(lhs, rhs) {
    return Array.from(lhs).concat(Array.from(rhs));
  }
}
