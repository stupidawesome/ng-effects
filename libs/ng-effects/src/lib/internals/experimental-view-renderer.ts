import { Injectable, ɵdetectChanges as detectChanges, ɵmarkDirty as markDirty } from "@angular/core"
import { ViewRenderer } from "./view-renderer"

@Injectable()
export class ExperimentalIvyViewRenderer extends ViewRenderer {
    public detectChanges(componentOrView: any): void {
        detectChanges(componentOrView)
    }

    public markDirty(componentOrView: any): void {
        markDirty(componentOrView)
    }
}
