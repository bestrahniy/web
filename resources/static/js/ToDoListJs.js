document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("task-input");
    const addBtn = document.getElementById("add-btn");
    const taskList = document.getElementById("task-list");
    const filters = document.querySelectorAll(".filter");

    const statusSelect = document.getElementById("task-status");
    const prioritySelect = document.getElementById("task-priority");

    const createdContainer = document.querySelector(".created-tasks .tasks-container");
    const inProgressContainer = document.querySelector(".in-progress-task .tasks-container");
    const endedContainer = document.querySelector(".ended-task .tasks-container");

    const prioritySortBtn = document.getElementById("priority-sort-btn");

    let tasks = [];
    let currentFilter = "all";
    let prioritySort = null;

    const statusTextMap = {
        new: "Новая",
        inProgress: "В процессе",
        done: "Завершенная"
    };

    const priorityTextMap = {
        low: "Низкий",
        medium: "Средний",
        high: "Высокий"
    };

    const priorityValue = {
        low: 0,
        medium: 1,
        high: 2
    };

    addBtn.addEventListener("click", addTask);
    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") addTask();
    });

    function addTask() {
        const text = input.value.trim();
        if (!text) return;

        const status = statusSelect.value;
        const priority = prioritySelect.value;

        const task = {
            id: Date.now(),
            text,
            status,
            priority,
            done: status === "done"
        };

        tasks.push(task);
        input.value = "";
        renderTasks();
    }

    function renderTasks() {
        createdContainer.innerHTML = "";
        inProgressContainer.innerHTML = "";
        endedContainer.innerHTML = "";

        let filtered = tasks.filter(t => {
            if (currentFilter === "done") return t.done;
            if (currentFilter === "notDone") return !t.done;
            return true;
        });

        if (prioritySort !== null) {
            filtered.sort((a, b) => {
                if (prioritySort === "desc") {
                    return priorityValue[b.priority] - priorityValue[a.priority];
                } else {
                    return priorityValue[a.priority] - priorityValue[b.priority];
                }
            });
        }

        filtered.forEach(task => {
            const div = document.createElement("div");
            div.className = `task ${task.done ? "done" : ""} priority-${task.priority}`;
            div.dataset.id = task.id;

            div.innerHTML = `
                <div class="task-main">
                    <input type="text" value="${task.text}" readonly>
                    <div class="task-meta">
                        <span class="badge status-badge status-${task.status}">
                            ${statusTextMap[task.status]}
                        </span>
                        <span class="badge priority-badge priority-${task.priority}">
                            Приоритет: ${priorityTextMap[task.priority]}
                        </span>
                    </div>
                </div>
                <div class="task-buttons">

                    <button class="task-btn move-back" title="Назад">
                        <img src="../static/pictures/ArrowLeft.webp" alt="Back">
                    </button>

                    <button class="task-btn move-forward" title="Вперёд">
                        <img src="../static/pictures/ArrowRight.webp" alt="Forward">
                    </button>

                    <button class="task-btn edit">
                        <img src="../static/pictures/Pen.webp" alt="Edit">
                    </button>

                    <button class="task-btn delete">
                        <img src="../static/pictures/Trashcan.webp" alt="Delete">
                    </button>
                </div>
            `;

            if (task.status === "new") {
                createdContainer.appendChild(div);
            } else if (task.status === "inProgress") {
                inProgressContainer.appendChild(div);
            } else {
                endedContainer.appendChild(div);
            }
        });
    }

    taskList.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;

        const taskEl = btn.closest(".task");
        const id = Number(taskEl.dataset.id);
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        // ← НАЗАД
        if (btn.classList.contains("move-back")) {
            if (task.status === "inProgress") {
                task.status = "new";
                task.done = false;
            } else if (task.status === "done") {
                task.status = "inProgress";
                task.done = false;
            }
            renderTasks();
            return;
        }

        // → ВПЕРЁД
        if (btn.classList.contains("move-forward")) {
            if (task.status === "new") {
                task.status = "inProgress";
            } else if (task.status === "inProgress") {
                task.status = "done";
                task.done = true;
            }
            renderTasks();
            return;
        }

        // ОСТАЛЬНЫЕ КНОПКИ (редактировать и удалить)
        if (btn.classList.contains("delete")) {
            tasks = tasks.filter(t => t.id !== id);
            renderTasks();
        } else if (btn.classList.contains("edit")) {
            const inputField = taskEl.querySelector("input");
            const editImg = btn.querySelector("img");

            if (inputField.readOnly) {
                inputField.readOnly = false;
                inputField.focus();
                inputField.select();
                editImg.src = "../static/pictures/Save.webp";
                editImg.alt = "Save";
            } else {
                const newText = inputField.value.trim();
                if (newText) task.text = newText;
                inputField.readOnly = true;
                editImg.src = "../static/pictures/Pen.webp";
                editImg.alt = "Pen";
            }
        }
    });


    taskList.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const inputField = e.target;
            if (inputField.tagName === "INPUT" && !inputField.readOnly) {
                const taskEl = inputField.closest(".task");
                const editBtn = taskEl.querySelector(".edit");
                editBtn.click();
            }
        }
    });

    taskList.addEventListener("focusout", (e) => {
        const inputField = e.target;
        if (inputField.tagName === "INPUT" && !inputField.readOnly) {
            setTimeout(() => {
                const taskEl = inputField.closest(".task");
                if (taskEl && document.activeElement !== inputField) {
                    const editBtn = taskEl.querySelector(".edit");
                    const editImg = editBtn.querySelector("img");
                    if (editImg.alt === "Save") {
                        editBtn.click();
                    }
                }
            }, 100);
        }
    });

    filters.forEach(btn => {
        btn.addEventListener("click", () => {
            filters.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    if (prioritySortBtn) {
        prioritySortBtn.addEventListener("click", () => {
            if (prioritySort === null) {
                prioritySort = "desc";
                prioritySortBtn.textContent = "Приоритет ↓";
            } else if (prioritySort === "desc") {
                prioritySort = "asc";
                prioritySortBtn.textContent = "Приоритет ↑";
            } else {
                prioritySort = null;
                prioritySortBtn.textContent = "Приоритет";
            }
            renderTasks();
        });
    }
});
