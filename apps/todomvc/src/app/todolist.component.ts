import {
    ChangeDetectionStrategy,
    Component,
    Input,
    NgModule,
    ViewChild,
} from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { TodosService } from "./todos.service"
import { Todo } from "./interfaces"
import { subscribe } from "./utils"
import { observe } from "../../../../libs/ng-effects/src/lib/utils"
import { delay, pluck } from "rxjs/operators"
import { Action } from "../../../../libs/ng-effects/src/lib/effect"

@Component({
    selector: "ngfx-todolist",
    template: `
        <!--        <section class="todoapp">-->
        <!--            <header class="header">-->
        <!--                <h1>todos</h1>-->
        <!--                <input-->
        <!--                    class="new-todo"-->
        <!--                    placeholder="What needs to be done?"-->
        <!--                    autofocus-->
        <!--                    #input-->
        <!--                    (keydown.enter)="createTodo(input); input.value = ''"-->
        <!--                />-->
        <!--            </header>-->
        <!--            &lt;!&ndash; This section should be hidden by default and shown when there are todos &ndash;&gt;-->
        <!--            <section class="main" *ngIf="todos.length">-->
        <!--                <input-->
        <!--                    id="toggle-all"-->
        <!--                    class="toggle-all"-->
        <!--                    type="checkbox"-->
        <!--                    (change)="toggleAll()"-->
        <!--                />-->
        <!--                <label for="toggle-all">Mark all as complete</label>-->
        <!--                <ul class="todo-list">-->
        <!--                    &lt;!&ndash; These are here just to show the structure of the list items &ndash;&gt;-->
        <!--                    &lt;!&ndash; List items should get the class \`editing\` when editing and \`completed\` when marked as completed &ndash;&gt;-->
        <!--                    <li-->
        <!--                        *ngFor="let todo of todos"-->
        <!--                        [class.completed]="todo.completed"-->
        <!--                    >-->
        <!--                        <div class="view">-->
        <!--                            <input-->
        <!--                                class="toggle"-->
        <!--                                type="checkbox"-->
        <!--                                [checked]="todo.completed"-->
        <!--                                (change)="toggleTodo(todo)"-->
        <!--                            />-->
        <!--                            <label-->
        <!--                                tabindex="0"-->
        <!--                                [attr.contenteditable]="activeTodo === todo"-->
        <!--                                (blur)="resetTodo(label, todo)"-->
        <!--                                (keydown.escape)="resetTodo(label, todo)"-->
        <!--                                (keydown.enter)="-->
        <!--                                    $event.preventDefault();-->
        <!--                                    updateTodo(label.innerText, todo);-->
        <!--                                    label.blur()-->
        <!--                                "-->
        <!--                                (dblclick)="editTodo(todo)"-->
        <!--                                #label-->
        <!--                                >{{ todo.title }}</label-->
        <!--                            >-->
        <!--                            <button-->
        <!--                                class="destroy"-->
        <!--                                (click)="deleteTodo(todo)"-->
        <!--                            ></button>-->
        <!--                        </div>-->
        <!--                        <input class="edit" value="Create a TodoMVC template" />-->
        <!--                    </li>-->
        <!--                </ul>-->
        <!--            </section>-->
        <!--            &lt;!&ndash; This footer should hidden by default and shown when there are todos &ndash;&gt;-->
        <!--            <footer class="footer" *ngIf="todos.length">-->
        <!--                &lt;!&ndash; This should be \`0 items left\` by default &ndash;&gt;-->
        <!--                <span class="todo-count"-->
        <!--                    ><strong>{{ remaining() }}</strong> item{{-->
        <!--                        remaining() === 1 ? "" : "s"-->
        <!--                    }}-->
        <!--                    left</span-->
        <!--                >-->
        <!--                &lt;!&ndash; Hidden if no completed items are left ↓ &ndash;&gt;-->
        <!--                <button class="clear-completed" (click)="clearCompleted()">-->
        <!--                    Clear completed-->
        <!--                </button>-->
        <!--            </footer>-->
        <!--        </section>-->
        <!--        <footer class="info">-->
        <!--            <p>Double-click to edit a todo</p>-->
        <!--            &lt;!&ndash; Change this out with your name and url ↓ &ndash;&gt;-->
        <!--            <p>Created by <a href="https://ngfx.io">NgFx</a></p>-->
        <!--            <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>-->
        <!--        </footer>-->
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodolistComponent {
    // private Todos = inject(TodosService)
    //
    // todos: Todo[] = []
    // activeTodo: Todo | undefined
    //
    // @Input()
    // count = 0
    //
    // remaining = Computed(
    //     () => this.todos.filter((todo) => !todo.completed).length,
    // )
    //
    // createTodo(input: HTMLInputElement) {
    //     this.Todos.create(input.value).subscribe((todo) => {
    //         this.todos.unshift({
    //             ...todo,
    //             completed: false,
    //         })
    //         this.todos = this.todos.slice()
    //     })
    // }
    //
    // deleteTodo(todo: Todo) {
    //     subscribe(this.Todos.delete(todo), () => {
    //         this.todos = this.todos.filter((item) => item.id !== todo.id)
    //     })
    // }
    //
    // editTodo(todo: Todo) {
    //     this.activeTodo = todo
    // }
    //
    // resetTodo(label: HTMLLabelElement, todo: Todo) {
    //     label.textContent = todo.title
    // }
    //
    // toggleTodo(todo: Todo) {
    //     subscribe(
    //         this.Todos.update({
    //             ...todo,
    //             completed: !todo.completed,
    //         }),
    //         (updated) => {
    //             // mutating array doesn't trigger change detection
    //             this.todos.splice(this.todos.indexOf(todo), 1, updated)
    //             // Create new array
    //             this.todos = this.todos.slice()
    //             // OR manually run change detection to update view
    //             // markDirty(this)
    //         },
    //     )
    // }
    //
    // clearCompleted() {
    //     const completed = this.todos.filter((todo) => todo.completed)
    //     subscribe(this.Todos.delete(...completed), () => {
    //         this.todos = this.todos.filter((todo) => !completed.includes(todo))
    //     })
    // }
    //
    // updateTodo(title: string, todo: Todo) {
    //     todo.title = title
    //     this.activeTodo = undefined
    //     return this.Todos.update({
    //         ...todo,
    //         title,
    //     }).subscribe()
    // }
    //
    // toggleAll() {
    //     if (this.todos.every((todo) => todo.completed)) {
    //         for (const todo of this.todos) {
    //             this.toggleTodo(todo)
    //         }
    //     } else {
    //         for (const todo of this.todos.filter((todo) => !todo.completed)) {
    //             this.toggleTodo(todo)
    //         }
    //     }
    // }
    //
    // ngOnConnect(props: this, refs: Refs<this>) {
    //     const todos = inject(TodosService)
    //
    //     // loadTodos: effect(() =>
    //     //     todos.list().subscribe((todos) => {
    //     //         this.todos = todos.slice(0, 10)
    //     //     }),
    //     // )
    //
    //     // watchEffect is called once immediately after ngOnConnect and
    //     // each time the dependencies change, _after_ the component has updated
    //     logChanges: watchEffect((onInvalidate) => {
    //         // emits whenever the todos ref changes
    //         // NOTE: by default only shallow props are watched on `this`
    //         console.log("todos changed", this.todos)
    //
    //         // this.todos = [] // this will cause expression change after check error
    //
    //         onInvalidate(() => {
    //             // called when `this.todos` changes
    //             console.log("invalidate!", isOnDestroy())
    //         })
    //     })
    // }
}

@NgModule({
    declarations: [TodolistComponent],
    imports: [
        CommonModule,
        RouterModule.forChild([
            {
                path: "",
                component: TodolistComponent,
            },
        ]),
    ],
    exports: [TodolistComponent],
})
export class TodolistModule {}
