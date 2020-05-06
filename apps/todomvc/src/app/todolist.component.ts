import {
    ChangeDetectionStrategy,
    Component,
    Input,
    NgModule,
} from "@angular/core"
import { CommonModule } from "@angular/common"
import {
    Connectable,
    effect,
    inject,
    onChanges,
    onDestroy,
    onInvalidate,
    watchEffect,
} from "@ng9/ng-effects"
import { RouterModule } from "@angular/router"
import { TodosService } from "./todos.service"
import { Todo } from "./interfaces"
import { HttpClient } from "@angular/common/http"
import { subscribe } from "./utils"

@Component({
    selector: "ngfx-todolist",
    template: `
        <section class="todoapp">
            <header class="header">
                <h1>todos</h1>
                <input
                    class="new-todo"
                    placeholder="What needs to be done?"
                    autofocus
                    #input
                    (keydown.enter)="createTodo(input); input.value = ''"
                />
            </header>
            <!-- This section should be hidden by default and shown when there are todos -->
            <section class="main" *ngIf="todos.length">
                <input
                    id="toggle-all"
                    class="toggle-all"
                    type="checkbox"
                    (change)="toggleAll()"
                />
                <label for="toggle-all">Mark all as complete</label>
                <ul class="todo-list">
                    <!-- These are here just to show the structure of the list items -->
                    <!-- List items should get the class \`editing\` when editing and \`completed\` when marked as completed -->
                    <li
                        *ngFor="let todo of todos"
                        [class.completed]="todo.completed"
                    >
                        <div class="view">
                            <input
                                class="toggle"
                                type="checkbox"
                                [checked]="todo.completed"
                                (change)="toggleTodo(todo)"
                            />
                            <label
                                tabindex="0"
                                [attr.contenteditable]="activeTodo === todo"
                                (blur)="resetTodo(label, todo)"
                                (keydown.escape)="resetTodo(label, todo)"
                                (keydown.enter)="
                                    $event.preventDefault();
                                    updateTodo(label.innerText, todo);
                                    label.blur()
                                "
                                (dblclick)="editTodo(todo)"
                                #label
                                >{{ todo.title }}</label
                            >
                            <button
                                class="destroy"
                                (click)="deleteTodo(todo)"
                            ></button>
                        </div>
                        <input class="edit" value="Create a TodoMVC template" />
                    </li>
                </ul>
            </section>
            <!-- This footer should hidden by default and shown when there are todos -->
            <footer class="footer" *ngIf="todos.length">
                <!-- This should be \`0 items left\` by default -->
                <span class="todo-count"
                    ><strong>{{ remaining }}</strong> item{{
                        remaining === 1 ? "s" : ""
                    }}
                    left</span
                >
                <!-- Hidden if no completed items are left ↓ -->
                <button class="clear-completed" (click)="clearCompleted()">
                    Clear completed
                </button>
            </footer>
        </section>
        <footer class="info">
            <p>Double-click to edit a todo</p>
            <!-- Change this out with your name and url ↓ -->
            <p>Created by <a href="https://ngfx.io">NgFx</a></p>
            <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
        </footer>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodolistComponent extends Connectable {
    todos: Todo[] = []
    activeTodo: Todo | undefined
    http = inject(HttpClient)
    svc = inject(TodosService)

    @Input()
    count = 0

    get remaining() {
        return this.todos.filter((todo) => !todo.completed).length
    }

    createTodo(input: HTMLInputElement) {
        this.svc.create(input.value).subscribe((todo) => {
            this.todos.unshift({
                ...todo,
                completed: false,
            })
            this.todos = this.todos.slice()
        })
    }

    deleteTodo(todo: Todo) {
        subscribe(this.svc.delete(todo), () => {
            this.todos = this.todos.filter((item) => item.id !== todo.id)
        })
    }

    editTodo(todo: Todo) {
        this.activeTodo = todo
    }

    resetTodo(label: HTMLLabelElement, todo: Todo) {
        label.textContent = todo.title
    }

    toggleTodo(todo: Todo) {
        const cancel = subscribe(
            this.svc.update({
                ...todo,
                completed: !todo.completed,
            }),
            (updated) => {
                // mutating array doesn't trigger change detection
                this.todos.splice(this.todos.indexOf(todo), 1, updated)
                // Create new array
                this.todos = this.todos.slice()
                // OR manually run change detection to update view
                // markDirty(this)
            },
        )

        onDestroy(cancel)
    }

    clearCompleted() {
        const completed = this.todos.filter((todo) => todo.completed)
        const cancel = subscribe(this.svc.delete(...completed), () => {
            this.todos = this.todos.filter((todo) => !completed.includes(todo))
        })

        onInvalidate(cancel)
    }

    updateTodo(title: string, todo: Todo) {
        todo.title = title
        this.activeTodo = undefined
        return this.svc
            .update({
                ...todo,
                title,
            })
            .subscribe()
    }

    toggleAll() {
        if (this.todos.every((todo) => todo.completed)) {
            for (const todo of this.todos) {
                this.toggleTodo(todo)
            }
        } else {
            for (const todo of this.todos.filter((todo) => !todo.completed)) {
                this.toggleTodo(todo)
            }
        }
    }

    ngOnConnect() {
        const todos = inject(TodosService)

        loadTodos: effect(() =>
            todos.list().subscribe((todos) => {
                this.todos = todos.slice(0, 10)
            }),
        )

        logChanges: watchEffect(() => {
            // emits whenever the todos ref changes
            // NOTE: by default only shallow props are watched
            console.log("todos changed", this.todos)
        })

        nestedEffect: onChanges((changes) => {
            console.log("changes!", changes)
            effect(() => {
                // resets every time onChanges hook fires
                onInvalidate(() => {
                    console.log("invalidate!")
                })
            })
        })
    }
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
})
export class TodolistModule {}
