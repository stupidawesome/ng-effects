import { Inject, Injectable, RendererFactory2 } from "@angular/core"
import { ViewRenderer } from "./view-renderer"
import { DETECT_CHANGES, MARK_DIRTY } from "./providers"
import { HostRef } from "./host-ref"

@Injectable()
export class ExperimentalIvyViewRenderer extends ViewRenderer {
    constructor(
        rendererFactory: RendererFactory2,
        @Inject(DETECT_CHANGES) detectChanges: any,
        @Inject(MARK_DIRTY) markDirty: any,
    ) {
        super(rendererFactory)

        this.detectChanges = function(hostRef: HostRef) {
            detectChanges(hostRef.context)
        }

        this.markDirty = function(hostRef: HostRef) {
            markDirty(hostRef.context)
        }
    }
}
