import { Injector } from "@angular/core"
import { HostRef } from "./host-ref"

export function connectFactory(initializers: any[], injector: Injector, hostRef: HostRef) {
    return function connect(context: any) {
        hostRef.setContext(context)
        initializers.forEach(init => injector.get(init))
    }
}
