import { fx, inject, reactive, Ref, ref, watch } from "../ngfx"
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    forwardRef,
    NgModule,
    QueryList,
    ViewChild,
    ViewChildren,
} from "@angular/core"
import {
    ComponentFixture,
    fakeAsync,
    TestBed,
    tick,
} from "@angular/core/testing"
import { interval } from "rxjs"
import { take } from "rxjs/operators"
import fn = jest.fn
import Mock = jest.Mock

describe("integration", () => {
    it("should integrate with components", fakeAsync(() => {
        let count: Ref<number>, spy: Mock, subject: ComponentFixture<Parent>

        spy = fn()
        count = ref(10)

        @Component({
            selector: "parent",
            template: `<child
                [count]="count"
                (countChange)="count = $event"
            ></child>`,
            changeDetection: ChangeDetectionStrategy.OnPush,
        })
        class Parent extends fx(parent) {
            // can't use queries metadata because of Ivy bug
            // see: https://github.com/bennadel/Component-Queries-Ivy-Bug-Angular9
            // works in actual app though
            @ViewChild(forwardRef(() => Child))
            viewChild: Child | undefined

            @ViewChildren(forwardRef(() => Child))
            viewChildren!: QueryList<Child>
        }

        @Component({
            selector: "child",
            template: `<div #ref>{{ count }}</div>`,
            inputs: ["count"],
            outputs: ["countChange"],
            changeDetection: ChangeDetectionStrategy.OnPush,
        })
        class Child extends fx(child) {}

        @NgModule({
            declarations: [Parent, Child],
        })
        class MockModule {}

        function parent() {
            const viewChild = ref<Child>()
            const viewChildren = ref<any>()

            watch(viewChild, (child) => {
                spy(child) // x1
            })

            watch(viewChildren, (list) => {
                for (const child of list.toArray()) {
                    spy(child) // x1
                }
            })

            watch(count, (value) => {
                // triggered by event emitter in Child
                spy(value) // x5
            })

            interval(1000)
                .pipe(take(5))
                .subscribe((num) => {
                    count.value += num + 1
                })

            return {
                count,
                viewChild,
                viewChildren,
            }
        }

        function child() {
            const parent = inject(Parent)
            const count = ref(0)
            const countChange = new EventEmitter(true)
            const state = reactive({
                count,
                countChange,
            })

            spy(parent)

            watch(
                () => state.count,
                (value) => {
                    spy(value) // x5
                    countChange.emit(value)
                },
            )

            return state
        }
        subject = TestBed.configureTestingModule({
            imports: [MockModule],
        }).createComponent(Parent)

        subject.autoDetectChanges(true)

        tick(10000)

        expect(spy).toHaveBeenCalledTimes(14)
    }))
})
