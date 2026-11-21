
// ==========================================
// JOBTRACK - CAREER MANAGEMENT APPLICATION
// ==========================================

// Storage keys
const APP_KEY = "jobtrack_applications_v1";
const NOTE_KEY = "jobtrack_notes_v1";

// Application data
let applications = JSON.parse(localStorage.getItem(APP_KEY) || "[]");
let notes = JSON.parse(localStorage.getItem(NOTE_KEY) || "[]");

const statuses = [
    "Saved",
    "Applied",
    "Interviewing",
    "Offered",
    "Rejected"
];

// ==========================================
// STORAGE FUNCTIONS
// ==========================================

function saveApplications() {
    localStorage.setItem(APP_KEY, JSON.stringify(applications));
}

function saveNotes() {
    localStorage.setItem(NOTE_KEY, JSON.stringify(notes));
}

// Generate unique IDs
function generateId() {
    return Date.now().toString(36) +
        Math.random().toString(36).substring(2, 9);
}

// Escape user-entered text before displaying it
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Validate and display application links safely
function safeURL(value) {
    try {
        const url = new URL(value);
        if (url.protocol === "http:" || url.protocol === "https:") {
            return url.href;
        }
    } catch (error) {
        // Invalid URL
    }
    return "";
}

// ==========================================
// APPLICATION MODAL
// ==========================================

const modal = document.getElementById("applicationModal");
const applicationForm = document.getElementById("applicationForm");

function openApplicationModal(id = null) {

    applicationForm.reset();

    document.getElementById("applicationId").value = "";

    document.getElementById("modalTitle").textContent =
        id ? "Edit Job Application" : "Add Job Application";

    if (id) {
        const app = applications.find(item => item.id === id);

        if (!app) return;

        document.getElementById("applicationId").value = app.id;
        document.getElementById("companyName").value = app.company;
        document.getElementById("jobTitle").value = app.title;
        document.getElementById("applicationDate").value = app.date;
        document.getElementById("jobLocation").value = app.location;
        document.getElementById("applicationStatus").value = app.status;
        document.getElementById("applicationLink").value = app.link;
        document.getElementById("jobDescription").value = app.description;
    } else {
        document.getElementById("applicationDate").value =
            new Date().toLocaleDateString("en-CA");
    }

    modal.classList.add("show");
}

function closeApplicationModal() {
    modal.classList.remove("show");
}

modal.addEventListener("click", function(event) {
    if (event.target === modal) {
        closeApplicationModal();
    }
});

// ==========================================
// ADD AND EDIT APPLICATIONS
// ==========================================

applicationForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const id = document.getElementById("applicationId").value;

    const company = document.getElementById("companyName").value.trim();
    const title = document.getElementById("jobTitle").value.trim();
    const date = document.getElementById("applicationDate").value;
    const location = document.getElementById("jobLocation").value.trim();
    const status = document.getElementById("applicationStatus").value;
    const link = document.getElementById("applicationLink").value.trim();
    const description = document.getElementById("jobDescription").value.trim();

    if (!company || !title || !date) {
        alert("Please complete all required fields.");
        return;
    }

    if (date > new Date().toLocaleDateString("en-CA")) {
        alert("Application date cannot be in the future.");
        return;
    }

    if (link && !safeURL(link)) {
        alert("Please enter a valid HTTP or HTTPS application link.");
        return;
    }

    const applicationData = {
        company,
        title,
        date,
        location,
        status,
        link,
        description
    };

    if (id) {

        const index = applications.findIndex(item => item.id === id);

        if (index !== -1) {
            applications[index] = {
                ...applications[index],
                ...applicationData
            };
        }

    } else {

        applications.push({
            id: generateId(),
            ...applicationData,
            createdAt: new Date().toISOString()
        });

    }

    saveApplications();
    closeApplicationModal();
    refreshDashboard();

});

// ==========================================
// DELETE APPLICATION
// ==========================================

function deleteApplication(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this application?"
    );

    if (!confirmed) return;

    applications = applications.filter(item => item.id !== id);

    saveApplications();
    refreshDashboard();
}

// ==========================================
// CHANGE APPLICATION STATUS
// ==========================================

function updateStatus(id, newStatus) {

    if (!statuses.includes(newStatus)) return;

    const app = applications.find(item => item.id === id);

    if (!app) return;

    app.status = newStatus;

    saveApplications();
    refreshDashboard();
}

// ==========================================
// DASHBOARD STATISTICS
// ==========================================

