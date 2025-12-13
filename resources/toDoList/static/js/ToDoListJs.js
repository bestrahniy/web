document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("task-input");
    const addBtn = document.getElementById("add-btn");
    const taskList = document.getElementById("task-list");
    const statusSelect = document.getElementById("task-status");
    const prioritySelect = document.getElementById("task-priority");

    const createdSection = document.querySelector(".created-tasks");
    const inProgressSection = document.querySelector(".in-progress-task");
    const endedSection = document.querySelector(".ended-task");

    const createdContainer = createdSection.querySelector(".tasks-container");
    const inProgressContainer = inProgressSection.querySelector(".tasks-container");
    const endedContainer = endedSection.querySelector(".tasks-container");

    const prioritySortBtn = document.getElementById("priority-sort-btn");
    const filters = document.querySelectorAll(".filter");

    let tasks = [];
    let currentFilter = "all";
    let prioritySort = null;

    const statusTextMap = { new: "Новая", inProgress: "В процессе", done: "Завершенная" };
    const priorityTextMap = { low: "Низкий", medium: "Средний", high: "Высокий" };
    const priorityValue = { low: 0, medium: 1, high: 2 };

    const save = () => localStorage.setItem("tasks", JSON.stringify(tasks));

    const autoResize = (el) => {
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    };

    const containerFromStatus = (status) => {
        if (status === "new") return createdContainer;
        if (status === "inProgress") return inProgressContainer;
        return endedContainer;
    };

    const getTaskById = (id) => tasks.find(t => String(t.id) === String(id));

    const ensureOrder = () => {
        const byStatus = { new: [], inProgress: [], done: [] };
        tasks.forEach(t => {
            if (typeof t.order !== "number") t.order = 0;
            if (!byStatus[t.status]) byStatus[t.status] = [];
            byStatus[t.status].push(t);
        });
        Object.keys(byStatus).forEach(status => {
            const arr = byStatus[status].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            arr.forEach((t, i) => t.order = i);
        });
    };

    const nextOrderInStatus = (status, exceptTask = null) => {
        const same = tasks.filter(t => t.status === status && t !== exceptTask);
        if (!same.length) return 0;
        return Math.max(...same.map(t => (typeof t.order === "number" ? t.order : 0))) + 1;
    };

    const clearDropHover = () => {
        [createdSection, inProgressSection, endedSection].forEach(s => s.classList.remove("drop-hover"));
    };

    function makeDroppable(section, status, doneValue) {
        section.addEventListener("dragenter", (e) => {
            const dragging = document.querySelector(".task.dragging");
            if (!dragging) return;
            e.preventDefault();
            clearDropHover();
            section.classList.add("drop-hover");
        });

        section.addEventListener("dragover", (e) => {
            const dragging = document.querySelector(".task.dragging");
            if (!dragging) return;
            e.preventDefault();
            section.classList.add("drop-hover");
        });

        section.addEventListener("dragleave", (e) => {
            const dragging = document.querySelector(".task.dragging");
            if (!dragging) return;
            const rel = e.relatedTarget;
            if (rel && section.contains(rel)) return;
            section.classList.remove("drop-hover");
        });

        section.addEventListener("drop", (e) => {
            e.preventDefault();
            const dragging = document.querySelector(".task.dragging");
            if (!dragging) return;

            const id = dragging.dataset.id;
            const task = getTaskById(id);
            if (!task) return;

            if (task.status !== status) {
                task.status = status;
                task.done = doneValue;
                task.order = nextOrderInStatus(status, task);
            }

            section.classList.remove("drop-hover");
            renderTasks();
        });
    }

    makeDroppable(createdSection, "new", false);
    makeDroppable(inProgressSection, "inProgress", false);
    makeDroppable(endedSection, "done", true);

    function renderTasks() {
        ensureOrder();

        createdContainer.innerHTML = "";
        inProgressContainer.innerHTML = "";
        endedContainer.innerHTML = "";

        let list = tasks.filter(t => {
            if (currentFilter === "done") return t.done;
            if (currentFilter === "notDone") return !t.done;
            return true;
        });

        list = [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        if (prioritySort) {
            list.sort((a, b) => {
                const pa = priorityValue[a.priority] ?? 0;
                const pb = priorityValue[b.priority] ?? 0;
                return prioritySort === "desc" ? pb - pa : pa - pb;
            });
        }

        list.forEach(task => {
            const el = document.createElement("div");
            el.className = `task priority-${task.priority} ${task.done ? "done" : ""}`;
            el.dataset.id = task.id;
            el.draggable = true;

            const isNew = task.status === "new";
            const isDone = task.status === "done";
            const isInProgress = task.status === "inProgress";

            let moveButtonsHTML = "";

            if (isNew) {
                moveButtonsHTML = `
                    <button class="task-btn move-forward" title="Вперёд">
                        <img src="../static/pictures/ArrowRight.webp" alt="Forward">
                    </button>
                `;
            } else if (isDone) {
                moveButtonsHTML = `
                    <button class="task-btn move-back" title="Назад">
                        <img src="../static/pictures/ArrowLeft.webp" alt="Back">
                    </button>
                `;
            } else if (isInProgress) {
                moveButtonsHTML = `
                    <button class="task-btn move-back" title="Назад">
                        <img src="../static/pictures/ArrowLeft.webp" alt="Back">
                    </button>
                    <button class="task-btn move-forward" title="Вперёд">
                        <img src="../static/pictures/ArrowRight.webp" alt="Forward">
                    </button>
                `;
            }

            el.innerHTML = `
                <div class="task-main">
                    <textarea class="task-text" readonly>${task.text}</textarea>
                    <div class="task-meta">
                        <span class="badge status-${task.status}">${statusTextMap[task.status]}</span>
                        <span class="badge priority-${task.priority}">Приоритет: ${priorityTextMap[task.priority]}</span>
                    </div>
                </div>
                <div class="task-buttons">
                    ${moveButtonsHTML}
                    <button class="task-btn edit">
                        <img src="../static/pictures/Pen.webp" alt="Edit">
                    </button>
                    <button class="task-btn delete">
                        <img src="../static/pictures/Trashcan.webp" alt="Delete">
                    </button>
                </div>
            `;

            el.addEventListener("dragstart", (e) => {
                if (e.target.closest("textarea") || e.target.closest("button")) {
                    e.preventDefault();
                    return;
                }
                const ta = el.querySelector(".task-text");
                if (ta && !ta.readOnly) {
                    e.preventDefault();
                    return;
                }
                el.classList.add("dragging");
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", el.dataset.id);
                clearDropHover();
            });

            el.addEventListener("dragend", () => {
                el.classList.remove("dragging");
                clearDropHover();
            });

            const textarea = el.querySelector(".task-text");
            containerFromStatus(task.status).appendChild(el);
            requestAnimationFrame(() => autoResize(textarea));
        });

        save();
    }

    function addTask() {
        const text = input.value.trim();
        if (!text) return;

        const status = statusSelect.value;

        tasks.push({
            id: Date.now(),
            text,
            status,
            priority: prioritySelect.value,
            done: status === "done",
            order: nextOrderInStatus(status)
        });

        input.value = "";
        renderTasks();
    }

    addBtn.onclick = addTask;
    input.onkeydown = (e) => { if (e.key === "Enter") addTask(); };

    taskList.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;

        const taskEl = btn.closest(".task");
        if (!taskEl) return;

        const task = getTaskById(taskEl.dataset.id);
        if (!task) return;

        if (btn.classList.contains("delete")) {
            tasks = tasks.filter(t => t !== task);
            renderTasks();
            return;
        }

        if (btn.classList.contains("move-back")) {
            if (task.status === "inProgress") task.status = "new";
            else if (task.status === "done") task.status = "inProgress";
            task.done = false;
            task.order = nextOrderInStatus(task.status, task);
            renderTasks();
            return;
        }

        if (btn.classList.contains("move-forward")) {
            if (task.status === "new") task.status = "inProgress";
            else if (task.status === "inProgress") { task.status = "done"; task.done = true; }
            task.order = nextOrderInStatus(task.status, task);
            renderTasks();
            return;
        }

        if (btn.classList.contains("edit")) {
            const ta = taskEl.querySelector(".task-text");
            if (!ta) return;

            ta.readOnly = false;
            taskEl.draggable = false;
            ta.focus();
            autoResize(ta);
            ta.oninput = () => autoResize(ta);

            ta.onblur = () => {
                task.text = ta.value.trim();
                ta.readOnly = true;
                taskEl.draggable = true;
                renderTasks();
            };
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
            if (prioritySort === null) prioritySort = "desc";
            else if (prioritySort === "desc") prioritySort = "asc";
            else prioritySort = null;
            renderTasks();
        });
    }

    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
        try {
            const parsed = JSON.parse(savedTasks);
            if (Array.isArray(parsed)) tasks = parsed;
        } catch (e) {
            tasks = [];
        }
    }

    renderTasks();
});
