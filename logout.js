// =====================================================
// logout.js
// Campus Lost & Found System
// Handles user logout on all protected pages
// =====================================================

import { supabase } from './supabaseClient.js'

export function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn')

  // If the page has no logout button, exit quietly.
  if (!logoutBtn) return

  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault()

    const confirmed = confirm('Are you sure you want to log out?')
    if (!confirmed) return

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        alert('Logout failed: ' + error.message)
        return
      }

      // Clear browser history so Back button won't reopen protected pages
      window.location.replace('index.html')

    } catch (err) {
      console.error(err)
      alert('An unexpected error occurred while logging out.')
    }
  })
}

// Optional session checker
export async function requireLogin() {
  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session) {
    window.location.replace('index.html')
    return null
  }

  return session.user
}