function updateStatistics() {

    const total = applications.length;

    const interviews = applications.filter(
        app => app.status === "Interviewing"
    ).length;

    const offers = applications.filter(
        app => app.status === "Offered"
    ).length;

    const rejected = applications.filter(
        app => app.status === "Rejected"
    ).length;

    document.getElementById("totalApplications").textContent = total;

    document.getElementById("totalInterviews").textContent = interviews;

    document.getElementById("totalOffers").textContent = offers;

    document.getElementById("totalRejected").textContent = rejected;

}

// ==========================================
// STATUS PIPELINE
// ==========================================

function renderDashboardPipeline() {

    const container = document.getElementById("dashboardPipeline");

    container.innerHTML = statuses.map(status => {

        const count = applications.filter(
            app => app.status === status
        ).length;

        return `
            <div class="pipeline-item">
                <h3>${count}</h3>
                <p>${status}</p>
            </div>
        `;

    }).join("");

}

// ==========================================
// APPLICATION TABLE
// ==========================================

function renderApplications() {

    const container = document.getElementById("applicationsTable");

    const search = document.getElementById("searchInput")
        .value.toLowerCase().trim();

    const filter = document.getElementById("statusFilter").value;

    const sort = document.getElementById("sortFilter").value;

    let filtered = applications.filter(app => {

        const matchesSearch =
            app.company.toLowerCase().includes(search) ||
            app.title.toLowerCase().includes(search) ||
            app.location.toLowerCase().includes(search);

        const matchesStatus =
            filter === "All" || app.status === filter;

        return matchesSearch && matchesStatus;

    });

    if (sort === "newest") {
        filtered.sort((a, b) => b.date.localeCompare(a.date));
    }

    if (sort === "oldest") {
        filtered.sort((a, b) => a.date.localeCompare(b.date));
    }

    if (sort === "company") {
        filtered.sort((a, b) =>
            a.company.localeCompare(b.company)
        );
    }

    document.getElementById("emptyApplications").style.display =
        filtered.length === 0 ? "block" : "none";

    container.innerHTML = filtered.map(app => {

        const link = safeURL(app.link);

        return `
            <tr>
                <td>
                    <div class="company-name">
                        ${escapeHTML(app.company)}
                    </div>
                </td>

                <td>
                    ${escapeHTML(app.title)}
                    ${link ? `
                        <br>
                        <a href="${escapeHTML(link)}"
                           target="_blank"
                           rel="noopener noreferrer">
                           <small>Application link ↗</small>
                        </a>
                    ` : ""}
                </td>

                <td>${escapeHTML(app.location || "Not specified")}</td>

                <td>${escapeHTML(app.date)}</td>

                <td>
                    <span class="status status-${app.status}">
                        ${app.status}
                    </span>
                </td>

                <td>
                    <button class="action-btn edit-btn"
                        onclick="openApplicationModal('${app.id}')">
                        Edit
                    </button>

                    <button class="action-btn delete-btn"
                        onclick="deleteApplication('${app.id}')">
                        Delete
                    </button>
                </td>
            </tr>
        `;

    }).join("");

}

// Search and filter event listeners

document.getElementById("searchInput")
    .addEventListener("input", renderApplications);

document.getElementById("statusFilter")
    .addEventListener("change", renderApplications);

document.getElementById("sortFilter")
    .addEventListener("change", renderApplications);

// ==========================================
// RECENT APPLICATIONS
// ==========================================

function renderRecentApplications() {

    const container = document.getElementById("recentApplications");

    const recent = [...applications]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5);

    container.innerHTML = recent.map(app => `

        <tr>
            <td class="company-name">
                ${escapeHTML(app.company)}
            </td>

            <td>${escapeHTML(app.title)}</td>

            <td>${escapeHTML(app.date)}</td>

            <td>
                <span class="status status-${app.status}">
                    ${app.status}
                </span>
            </td>
        </tr>

    `).join("");

}

// ==========================================
// FULL RECRUITMENT PIPELINE
// ==========================================

function renderFullPipeline() {

    const container = document.getElementById("fullPipeline");

    container.innerHTML = statuses.map(status => {

        const jobs = applications.filter(
            app => app.status === status
        );

        return `
            <div class="pipeline-column">

                <h3>
                    ${status}
                    <span>${jobs.length}</span>
                </h3>

                ${jobs.length === 0
                    ? `<div class="empty-column">No applications</div>`
                    : jobs.map(app => `

                        <div class="pipeline-job">

                            <h4>${escapeHTML(app.title)}</h4>

                            <p>
                                ${escapeHTML(app.company)}
                                <br>
                                ${escapeHTML(app.location || "Location not specified")}
                                <br>
                                Applied: ${escapeHTML(app.date)}
                            </p>

                            <button onclick="advanceApplication('${app.id}')">
                                Update Status →
                            </button>

                        </div>

                    `).join("")
                }

            </div>
        `;

    }).join("");

}

