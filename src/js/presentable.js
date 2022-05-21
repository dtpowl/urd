export class Presentable {
  constructor(props) {
    this._props = props;
    for (const propName of Object.keys(this._props)) {
      this[propName] = (queryFn, conceptTable, stateFn) => {
        return this.render(propName, queryFn, conceptTable, stateFn);
      }
    }
  }

  get props() { return this._props; }

  render(propName, queryFn, conceptTable, stateFn) {
    const prop = this._props[propName];
    if (typeof prop === 'function') {
      return prop(queryFn, conceptTable, stateFn, this);
    } else {
      return prop;
    }
  }
}

// private helper function for use by `template`
function renderExpr(expr, queryFn, conceptTable, stateFn, presentable) {
  if (!expr) { return ''; }

  const exprPieces = expr.split('.');

  return exprPieces.reduce((ac, el) => {
    let val = ac[el];
    if (typeof val === 'function') {
      return val(queryFn, conceptTable, stateFn, presentable);
    } else {
      return val;
    }
  }, presentable.props);
}

export function template(parts, ...exprs) {
  return (queryFn, conceptTable, stateFn, thisPresentable) => {
    return parts.map((part, i) => {
      return [
        part,
        renderExpr(
          exprs[i],
          queryFn,
          conceptTable,
          stateFn,
          thisPresentable
        )
      ]
    }).flat().join('')
  }
}
