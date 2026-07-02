// ======================================================
// admin.js
// Campus Lost & Found System
// Full Unified Admin Controller (Parts 1 & 2 Complete)
// ======================================================

import { supabase } from './supabaseClient.js'
import { setupLogout } from './logout.js'

let currentUser = null
let currentProfile = null
let allItems = []

// Enable logout
setupLogout()

// ----------------------------
// Initialize Admin Dashboard
// ----------------------------
async function init() {

    const {
        data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
        window.location.replace("index.html")
        return
    }

    currentUser = user

    // Verify admin privileges
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single()

    if (error) {
        alert(error.message)
        return
    }

    if (profile.role !== "admin") {
        alert("Access denied. Administrators only.")
        window.location.replace("lost.html")
        return
    }

    currentProfile = profile

    document.getElementById("welcome-user").textContent =
        `Admin: ${profile.full_name}`

    setupFilters()
    setupModalEvents()

    await loadDashboard()
}

init()

// ----------------------------
// Dashboard Loader
// ----------------------------
async function loadDashboard() {

    await loadMetrics()

    await loadFoundItems()

}

// ----------------------------
// Dashboard Counters
// ----------------------------
async function loadMetrics() {

    const { count: lostCount } = await supabase
        .from("lost_items")
        .select("*", {
            head: true,
            count: "exact"
        })
        .eq("status", "open")

    const { count: foundCount } = await supabase
        .from("found_items")
        .select("*", {
            head: true,
            count: "exact"
        })
        .eq("status", "open")

    const { count: userCount } = await supabase
        .from("profiles")
        .select("*", {
            head: true,
            count: "exact"
        })

    document.getElementById("open-lost").textContent =
        lostCount || 0

    document.getElementById("open-found").textContent =
        foundCount || 0

    document.getElementById("total-users").textContent =
        userCount || 0

}

// ----------------------------
// Search & Filter Events
// ----------------------------
function setupFilters() {

    const search = document.getElementById("search-box")
    const filter = document.getElementById("status-filter")

    if (search) {
        search.addEventListener("input", filterItems)
    }

    if (filter) {
        filter.addEventListener("change", filterItems)
    }

}

// ----------------------------
// Load Found Items from Supabase
// ----------------------------
async function loadFoundItems() {
    const loadingMessage = document.getElementById("loading-message");
    const itemsTable = document.getElementById("items-table");
    const emptyMessage = document.getElementById("empty-message");

    if (loadingMessage) loadingMessage.style.display = "block";
    if (itemsTable) itemsTable.style.display = "none";
    if (emptyMessage) emptyMessage.style.display = "none";

    const { data, error } = await supabase
        .from("found_items")
        .select("*")
        .order("created_at", { ascending: false });

    if (loadingMessage) loadingMessage.style.display = "none";

    if (error) {
        alert("Error loading found items: " + error.message);
        return;
    }

    allItems = data || [];
    renderTable(allItems);
}