// Advance applications to the next pipeline stage
// Rejected and Offered applications are terminal stages.

function advanceApplication(id) {

    const app = applications.find(item => item.id === id);

    if (!app) return;

    const currentIndex = statuses.indexOf(app.status);

    if (currentIndex === -1 ||
        app.status === "Offered" ||
        app.status === "Rejected") {

        alert("This application has reached a final status.");
        return;
    }

    const nextStatus = statuses[currentIndex + 1];

    const confirmed = confirm(
        `Move ${app.company} - ${app.title} to ${nextStatus}?`
    );

    if (confirmed) {
        updateStatus(id, nextStatus);
    }

}

// ==========================================
// CAREER NOTES
// ==========================================

const noteForm = document.getElementById("noteForm");

noteForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const title = document.getElementById("noteTitle").value.trim();

    const company = document.getElementById("noteCompany").value.trim();

    const category = document.getElementById("noteCategory").value;

    const date = document.getElementById("noteDate").value;

    const details = document.getElementById("noteDetails").value.trim();

    if (!title || !details) {
        alert("Please enter a note title and details.");
        return;
    }

    notes.push({
        id: generateId(),
        title,
        company,
        category,
        date,
        details,
        createdAt: new Date().toISOString()
    });

    saveNotes();

    noteForm.reset();

    renderNotes();

    alert("Career note saved successfully!");

});

// ==========================================
// DISPLAY NOTES
// ==========================================

function renderNotes() {

    const container = document.getElementById("notesList");

    document.getElementById("notesCount").textContent =
        `${notes.length} notes`;

    const sortedNotes = [...notes].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
    );

    if (sortedNotes.length === 0) {

        container.innerHTML = `
            <div class="empty-state" style="display:block">
                <div>📝</div>
                <h3>No career notes yet</h3>
                <p>Your saved notes will appear here.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = sortedNotes.map(note => {

        const overdue = note.date &&
            note.date < new Date().toLocaleDateString("en-CA");

        return `

            <div class="note-card">

                <h4>${escapeHTML(note.title)}</h4>

                <div class="note-meta">
                    ${escapeHTML(note.category)}
                    ${note.company
                        ? " | " + escapeHTML(note.company)
                        : ""}
                </div>

                <p>${escapeHTML(note.details)}</p>

                ${note.date ? `
                    <div class="note-meta">
                        Reminder: ${escapeHTML(note.date)}
                        ${overdue
                            ? '<span style="color:#dc4242"> (Past due)</span>'
                            : ""}
                    </div>
                ` : ""}

                <div class="note-actions">

                    <button onclick="editNote('${note.id}')">
                        Edit Note
                    </button>

                    <button class="delete-btn"
                        onclick="deleteNote('${note.id}')">
                        Delete Note
                    </button>

                </div>

            </div>

        `;

    }).join("");

}

// ==========================================
// EDIT CAREER NOTE
// ==========================================

function editNote(id) {

    const note = notes.find(item => item.id === id);

    if (!note) return;

    const newTitle = prompt("Edit note title:", note.title);

    if (newTitle === null) return;

    const newDetails = prompt("Edit note details:", note.details);

    if (newDetails === null) return;

    if (!newTitle.trim() || !newDetails.trim()) {
        alert("Title and details cannot be empty.");
        return;
    }

    note.title = newTitle.trim();
    note.details = newDetails.trim();

    saveNotes();
    renderNotes();

}

// ==========================================
// DELETE CAREER NOTE
// ==========================================

function deleteNote(id) {

    const confirmed = confirm("Delete this career note?");

    if (!confirmed) return;

    notes = notes.filter(note => note.id !== id);

    saveNotes();
    renderNotes();

}

// ==========================================
// REFRESH APPLICATION
// ==========================================

function refreshDashboard() {

    updateStatistics();

    renderDashboardPipeline();

    renderRecentApplications();

    renderApplications();

    renderFullPipeline();

}

// ==========================================
// NAVIGATION
// ==========================================

function activateNavigation() {

    const links = document.querySelectorAll(".nav-link");

    links.forEach(link => {

        link.addEventListener("click", function() {

            links.forEach(item => item.classList.remove("active"));

            this.classList.add("active");

        });

    });

}

// Update active navigation when browser back/forward is used
window.addEventListener("hashchange", function() {

    const current = location.hash || "#dashboard";

    document.querySelectorAll(".nav-link").forEach(link => {

        link.classList.toggle(
            "active",
            link.getAttribute("href") === current
        );

    });

});

// ==========================================
// APPLICATION INITIALIZATION
// ==========================================

function initializeJobTrack() {

    refreshDashboard();

    renderNotes();

    activateNavigation();

}

initializeJobTrack();
