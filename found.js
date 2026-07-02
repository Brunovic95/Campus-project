// =====================================================
// found.js
// Campus Lost & Found System
// Part 1 - Authentication & Initialization
// =====================================================

import { supabase } from './supabaseClient.js'
import { setupLogout } from './logout.js'

let currentUser = null
let currentProfile = null
let allFoundItems = []

// Enable logout
setupLogout()

// -------------------------
// Initialize Page
// -------------------------
async function init() {

    // Check authentication
    const {
        data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
        window.location.replace('index.html')
        return
    }

    currentUser = user

    // Load profile
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

    if (error) {
        alert(error.message)
        return
    }

    currentProfile = profile

    // Welcome message
    const welcome = document.getElementById('welcome-user')

    if (welcome) {
        welcome.textContent = `Hi, ${profile.full_name}`
    }

    // Show admin link
    if (profile.role === 'admin') {
        const admin = document.getElementById('admin-link')
        if (admin) admin.style.display = 'inline'
    }

    setupSearch()

    await loadFoundItems()
}

init()

// -------------------------
// Search & Filter Events
// -------------------------
function setupSearch() {

    const search = document.getElementById('search')
    const filter = document.getElementById('status-filter')

    if (search) {
        search.addEventListener('input', filterItems)
    }

    if (filter) {
        filter.addEventListener('change', filterItems)
    }
}

// -------------------------
// Load Found Items
// -------------------------
async function loadFoundItems() {

    document.getElementById('loading-message').style.display = 'block'
    document.getElementById('found-list').style.display = 'none'
    document.getElementById('empty-message').style.display = 'none'

    const { data, error } = await supabase
        .from('found_items')
        .select('*')
        .order('created_at', { ascending: false })

    document.getElementById('loading-message').style.display = 'none'

    if (error) {
        alert(error.message)
        return
    }

    allFoundItems = data || []

    filterItems()
}
// -------------------------
// Filter Items
// -------------------------
function filterItems() {

    const searchText = document
        .getElementById('search')
        .value
        .toLowerCase()

    const status = document
        .getElementById('status-filter')
        .value

    let filtered = allFoundItems

    // Filter by status
    if (status !== 'all') {
        filtered = filtered.filter(item => item.status === status)
    }

    // Search
    filtered = filtered.filter(item => {

        return (
            item.title.toLowerCase().includes(searchText) ||
            item.category.toLowerCase().includes(searchText) ||
            item.location_found.toLowerCase().includes(searchText) ||
            (item.description || '')
                .toLowerCase()
                .includes(searchText)
        )

    })

    displayFoundItems(filtered)

}

// -------------------------
// Display Items
// -------------------------
function displayFoundItems(items) {

    const list = document.getElementById('found-list')
    const empty = document.getElementById('empty-message')

    list.innerHTML = ''

    if (items.length === 0) {

        list.style.display = 'none'
        empty.style.display = 'block'
        return

    }

    empty.style.display = 'none'
    list.style.display = 'block'

    items.forEach(item => {

        const canDelete =
            currentUser &&
            (
                currentUser.id === item.finder_id ||
                currentProfile.role === 'admin'
            )

        let badge = "status-open"

        if (item.status === "claimed") {
            badge = "status-claimed"
        }

        if (item.status === "resolved") {
            badge = "status-resolved"
        }

        list.innerHTML += `

        <div class="item-card">

            <h4>${item.title}</h4>

            <p>
                <strong>Category:</strong>
                ${item.category}
            </p>

            <p>
                <strong>Location Found:</strong>
                ${item.location_found}
            </p>

            <p>
                ${item.description || 'No description provided.'}
            </p>

            <p>

                <strong>Status:</strong>

                <span class="${badge}">
                    ${item.status}
                </span>

            </p>

            ${
                item.storage_location
                ? `
                <p>
                    <strong>Storage:</strong>
                    ${item.storage_location}
                </p>
                `
                : ''
            }

            ${
                canDelete
                ? `
                <button
                    onclick="deleteFound(${item.id})"
                    style="
                        margin-top:12px;
                        background:#ef4444;
                        color:white;
                        border:none;
                        padding:8px 14px;
                        border-radius:5px;
                        cursor:pointer;
                    ">
                    Delete
                </button>
                `
                : ''
            }

        </div>

        `

    })

}
// -------------------------
// Submit Found Item
// -------------------------
document
    .getElementById('found-form')
    .addEventListener('submit', async (e) => {

        e.preventDefault()

        const title = document.getElementById('title').value.trim()
        const category = document.getElementById('category').value.trim()
        const location_found = document.getElementById('location_found').value.trim()
        const description = document.getElementById('description').value.trim()

        if (!title || !category || !location_found) {
            alert('Please fill in all required fields.')
            return
        }

        const { error } = await supabase
            .from('found_items')
            .insert([
                {
                    finder_id: currentUser.id,
                    title,
                    category,
                    location_found,
                    description
                }
            ])

        if (error) {
            alert(error.message)
            return
        }

        alert('Found item reported successfully.')

        document.getElementById('found-form').reset()

        await loadFoundItems()

    })

// -------------------------
// Delete Found Item
// -------------------------
window.deleteFound = async function (id) {

    if (!confirm('Delete this found item?')) return

    const { error } = await supabase
        .from('found_items')
        .delete()
        .eq('id', id)

    if (error) {
        alert(error.message)
        return
    }

    await loadFoundItems()

}

// -------------------------
// Auth State Listener
// -------------------------
supabase.auth.onAuthStateChange((event) => {

    if (event === 'SIGNED_OUT') {
        window.location.replace('index.html')
    }

})