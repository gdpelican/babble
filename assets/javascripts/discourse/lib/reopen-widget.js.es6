import { queryRegistry } from 'discourse/widgets/widget'

export default function reopenWidget(name, opts) {
  let existing = queryRegistry(name)
  if (!existing) {
    console.error(`Could not find widget ${name} in registry`)
    return
  }

  Object.keys(opts).forEach(k => existing.prototype[k] = opts[k])
  return existing
}
