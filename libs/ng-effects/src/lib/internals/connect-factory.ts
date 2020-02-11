import { Host, Inject, Injectable, Injector } from "@angular/core"
import { HOST_INITIALIZER, HostRef } from "../constants"
import { DestroyObserver } from "./destroy-observer"
import { flat } from "./utils"

@Injectable()
export class ConnectFactory {
    constructor(
        @Host() @Inject(HOST_INITIALIZER) initializers: any[],
        @Host() destroyObserver: DestroyObserver,
        @Host() parentInjector: Injector,
    ) {
        initializers = flat(initializers, Infinity)
        return function connect(context: any) {
            const injector = Injector.create({
                parent: parentInjector,
                providers: [
                    {
                        provide: HostRef,
                        useValue: {
                            instance: context,
                        },
                    },
                    initializers,
                ],
            })

            initializers.map(injector.get, injector).forEach(instance =>
                destroyObserver.destroyed.subscribe(() => {
                    if (instance.ngOnDestroy) {
                        instance.ngOnDestroy()
                    }
                }),
            )
        }
    }
}
