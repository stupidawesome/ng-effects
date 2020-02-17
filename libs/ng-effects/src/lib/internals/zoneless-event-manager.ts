import { Inject, Injectable, NgZone } from "@angular/core"
import { EVENT_MANAGER_PLUGINS, EventManager } from "@angular/platform-browser"
import { globalNotifier } from "./constants"

/**
 * In "noop" ngZone, DOM events no longer trigger change detection
 * This service patches the event manager so that effects can be checked
 * when binding to DOM events in the template. Global events trigger are
 * not checked and must call `markDirty()` or `detectChanges` to propagate
 * changes to effects.
 */
@Injectable()
export class ZonelessEventManager extends EventManager {
    constructor(@Inject(EVENT_MANAGER_PLUGINS) plugins: any[], zone: NgZone) {
        super(plugins, zone)
    }
    addEventListener(element: HTMLElement, eventName: string, handler: Function): Function {
        return super.addEventListener(element, eventName, (event: any) => {
            const result = handler(event)
            globalNotifier.next(element)
            return result
        })
    }
}
