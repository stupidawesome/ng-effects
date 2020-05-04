import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { Todo } from "./interfaces"
import { forkJoin } from "rxjs"

const endpoint = "https://jsonplaceholder.typicode.com"

@Injectable({ providedIn: "root" })
export class TodosService {
    constructor(private http: HttpClient) {}

    list() {
        return this.http.get<Todo[]>(`${endpoint}/todos`)
    }

    update(todo: Todo) {
        return this.http.patch<Todo>(`${endpoint}/todos/${todo.id}`, todo)
    }

    delete(...todos: Todo[]) {
        return forkJoin(
            ...todos.map((todo) =>
                this.http.delete(`${endpoint}/todos/${todo.id}`),
            ),
        )
    }

    create(title: string) {
        return this.http.post<Todo>(`${endpoint}/todos`, {
            userId: 1,
            title,
        })
    }
}
