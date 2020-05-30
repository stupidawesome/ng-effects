import { ChangeDetectionStrategy, Component, NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { TodosService } from "./todos.service"
import { Todo } from "./interfaces"
import { subscribe } from "./utils"
import { watchEffect } from "@ng9/ng-effects"
import {
    computed,
    defineComponent,
    inject,
    ref,
} from "../../../../libs/ng-effects/src/lib/ngfx"

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
                        remaining === 1 ? "" : "s"
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
export class TodolistComponent extends defineComponent(todolist) {}

function todolist() {
    const Todos = inject(TodosService)
    const todos = ref<Todo[]>([])
    const activeTodo = ref<Todo>()
    const remaining = computed(
        () => todos.value.filter((todo) => !todo.completed).length,
    )

    function createTodo(input: HTMLInputElement) {
        Todos.create(input.value).subscribe((todo) => {
            todos.value.unshift({
                ...todo,
                completed: false,
            })
        })
    }

    function deleteTodo(todo: Todo) {
        subscribe(Todos.delete(todo), () => {
            todos.value = todos.value.filter((item) => item.id !== todo.id)
        })
    }

    function editTodo(todo: Todo) {
        activeTodo.value = todo
    }

    function resetTodo(label: HTMLLabelElement, todo: Todo) {
        label.textContent = todo.title
    }

    function toggleTodo(todo: Todo) {
        subscribe(
            Todos.update({
                ...todo,
                completed: !todo.completed,
            }),
            (updated) => {
                // mutating array doesn't trigger change detection
                todos.value.splice(todos.value.indexOf(todo), 1, updated)
                // Create new array
                todos.value = todos.value.slice()
                // OR manually run change detection to update view
                // markDirty(this)
            },
        )
    }

    function clearCompleted() {
        const completed = todos.value.filter((todo) => todo.completed)
        subscribe(Todos.delete(...completed), () => {
            todos.value = todos.value.filter(
                (todo) => !completed.includes(todo),
            )
        })
    }

    function updateTodo(title: string, todo: Todo) {
        todo.title = title
        activeTodo.value = undefined
        return Todos.update({
            ...todo,
            title,
        }).subscribe()
    }

    function toggleAll() {
        if (todos.value.every((todo) => todo.completed)) {
            for (const todo of todos.value) {
                toggleTodo(todo)
            }
        } else {
            for (const todo of todos.value.filter((todo) => !todo.completed)) {
                toggleTodo(todo)
            }
        }
    }

    watchEffect((onInvalidate) => {
        const sub = Todos.list().subscribe((values) => {
            todos.value = values.slice(0, 10)
        })
        onInvalidate(() => sub.unsubscribe())
    })

    watchEffect((onInvalidate) => {
        console.log("todos changed", todos.value)

        onInvalidate(() => {
            console.log("invalidate!")
        })
    })

    return {
        todos,
        activeTodo,
        remaining,
        createTodo,
        deleteTodo,
        editTodo,
        resetTodo,
        toggleTodo,
        clearCompleted,
        updateTodo,
        toggleAll,
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
    exports: [TodolistComponent],
})
export class TodolistModule {}
