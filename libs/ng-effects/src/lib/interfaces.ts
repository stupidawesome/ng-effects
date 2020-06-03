import { SimpleChanges } from "@angular/core"
import { Ref, UnwrapRef } from "./ref"

export interface ReactiveOptions {
    shallow?: boolean
}

export type CreateEffect = (onInvalidate: OnInvalidate) => void
export interface OnInvalidate {
    (teardown: () => void): void
}

export interface Context {}

export const enum Lifecycle {
    OnConnect,
    OnChanges,
    OnInit,
    OnCheck,
    OnContentInit,
    OnContentChecked,
    OnViewInit,
    OnViewChecked,
    OnDestroy,
}

export type Flush = "pre" | "post" | "sync"

export interface WatchEffectOptions {
    flush?: Flush
    immediate?: boolean
}

export interface LifecycleHooks {
    ngOnChanges(changes: SimpleChanges): void
    ngOnInit(): void
    ngDoCheck(): void
    ngAfterContentInit(): void
    ngAfterContentChecked(): void
    ngAfterViewInit(): void
    ngAfterViewChecked(): void
    ngOnDestroy(): void
}

export const enum ReactiveFlags {
    skip = "__ng_skip",
    isReactive = "__ng_isReactive",
    isReadonly = "__ng_isReadonly",
    raw = "__ng_raw",
    reactive = "__ng_reactive",
    readonly = "__ng_readonly",
}

export interface Target {
    __ng_skip?: boolean
    __ng_isReactive?: boolean
    __ng_isReadonly?: boolean
    __ng_raw?: any
    __ng_reactive?: any
    __ng_readonly?: any
}

// only unwrap nested ref
export type UnwrapNestedRefs<T> = T extends Ref<any> ? T : UnwrapRef<T>
