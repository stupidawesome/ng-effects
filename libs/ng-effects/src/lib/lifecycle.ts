import { LifecycleHook } from "./interfaces"

let activeLifecycleHook: undefined | LifecycleHook

export function getLifecycleHook(): LifecycleHook | undefined {
    return activeLifecycleHook
}

export function setLifecycleHook(lifecycle?: LifecycleHook) {
    return (activeLifecycleHook = lifecycle)
}
