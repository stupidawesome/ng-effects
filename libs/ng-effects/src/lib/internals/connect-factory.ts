import { Host, Inject, Injectable, Injector } from "@angular/core"
import { HOST_INITIALIZER, HostRef } from "../constants"
import { InternalHostRef } from "./interfaces"

@Injectable()
export class ConnectFactory {
    constructor(
        @Host() @Inject(HOST_INITIALIZER) initializers: any[],
        @Host() injector: Injector,
        @Host() @Inject(HostRef) hostRef: InternalHostRef,
    ) {
        return function connect(context: any) {
            hostRef.update(context)
            initializers.forEach(injector.get, injector)
        }
    }
}
