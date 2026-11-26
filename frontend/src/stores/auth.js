import { defineStore } from "pinia"
import { ref, computed } from "vue"
import api from "@/api/client"

const TOKEN_KEY = "novashop_token"

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem(TOKEN_KEY))
  const member = ref(null)

  const isLoggedIn = computed(() => Boolean(token.value))
  const isAdmin = computed(() => member.value?.role === "admin")

  function saveSession(data) {
    token.value = data.token
    member.value = data.member
    localStorage.setItem(TOKEN_KEY, data.token)
  }

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password })
    saveSession(data)
  }

  async function register(name, email, password) {
    const { data } = await api.post("/auth/register", { name, email, password })
    saveSession(data)
  }

  // Called once when the app starts: if we have a saved token, load the member
  async function restore() {
    if (!token.value) return
    try {
      const { data } = await api.get("/auth/me")
      member.value = data
    } catch {
      logout()
    }
  }

  async function updateName(name) {
    const { data } = await api.patch("/auth/me", { name })
    member.value = data
  }

  async function uploadAvatar(file) {
    const form = new FormData()
    form.append("image", file)
    const { data } = await api.post("/auth/me/avatar", form)
    member.value = data
  }

  function logout() {
    token.value = null
    member.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  return { token, member, isLoggedIn, isAdmin, login, register, restore, updateName, uploadAvatar, logout }
})
