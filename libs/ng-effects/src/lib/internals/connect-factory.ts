import { Host, Inject, Injectable, Injector } from "@angular/core"
import { HOST_INITIALIZER } from "../constants"
import { DestroyObserver } from "./destroy-observer"
import { currentContext } from "./constants"

@Injectable()
export class ConnectFactory {
    constructor(
        @Host() @Inject(HOST_INITIALIZER) initializers: any[],
        @Host() destroyObserver: DestroyObserver,
        @Host() injector: Injector,
    ) {
        return function connect(context: any) {
            currentContext.add(context)
            initializers.forEach(injector.get, injector)
            currentContext.clear()
        }
    }
}
