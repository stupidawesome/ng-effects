import { Observable } from "rxjs"
import { HostEmitter } from "../host-emitter/host-emitter"

export type ObservableSources<T> = {
    [key in keyof T]?: Observable<T[key]>
}

export type MapSelect<T> = {
    [key in keyof T]-?: T[key] extends HostEmitter<any> ? T[key] : Observable<T[key]>
}
