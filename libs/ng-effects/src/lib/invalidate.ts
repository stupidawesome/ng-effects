import { LinkedList } from "./utils"
import { Context, Flush, Lifecycle } from "./interfaces"
import { getContext } from "./ngfx"

const invalidated = new LinkedList<Context, Flush, () => void>()

const invalidators = new LinkedList<
    Context,
    Lifecycle | undefined,
    (stop: boolean) => void
>()

export function invalidate(phase?: Lifecycle) {
    const context = getContext()
    const list = invalidators.get(context, phase)
    const copy = new Set(list)
    if (list) {
        list.clear()
        for (const invalidate of copy) {
            invalidate(true)
        }
    }
}

export function getInvalidators() {
    return invalidators
}

export function getInvalidated() {
    return invalidated
}
