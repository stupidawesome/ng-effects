import { ChangeDetectorRef } from "@angular/core"
import { Observable } from "rxjs"

export interface RenderApi {
    detectChanges(componentOrView: any, changeDetector?: ChangeDetectorRef): void
    markDirty(componentOrView: any, changeDetector?: ChangeDetectorRef): void
    whenScheduled(): Observable<void>
    whenRendered(): Observable<void>
}
