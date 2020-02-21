import { ChangeDetectorRef } from "@angular/core"
import { BehaviorSubject, Observable } from "rxjs"
import { HostRef } from "../constants"

export interface RenderApi {
    detectChanges(componentOrView: any, changeDetector?: ChangeDetectorRef): void
    markDirty(componentOrView: any, changeDetector?: ChangeDetectorRef): void
    whenScheduled(): Observable<null>
    whenRendered(): Observable<null>
}

export type MapSelect<T> = {
    [key in keyof T]: Observable<T[key]>
}

export type NextValue<T extends any> = T["next"] extends (value: infer R, ...args: any[]) => any
    ? R
    : never

export type NextOptions<T extends any> = T["next"] extends (
    value: any,
    options: infer R,
    ...args: any[]
) => any
    ? R
    : never

export interface InternalHostRef<T = any> extends HostRef<T> {
    readonly observer: BehaviorSubject<T>
    readonly update: Function
    readonly next: () => void
}
