import { Injectable } from "@angular/core"
import { BehaviorSubject } from "rxjs"
import { Dispatcher } from "./dispatch-adapter"

@Injectable({ providedIn: "root" })
export class Store<T> extends BehaviorSubject<any> implements Dispatcher {
    constructor() {
        super({})
    }
    dispatch(action: any) {
        // tslint:disable-next-line:no-console
        console.debug("dispatched action!", JSON.stringify(action))
    }
}
