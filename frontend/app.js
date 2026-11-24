const $ = id => document.getElementById(id);
const state = { token: localStorage.getItem("tf_token"), user: JSON.parse(localStorage.getItem("tf_user") || "null"), tasks: [], view: "all", mode: "login" };
const api = async (url, options = {}) => {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(`/api${url}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && state.token) logout(false);
    throw new Error(data.message || "Something went wrong.");
  }
  return data;
};
let toastTimer;
function toast(message) {
  $("toast").textContent = message; $("toast").classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2600);
}
function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll(".auth-tab").forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
  $("nameWrap").classList.toggle("hidden", mode !== "register");
  $("authTitle").textContent = mode === "login" ? "Welcome back" : "Create your account";
  $("authSubtitle").textContent = mode === "login" ? "Enter your details to continue." : "A better way to organize your day.";
  $("authSubmit").innerHTML = mode === "login" ? 'Log in <span>→</span>' : 'Create account <span>→</span>';
  $("password").autocomplete = mode === "login" ? "current-password" : "new-password";
}
document.querySelectorAll(".auth-tab").forEach(b => b.addEventListener("click", () => setMode(b.dataset.mode)));
$("authForm").addEventListener("submit", async e => {
  e.preventDefault();
  const mode = state.mode;
  const payload = { email: $("email").value.trim(), password: $("password").value };
  if (mode === "register") payload.name = $("name").value.trim();
  try {
    const result = await api(`/auth/${mode === "login" ? "login" : "register"}`, { method: "POST", body: JSON.stringify(payload) });
    state.token = result.token; state.user = result.user;
    localStorage.setItem("tf_token", state.token); localStorage.setItem("tf_user", JSON.stringify(state.user));
    await enterApp();
  } catch (err) { toast(err.message); }
});
async function enterApp() {
  if (!state.token || !state.user) { showAuth(); return; }
  $("authScreen").classList.add("hidden"); $("appScreen").classList.remove("hidden");
  const name = state.user.name || "User";
  $("sideName").textContent = name; $("topName").textContent = name;
  $("sideEmail").textContent = state.user.email || "";
  $("avatar").textContent = $("topAvatar").textContent = name.charAt(0).toUpperCase();
  const hour = new Date().getHours();
  $("greeting").textContent = `${hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"}, ${name.split(" ")[0]}`;
  $("todayLabel").textContent = new Date().toLocaleDateString(undefined, { weekday:"long", month:"long", day:"numeric" }).toUpperCase();
  try { state.tasks = await api("/tasks"); render(); }
  catch (err) { toast(err.message); }
}
function showAuth() { $("appScreen").classList.add("hidden"); $("authScreen").classList.remove("hidden"); }
function logout(showMessage = true) {
  state.token = null; state.user = null; state.tasks = [];
  localStorage.removeItem("tf_token"); localStorage.removeItem("tf_user"); showAuth();
  if (showMessage) toast("You have been logged out.");
}
$("logoutBtn").addEventListener("click", () => logout());
document.querySelectorAll(".nav-link").forEach(b => b.addEventListener("click", () => {
  state.view = b.dataset.view;
  document.querySelectorAll(".nav-link").forEach(x => x.classList.toggle("active", x === b));
  const titles = { all:["Overview","Here’s what’s happening with your tasks."], Pending:["My tasks","Your tasks waiting to be done."], "In Progress":["In progress","Keep the momentum going."], Completed:["Completed","Look at everything you have achieved."] };
  $("viewTitle").textContent = titles[state.view][0]; $("viewDescription").textContent = titles[state.view][1]; render();
}));
$("addTaskBtn").addEventListener("click", () => openModal());
$("emptyAddBtn").addEventListener("click", () => openModal());
["searchInput","priorityFilter","statusFilter"].forEach(id => $(id).addEventListener(id === "searchInput" ? "input" : "change", render));
$("themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark"); localStorage.setItem("tf_dark", document.body.classList.contains("dark") ? "1" : "0");
  $("themeBtn").textContent = document.body.classList.contains("dark") ? "☀" : "☾";
});
if (localStorage.getItem("tf_dark") === "1") { document.body.classList.add("dark"); $("themeBtn").textContent = "☀"; }
function isOverdue(task) { return task.dueDate && new Date(task.dueDate) < new Date(new Date().toDateString()) && task.status !== "Completed"; }
function render() {
  const tasks = state.tasks;
  const completed = tasks.filter(t => t.status === "Completed").length;
  const inProgress = tasks.filter(t => t.status === "In Progress").length;
  const overdue = tasks.filter(isOverdue).length;
  const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  $("totalStat").textContent = tasks.length; $("progressStat").textContent = inProgress;
  $("completedStat").textContent = completed; $("overdueStat").textContent = overdue;
  $("progressPercent").textContent = `${percent}%`; $("progressBar").style.width = `${percent}%`;
  const search = $("searchInput").value.toLowerCase();
  const priority = $("priorityFilter").value, status = $("statusFilter").value;
  let filtered = tasks.filter(t => (state.view === "all" || t.status === state.view) &&
    (!priority || t.priority === priority) && (!status || t.status === status) &&
    (`${t.title} ${t.description}`.toLowerCase().includes(search)));
  $("listTitle").textContent = state.view === "all" ? "Your tasks" : state.view;
  $("taskList").innerHTML = filtered.map(t => {
    const due = t.dueDate ? new Date(t.dueDate).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}) : "";
    return `<article class="task-row"><div class="task-main"><button class="check-btn ${t.status==="Completed"?"done":""}" data-action="toggle" data-id="${t._id}" title="Mark complete">${t.status==="Completed"?"✓":""}</button><div><div class="task-title ${t.status==="Completed"?"done":""}">${escapeHtml(t.title)}</div>${t.description?`<div class="task-desc">${escapeHtml(t.description)}</div>`:""}<div class="task-meta"><span class="tag ${t.priority}">${t.priority} priority</span><span class="tag status">${t.status}</span>${due?`<span class="tag ${isOverdue(t)?"overdue":""}">◷ ${due}${isOverdue(t)?" · Overdue":""}</span>`:""}</div></div></div><div class="task-actions"><button class="small-btn" data-action="edit" data-id="${t._id}">Edit</button><button class="small-btn" data-action="delete" data-id="${t._id}">Delete</button></div></article>`;
  }).join("");
  $("emptyState").classList.toggle("hidden", filtered.length > 0);
  $("taskList").classList.toggle("hidden", filtered.length === 0);
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }
function openModal(task = null) {
  $("taskForm").reset(); $("taskId").value = task?._id || "";
  $("modalTitle").textContent = task ? "Edit task" : "Create a task";
  $("taskTitle").value = task?.title || ""; $("taskDescription").value = task?.description || "";
  $("taskPriority").value = task?.priority || "Medium"; $("taskStatus").value = task?.status || "Pending";
  $("taskDue").value = task?.dueDate ? new Date(task.dueDate).toISOString().slice(0,10) : "";
  $("taskModal").classList.remove("hidden"); $("taskTitle").focus();
}
function closeModal() { $("taskModal").classList.add("hidden"); }
document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeModal));
$("taskForm").addEventListener("submit", async e => {
  e.preventDefault();
  const id = $("taskId").value;
  const payload = { title:$("taskTitle").value.trim(), description:$("taskDescription").value.trim(), priority:$("taskPriority").value, status:$("taskStatus").value, dueDate:$("taskDue").value || null };
  try {
    const saved = await api(id ? `/tasks/${id}` : "/tasks", { method:id?"PATCH":"POST", body:JSON.stringify(payload) });
    if (id) state.tasks = state.tasks.map(t => t._id === id ? saved : t); else state.tasks.unshift(saved);
    closeModal(); render(); toast(id ? "Task updated." : "Task created.");
  } catch (err) { toast(err.message); }
});
$("taskList").addEventListener("click", async e => {
  const btn = e.target.closest("[data-action]"); if (!btn) return;
  const task = state.tasks.find(t => t._id === btn.dataset.id); if (!task) return;
  try {
    if (btn.dataset.action === "edit") return openModal(task);
    if (btn.dataset.action === "delete") {
      if (!confirm(`Delete "${task.title}"?`)) return;
      await api(`/tasks/${task._id}`, { method:"DELETE" }); state.tasks = state.tasks.filter(t => t._id !== task._id); toast("Task deleted.");
    } else if (btn.dataset.action === "toggle") {
      const next = task.status === "Completed" ? "Pending" : "Completed";
      const saved = await api(`/tasks/${task._id}`, { method:"PATCH", body:JSON.stringify({ status:next }) });
      state.tasks = state.tasks.map(t => t._id === task._id ? saved : t); toast(next === "Completed" ? "Nice work — task completed!" : "Task moved to pending.");
    }
    render();
  } catch (err) { toast(err.message); }
});
if (state.token && state.user) enterApp(); else showAuth();
