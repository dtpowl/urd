export class Presentable {
  constructor(props) {
    this._props = props;
    for (const propName of Object.keys(this._props)) {
      this[propName] = (queryFn, conceptTable) => {
        return this.render(propName, queryFn, conceptTable);
      }
    }
  }

  get props() { return this._props; }

  render(propName, queryFn, conceptTable) {
    const prop = this._props[propName];
    if (typeof prop === 'function') {
      return prop(queryFn, conceptTable, this);
    } else {
      return prop;
    }
  }
}

// private helper function for use by `template`
function renderExpr(expr, queryFn, conceptTable, presentable) {
  if (!expr) { return ''; }

  const exprPieces = expr.split('.');

  return exprPieces.reduce((ac, el) => {
    let val = ac[el];
    if (typeof val === 'function') {
      return val(queryFn, conceptTable, presentable);
    } else {
      return val;
    }
  }, presentable.props);
}

export function template(parts, ...exprs) {
  return (queryFn, conceptTable, thisPresentable) => {
    return parts.map((part, i) => {
      return [
        part,
        renderExpr(
          exprs[i],
          queryFn,
          conceptTable,
          thisPresentable
        )
      ]
    }).flat().join('')
  }
}
