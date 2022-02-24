import { TntModule, TntEx } from './tntIr'

export interface NameDefinition {
  kind: string
  identifier: string
  scope?: bigint
}

export function collectDefinitions (tntModule: TntModule): NameDefinition[] {
  if (tntModule.defs) {
    return tntModule.defs.reduce((nameDefs: NameDefinition[], def) => {
      switch (def.kind) {
        case 'const':
        case 'var':
          nameDefs.push({
            kind: def.kind,
            identifier: def.name,
          })
          break
        case 'def':
          nameDefs.push({
            kind: def.kind,
            identifier: def.name,
          })
          if (def.expr) {
            nameDefs.push(...collectFromExpr(def.expr))
          }
          break
        default:
          // typedefs and assumes
      }
      return nameDefs
    }, [])
  } else {
    throw new Error('No definitions found for the module')
  }
}

function collectFromExpr (expr: TntEx): NameDefinition[] {
  switch (expr.kind) {
    case 'lambda':
      return expr.params.map(p => { return { kind: 'def', identifier: p, scope: expr.id } as NameDefinition }).concat(collectFromExpr(expr.expr))
    case 'app':
      return expr.args.flatMap(arg => { return collectFromExpr(arg) })
    case 'let':
      return [{ kind: expr.opdef.qualifier, identifier: expr.opdef.name, scope: expr.id } as NameDefinition]
          .concat(collectFromExpr(expr.opdef.expr))
          .concat(collectFromExpr(expr.expr))
    default:
      return []
  }
}
