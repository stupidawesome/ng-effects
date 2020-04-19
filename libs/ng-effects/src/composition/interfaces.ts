import { Observable, Subject } from "rxjs"

export type EmitSources<T> = {
    [key in keyof T]?: T[key] extends Subject<infer R> ? Observable<R> : never
}

export type AssignSources<T> = {
    [key in keyof T]?: Observable<T[key]>
}

export enum ChangeDetection {
    MarkDirty,
    DetectChanges,
    None
}

export type ChangeDetectionMap<T> = {
    [key in keyof T]?: ChangeDetection
}
