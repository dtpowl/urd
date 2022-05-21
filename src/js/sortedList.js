import { binarySearch } from './algo.js'

export class SortedList {
  constructor() {
    this._array = [];
    this._size = 0;
  }

  add(element) {
    this._size += 1;
    const index = this._lastIndex(element);
    if (index === null) {
      // insert at the beginning
      this._array.unshift(element);
    } else {
      // insert after the last inde
      this._array.splice(index + 1, 0, element);
    }
  }

  max() {
    return this._array[this._size - 1];
  }

  indexOf(value) {
    const index = this._lastIndex(value);
    if (this._array[index] == value) {
      return index;
    } else {
      return -1; // match behavior of Array.indexOf
    }
  }

  largestNotExceeding(value) {
    const index = this._lastIndex(value);
    if (index) {
      return this._array[index];
    } else {
      return null;
    }
  }

  _lastIndex(value) {
    // todo: switch to Array.findLastIndex eventually
    return binarySearch(this._array, this._size, (x) => x <= value);
  }
}
