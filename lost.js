// =====================================================
// lost.js
// Campus Lost & Found System
// =====================================================

import { supabase } from './supabaseClient.js'
import { setupLogout } from './logout.js'

let currentUser = null

// Enable logout
setupLogout()

// -------------------------
// Initialize Page
// -------------------------
async function init() {

    const {
        data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
        window.location.replace('index.html')
        return
    }

    currentUser = user

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

    if (error) {
        alert(error.message)
        return
    }

    document.getElementById('welcome-user').textContent =
        `Hi, ${profile.full_name}`

    if (profile.role === 'admin') {
        document.getElementById('admin-link').style.display = 'inline'
    }

    loadMyLostItems()
}

init()

// -------------------------
// Load Lost Items
// -------------------------
async function loadMyLostItems() {

    const list = document.getElementById('lost-list')

    list.innerHTML = "<p>Loading...</p>"

    const { data, error } = await supabase
        .from('lost_items')
        .select('*')
        .eq('owner_id', currentUser.id)
        .order('created_at', { ascending: false })

    if (error) {
        list.innerHTML = `<p>${error.message}</p>`
        return
    }

    if (!data || data.length === 0) {
        list.innerHTML = "<p>No lost reports found.</p>"
        return
    }

    list.innerHTML = ''

    data.forEach(item => {

        list.innerHTML += `

        <div class="item-row">

            <div>

                <h4>${item.title}</h4>

                <p><b>Category:</b> ${item.category}</p>

                <p><b>Location:</b> ${item.location_lost}</p>

                <p>${item.description || ''}</p>

                <p>
                    <b>Status:</b>

                    <span style="
                        color:
                        ${item.status === 'open'
                            ? 'green'
                            : item.status === 'claimed'
                            ? 'orange'
                            : 'red'}">

                        ${item.status}

                    </span>
                </p>

            </div>

            <div>

                <button
                    onclick="deleteLost(${item.id})"
                    class="delete-btn">

                    Delete

                </button>

            </div>

        </div>

        `
    })
}

// -------------------------
// Add Lost Item
// -------------------------
document
.getElementById('lost-form')
.addEventListener('submit', async (e) => {

    e.preventDefault()

    const title =
        document.getElementById('title').value.trim()

    const category =
        document.getElementById('category').value.trim()

    const location_lost =
        document.getElementById('location_lost').value.trim()

    const description =
        document.getElementById('description').value.trim()

    if (
        !title ||
        !category ||
        !location_lost
    ) {
        alert("Please fill all required fields.")
        return
    }

    const { error } = await supabase
        .from('lost_items')
        .insert([
            {
                owner_id: currentUser.id,
                title,
                category,
                location_lost,
                description
            }
        ])

    if (error) {
        alert(error.message)
        return
    }

    alert("Lost item submitted successfully.")

    document.getElementById('lost-form').reset()

    loadMyLostItems()
})

// -------------------------
// Delete Lost Item
// -------------------------
window.deleteLost = async function(id) {

    if (!confirm("Delete this report?")) return

    const { error } = await supabase
        .from('lost_items')
        .delete()
        .eq('id', id)

    if (error) {
        alert(error.message)
        return
    }

    loadMyLostItems()
}

// -------------------------
// Refresh when auth changes
// -------------------------
supabase.auth.onAuthStateChange((event) => {

    if (event === 'SIGNED_OUT') {
        window.location.replace('index.html')
    }

})