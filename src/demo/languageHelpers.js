export function assertionFromSubjects(subjects, predicate, plural=false) {
  var verb;
  if (subjects.length < 2 && !plural) {
    verb = 'is';
  } else {
    verb = 'are';
  }
  var conjunction;
  if (subjects.length > 2) {
    conjunction = ', and';
  } else if (subjects.length == 2) {
    conjunction = 'and';
  } else {
    conjunction = null;
  }
  if (subjects.length == 0) {
    subjects = ['Nothing'];
  }
  let firstSubjects = subjects.slice(0, -1);
  let lastSubject = subjects.slice(-1);
  var subjectPhraseBeginning;
  if (firstSubjects) {
    subjectPhraseBeginning = firstSubjects.join(', ');
  } else {
    subjectPhraseBeginning = null;
  }
  let unformatted = [subjectPhraseBeginning, conjunction, lastSubject, verb, predicate].
      filter((x) => Boolean(x)).
      join(' ');
  let formatted = unformatted.charAt(0).toLocaleUpperCase() + unformatted.slice(1) + '.';

  return formatted;
}

export function indefArt(str) {
  let firstLetter = str[0].toLowerCase();
  if (firstLetter == 'a' || firstLetter == 'e' || firstLetter == 'i' ||
      firstLetter == 'o' || firstLetter == 'u') {
    return `an ${str}`;
  } else {
    return `a ${str}`;
  }
}