// ----------------------------
// Render Table Rows dynamically
// ----------------------------
function renderTable(items) {
    const tableBody = document.getElementById("table-body");
    const itemsTable = document.getElementById("items-table");
    const emptyMessage = document.getElementById("empty-message");

    if (!tableBody) return;
    tableBody.innerHTML = "";

    if (items.length === 0) {
        if (itemsTable) itemsTable.style.display = "none";
        if (emptyMessage) emptyMessage.style.display = "block";
        return;
    }

    if (emptyMessage) emptyMessage.style.display = "none";
    if (itemsTable) itemsTable.style.display = "table";

    items.forEach(item => {
        const tr = document.createElement("tr");
        const shortId = item.id.toString().substring(0, 5);

        tr.innerHTML = `
            <td>#${shortId}</td>
            <td><strong>${escapeHTML(item.title)}</strong></td>
            <td>${escapeHTML(item.category || 'N/A')}</td>
            <td>${escapeHTML(item.location || 'N/A')}</td>
            <td><span class="status-badge state-${item.status}">${item.status.toUpperCase()}</span></td>
            <td>${escapeHTML(item.storage_location || 'Not Assigned')}</td>
            <td>
                <button class="edit-btn" data-id="${item.id}">Edit</button>
                <button class="delete-btn" data-id="${item.id}">Delete</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    attachActionListeners();
}

// ----------------------------
// Realtime Filtering Engine
// ----------------------------
function filterItems() {
    const searchVal = document.getElementById("search-box")?.value.toLowerCase() || "";
    const filterVal = document.getElementById("status-filter")?.value || "all";

    const filtered = allItems.filter(item => {
        const matchesSearch = 
            (item.title && item.title.toLowerCase().includes(searchVal)) ||
            (item.category && item.category.toLowerCase().includes(searchVal)) ||
            (item.location && item.location.toLowerCase().includes(searchVal));

        const matchesStatus = (filterVal === "all") || (item.status === filterVal);

        return matchesSearch && matchesStatus;
    });

    renderTable(filtered);
}

// ----------------------------
// Edit & Delete Event Setup
// ----------------------------
function attachActionListeners() {
    // Edit Action Trigger
    document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const itemId = btn.getAttribute("data-id");
            const item = allItems.find(i => i.id == itemId);
            if (item) {
                document.getElementById("edit-item-id").value = item.id;
                document.getElementById("edit-item-title").value = item.title;
                document.getElementById("edit-item-storage").value = item.storage_location || "";
                document.getElementById("edit-item-status").value = item.status || "open"; // Pre-populate status dropdown
                document.getElementById("edit-modal").style.display = "flex";
            }
        });
    });

    // Delete Action Trigger
    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const itemId = btn.getAttribute("data-id");
            if (confirm("Are you certain you want to delete this listing permanently?")) {
                const { error } = await supabase
                    .from("found_items")
                    .delete()
                    .eq("id", itemId);

                if (error) {
                    alert("Deletion failed: " + error.message);
                } else {
                    alert("Listing successfully removed.");
                    await loadDashboard(); // Automatic dashboard refresh
                }
            }
        });
    });
}

// ----------------------------
// Modal Setup & Event Listeners
// ----------------------------
function setupModalEvents() {
    const userModal = document.getElementById("user-modal");
    const editModal = document.getElementById("edit-modal");

    // Open User Modal
    document.getElementById("open-user-modal")?.addEventListener("click", () => {
        userModal.style.display = "flex";
    });

    // Close Modals
    document.getElementById("close-user-modal")?.addEventListener("click", () => {
        userModal.style.display = "none";
        document.getElementById("create-user-form")?.reset();
    });

    document.getElementById("close-edit-modal")?.addEventListener("click", () => {
        editModal.style.display = "none";
        document.getElementById("edit-item-form")?.reset();
    });

    // --- Form Submissions ---

    // 1. Save Changes to Item (Updated with Status Modification)
    document.getElementById("edit-item-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("edit-item-id").value;
        const updatedTitle = document.getElementById("edit-item-title").value;
        const updatedStorage = document.getElementById("edit-item-storage").value;
        const updatedStatus = document.getElementById("edit-item-status").value;

        const { error } = await supabase
            .from("found_items")
            .update({ 
                title: updatedTitle, 
                storage_location: updatedStorage,
                status: updatedStatus
            })
            .eq("id", id);

        if (error) {
            alert("Failed to update: " + error.message);
        } else {
            alert("Item updated successfully!");
            editModal.style.display = "none";
            await loadDashboard(); // Automatic dashboard refresh
        }
    });

    // 2. Admin Create New User Flow
    document.getElementById("create-user-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fullName = document.getElementById("user-fullname").value;
        const email = document.getElementById("user-email").value;
        const password = document.getElementById("user-password").value;
        const role = document.getElementById("user-role").value;

        // Register user to Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role
                }
            }
        });

        if (authError) {
            alert("Error registering auth credentials: " + authError.message);
            return;
        }

        // Insert user down into public profiles table if registration succeeds
        if (authData?.user) {
            const { error: profileError } = await supabase
                .from("profiles")
                .insert([{ 
                    id: authData.user.id, 
                    full_name: fullName, 
                    role: role 
                }]);

            if (profileError) {
                alert("Auth succeeded but Profile creation encountered an issue: " + profileError.message);
            } else {
                alert(`User account for ${fullName} successfully created!`);
                userModal.style.display = "none";
                document.getElementById("create-user-form").reset();
                await loadDashboard(); // Automatic dashboard refresh
            }
        }
    });
}

// ----------------------------
// Utility XSS Prevention Helper
// ----------------------------
function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
