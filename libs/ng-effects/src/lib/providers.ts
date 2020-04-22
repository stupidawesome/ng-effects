import { Provider } from "@angular/core"
import { ConnectableFunction } from "./interfaces"
import { CONNECTABLE } from "./constants"

export function connectable<T>(fn: ConnectableFunction<T>): Provider[] {
    return [
        {
            provide: CONNECTABLE,
            useValue: fn,
            multi: true,
        },
    ]
}
