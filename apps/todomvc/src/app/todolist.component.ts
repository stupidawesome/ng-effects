import { ChangeDetectionStrategy, Component, NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import {
    connectable,
    Connectable,
    effect,
    inject,
    on,
    watchEffect,
} from "@ng9/ng-effects"
import { RouterModule } from "@angular/router"
import { TodosService } from "./todos.service"
import { Todo } from "./interfaces"
import { action } from "./utils"

export const Todolist = connectable((ctx: TodolistComponent) => {
    const todos = inject(TodosService)

    loadTodos: effect(() =>
        todos.list().subscribe((todos) => {
            ctx.todos = todos.slice(0, 10)
        }),
    )

    logChanges: watchEffect(() => {
        // emits whenever the todos ref changes
        // NOTE: by default only shallow props are watched
        console.log("todos changed", ctx.todos)
    })

    createTodo: on(ctx.createTodo, (input) =>
        todos.create(input.value).subscribe((todo) => {
            ctx.todos.unshift({
                ...todo,
                completed: false,
            })
            ctx.todos = ctx.todos.slice()
        }),
    )

    deleteTodo: on(ctx.deleteTodo, (todo) =>
        todos.delete(todo).subscribe(() => {
            ctx.todos = ctx.todos.filter((item) => item.id !== todo.id)
        }),
    )

    editTodo: on(ctx.editTodo, (todo) => {
        ctx.activeTodo = todo
    })

    resetTodo: on(ctx.resetTodo, ([label, todo]) => {
        label.textContent = todo.title
    })

    toggleTodo: on(ctx.toggleTodo, (todo, onInvalidate) => {
        return  todos
            .update({
                ...todo,
                completed: !todo.completed,
            })
            .subscribe((updated) => {
                // mutating array doesn't trigger change detection
                ctx.todos.splice(ctx.todos.indexOf(todo), 1, updated)
                // Create new array
                ctx.todos = ctx.todos.slice()
                // OR manually run change detection to update view
                // markDirty(ctx)
            })

        // onInvalidate(cancel)
    })

    clearCompleted: on(ctx.clearCompleted, () => {
        const completed = ctx.todos.filter((todo) => todo.completed)
        todos.delete(...completed).subscribe(() => {
            ctx.todos = ctx.todos.filter((todo) => !completed.includes(todo))
        })
    })

    updateTodo: on(ctx.updateTodo, ([title, todo]) => {
        todo.title = title
        ctx.activeTodo = undefined
        return todos
            .update({
                ...todo,
                title,
            })
            .subscribe()
    })

    toggleAll: on(ctx.toggleAll, () => {
        if (ctx.todos.every((todo) => todo.completed)) {
            for (const todo of ctx.todos) {
                ctx.toggleTodo(todo)
            }
        } else {
            for (const todo of ctx.todos.filter((todo) => !todo.completed)) {
                ctx.toggleTodo(todo)
            }
        }
    })
})

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
    providers: [Todolist],
})
export class TodolistComponent extends Connectable {
    todos: Todo[] = []
    activeTodo: Todo | undefined
    createTodo = action<HTMLInputElement>()
    deleteTodo = action<Todo>()
    toggleTodo = action<Todo>()
    clearCompleted = action()
    updateTodo = action<string, Todo>()
    editTodo = action<Todo>()
    resetTodo = action<HTMLLabelElement, Todo>()
    toggleAll = action<HTMLLabelElement, Todo>()

    get remaining() {
        return this.todos.filter((todo) => !todo.completed).length
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
