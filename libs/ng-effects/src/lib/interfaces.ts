import { Observable } from "rxjs"

export type State<T extends object> = {
    [key in keyof T]: Observable<T[key]> & { changes: Observable<T[key]> }
}
