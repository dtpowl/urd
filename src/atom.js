class Atom {
  constructor(name) {
    this._name = name;
  }

  get name() { return this._name; }

  is(atom) {
    return this._name == atom.name;
  }
}



let pq = new PromotionQueue(0);
pq.push(new Item('a'));
pq.push(new Item('b'));
pq.push(new Item('c'));
pq.push(new Item('d'));
pq.push(new Item('e'));
pq.push(new Item('f'));
pq.push(new Item('g'));
