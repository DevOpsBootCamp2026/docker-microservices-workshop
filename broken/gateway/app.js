// The browser only ever calls "/api/...". The gateway decides which service
// answers. The frontend has no idea the two services exist separately.
async function loadUsers() {
  const res = await fetch("/api/users");
  const data = await res.json();
  document.getElementById("users-src").textContent = "(" + data.source + ")";
  document.getElementById("users").innerHTML = data.users
    .map((u) => `<li><b>${esc(u.name)}</b> ${u.email ? "· " + esc(u.email) : ""}</li>`)
    .join("") || "<li class='empty'>no users yet</li>";
}

async function loadTasks() {
  const res = await fetch("/api/tasks");
  const data = await res.json();
  document.getElementById("tasks-src").textContent = "(" + data.source + ")";
  document.getElementById("tasks").innerHTML = data.tasks
    .map((t) => `<li>${esc(t.title)}</li>`)
    .join("") || "<li class='empty'>no tasks yet</li>";
}

document.getElementById("user-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("u-name").value.trim(),
      email: document.getElementById("u-email").value.trim(),
    }),
  });
  e.target.reset();
  loadUsers();
});

document.getElementById("task-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: document.getElementById("t-title").value.trim() }),
  });
  e.target.reset();
  loadTasks();
});

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}

loadUsers();
loadTasks();
