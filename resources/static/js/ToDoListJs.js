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
                    <button class="task-btn toggle">
                        <img src="../static/pictures/CheckMark.webp" alt="CheckMark">
                    </button>
                    <button class="task-btn edit">
                        <img src="../static/pictures/Pen.webp" alt="Pen">
                    </button>
                    <button class="task-btn delete">
                        <img src="../static/pictures/Trashcan.webp" alt="Trashcan">
                    </button>
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
            renderTasks();
        } else if (btn.classList.contains("delete")) {
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
                if (newText) {
                    task.text = newText;
                }
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
});