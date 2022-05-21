export function binarySearch(array, length, cb) {
  let windowLeft = 0;
  let windowRight = length;
  let midpointIndex = Math.ceil((windowRight - windowLeft) / 2);

  while (true) {
    const predicateIsTrueAtMidpoint = cb(array[midpointIndex]);

    if (predicateIsTrueAtMidpoint && windowLeft == windowRight) {
      return windowLeft;

    } else if (!predicateIsTrueAtMidpoint && windowLeft == windowRight) {
      return null;

    } else if (predicateIsTrueAtMidpoint) {
      windowLeft = midpointIndex;

    } else {
      windowRight = midpointIndex - 1;
    }

    midpointIndex = windowLeft + Math.ceil((windowRight - windowLeft) / 2);
  }
}
