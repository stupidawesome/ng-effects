import { ChangeDetectorRef } from "@angular/core"
import { Observable } from "rxjs"
import { AnyEffectFn, EffectFn } from "../interfaces"
import { HostEmitter } from "../host-emitter"

export interface RenderApi {
    detectChanges(componentOrView: any, changeDetector?: ChangeDetectorRef): void
    markDirty(componentOrView: any, changeDetector?: ChangeDetectorRef): void
    whenScheduled(): Observable<null>
    whenRendered(): Observable<null>
}

export type MapSelect<T> = {
    [key in keyof T]: T[key] extends HostEmitter<any> ? T[key] : Observable<T[key]>
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

export interface EffectDecorator<TKey> {
    // tslint:disable-next-line:callable-types
    <T extends object, V extends keyof T = TKey extends keyof T ? TKey : never>(
        target: any,
        prop: PropertyKey,
        propertyDescriptor: {
            value?: EffectFn<T, unknown extends TKey ? any : true extends TKey ? Partial<T> : T[V]>
        },
    ): void
}

export interface EffectAdapterDecorator<T> {
    // tslint:disable-next-line:callable-types
    (
        target: any,
        prop: any,
        propertyDescriptor: {
            value?: AnyEffectFn<any, T>
        },
    ): void
}
