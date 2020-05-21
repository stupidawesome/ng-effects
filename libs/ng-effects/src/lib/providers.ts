import { Provider } from "@angular/core"
import { CONNECTABLE, ConnectableFunction } from "./connect"

export function connectable<T>(fn: ConnectableFunction<T>): Provider[] {
    return [
        {
            provide: CONNECTABLE,
            useValue: fn,
            multi: true,
        },
    ]
}
