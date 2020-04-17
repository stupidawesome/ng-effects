import { Injector } from "@angular/core"
import { HostRef } from "./interfaces"

export function connectFactory(initializers: any[], injector: Injector) {
    const deduped = new Set(initializers)
    return function connect(context: any) {
        injector.get<any>(HostRef).setContext(context)
        for (const initializer of deduped) {
            injector.get(initializer, undefined)
        }
    }
}
