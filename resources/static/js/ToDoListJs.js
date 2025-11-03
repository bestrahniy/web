document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("task-input");
    const addBtn = document.getElementById("add-btn");
    const taskList = document.getElementById("task-list");
    const filters = document.querySelectorAll(".filter");

    let tasks = [];
    let currentFilter = "all";


    addBtn.addEventListener("click", addTask);
    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            addTask();
        }
    });


    function addTask() {
        const text = input.value.trim();
        if (!text) {
            return;
        }

        const task = {
            id: Date.now(),
            text,
            done: false
        };

        tasks.push(task);
        input.value = "";
        renderTasks();
    }


    function renderTasks() {
        taskList.innerHTML = "";

        const filtered = tasks.filter(t => {
        if (currentFilter === "done") return t.done;
        if (currentFilter === "notDone") return !t.done;
            return true;
        });

        filtered.forEach(task => {
            const div = document.createElement("div");
            div.className = `task ${task.done ? "done" : ""}`;
            div.innerHTML = `
                <input type="text" value="${task.text}" readonly>
                <div class="task-buttons">
                    <button class="task-btn toggle">✔️</button>
                    <button class="task-btn edit">✏️</button>
                    <button class="task-btn delete">🗑️</button>
                </div>
            `;
            div.dataset.id = task.id;
            taskList.appendChild(div);
        });
    }


    taskList.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;

        const taskEl = btn.closest(".task");
        const id = Number(taskEl.dataset.id);
        const task = tasks.find(t => t.id === id);

        
        if (btn.classList.contains("toggle")) {
            task.done = !task.done;
        } else if (btn.classList.contains("delete")) {
            tasks = tasks.filter(t => t.id !== id);
        } else if (btn.classList.contains("edit")) {
            const inputField = taskEl.querySelector("input");
            if (inputField.readOnly) {
                inputField.readOnly = false;
                inputField.focus();
            } else {
                task.text = inputField.value.trim();
                inputField.readOnly = true;
            }
        }
        renderTasks();
    });


    filters.forEach(btn => {
        btn.addEventListener("click", () => {
            filters.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
});
