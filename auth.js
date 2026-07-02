// =====================================================
// auth.js
// Campus Lost & Found System
// =====================================================

import { supabase } from './supabaseClient.js'

// --------------------
// DOM Elements
// --------------------
const loginForm = document.getElementById('login-form')
const signupForm = document.getElementById('signup-form')
const forgotForm = document.getElementById('forgot-form')

const loginTab = document.getElementById('tab-login')
const signupTab = document.getElementById('tab-signup')

const forgotBtn = document.getElementById('forgot-btn')
const backBtn = document.getElementById('back-to-login')

const messageBox = document.getElementById('message')

// --------------------
// Helper Functions
// --------------------

function showMessage(text, type = 'success') {
  if (!messageBox) return

  messageBox.textContent = text
  messageBox.className = type
  messageBox.style.display = 'block'
}

function clearMessage() {
  if (!messageBox) return
  messageBox.style.display = 'none'
}

function showLogin() {
  loginForm?.classList.remove('hidden')
  signupForm?.classList.add('hidden')
  forgotForm?.classList.add('hidden')

  loginTab?.classList.add('active')
  signupTab?.classList.remove('active')

  clearMessage()
}

function showSignup() {
  loginForm?.classList.add('hidden')
  signupForm?.classList.remove('hidden')
  forgotForm?.classList.add('hidden')

  loginTab?.classList.remove('active')
  signupTab?.classList.add('active')

  clearMessage()
}

function showForgot() {
  loginForm?.classList.add('hidden')
  signupForm?.classList.add('hidden')
  forgotForm?.classList.remove('hidden')

  loginTab?.classList.remove('active')
  signupTab?.classList.remove('active')

  clearMessage()
}

// --------------------
// Tab Events
// --------------------

loginTab?.addEventListener('click', showLogin)
signupTab?.addEventListener('click', showSignup)

forgotBtn?.addEventListener('click', showForgot)

backBtn?.addEventListener('click', showLogin)

// --------------------
// Sign Up
// --------------------

signupForm?.addEventListener('submit', async (e) => {

  e.preventDefault()

  clearMessage()

  const full_name = document.getElementById('full_name').value.trim()
  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value

  if (password.length < 6) {
    showMessage('Password must be at least 6 characters.', 'error')
    return
  }

  try {

    const { error } = await supabase.auth.signUp({

      email,
      password,

      options: {
        data: {
          full_name
        }
      }

    })

    if (error) {
      showMessage(error.message, 'error')
      return
    }

    showMessage(
      'Account created successfully. Please check your email before logging in.',
      'success'
    )

    signupForm.reset()
    showLogin()

  } catch (err) {
    console.error(err)
    showMessage(err.message || 'Signup failed.', 'error')
  }

})

// --------------------
// Login
// --------------------

loginForm?.addEventListener('submit', async (e) => {

  e.preventDefault()

  clearMessage()

  const email = document.getElementById('login_email').value.trim()
  const password = document.getElementById('login_password').value

  try {

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      showMessage(error.message, 'error')
      return
    }

    const {
      data: { user }
    } = await supabase.auth.getUser()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin') {
      window.location.href = 'admin.html'
    } else {
      window.location.href = 'lost.html'
    }

  } catch (err) {
    console.error(err)
    showMessage(err.message || 'Login failed.', 'error')
  }

})

// --------------------
// Forgot Password
// --------------------

forgotForm?.addEventListener('submit', async (e) => {

  e.preventDefault()

  clearMessage()

  const email = document.getElementById('forgot_email').value.trim()

  try {

    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo:
          window.location.origin + '/index.html'
      }
    )

    if (error) {
      showMessage(error.message, 'error')
      return
    }

    showMessage(
      'Password reset email sent successfully.',
      'success'
    )

    forgotForm.reset()

  } catch (err) {
    console.error(err)
    showMessage(err.message || 'Unable to send reset email.', 'error')
  }

})

// --------------------
// Existing Session
// --------------------

async function checkSession() {

  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role === 'admin') {
    window.location.href = 'admin.html'
  } else {
    window.location.href = 'lost.html'
  }

}

checkSession()