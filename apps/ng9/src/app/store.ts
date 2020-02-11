import { Injectable } from "@angular/core"
import { Observable } from "rxjs"
import { Dispatcher } from "./dispatch-adapter"

@Injectable()
export class Store<T> extends Observable<T> implements Dispatcher {
    dispatch(action: any) {
        // tslint:disable-next-line:no-console
        console.debug("dispatched action!", JSON.stringify(action))
    }
}
