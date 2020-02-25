import { InjectFlags, Injector } from "@angular/core"
import { HostRef } from "../host-ref"

export function connectFactory(initializers: any[], injector: Injector) {
    return function connect(context: any) {
        injector.get<any>(HostRef).setContext(context)
        initializers.forEach(init => injector.get(init, undefined, InjectFlags.Self))
    }
}
