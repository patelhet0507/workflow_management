type Listener = (event: any) => void

const g = globalThis as any
const bus = g.__eventBus || { listeners: new Map<string, Set<Listener>>() }
g.__eventBus = bus

export const eventBus = {
  on(event: string, fn: Listener) {
    if (!bus.listeners.has(event)) bus.listeners.set(event, new Set())
    bus.listeners.get(event)!.add(fn)
    return () => bus.listeners.get(event)?.delete(fn)
  },
  emit(event: string, data: any) {
    bus.listeners.get(event)?.forEach((fn: Listener) => fn(data))
  },
  _debug() { return { size: bus.listeners.size, keys: [...bus.listeners.keys()] } },
}
