<script setup>
import { ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import { useToastStore } from "@/stores/toast"
import { errorMessage } from "@/api/client"

const auth = useAuthStore()
const toast = useToastStore()
const route = useRoute()
const router = useRouter()

const email = ref("")
const password = ref("")
const loading = ref(false)
const error = ref("")

async function submit() {
  loading.value = true
  error.value = ""
  try {
    await auth.login(email.value, password.value)
    toast.success(`Welcome back, ${auth.member.name}!`)
    router.push(route.query.redirect || "/")
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container auth-page">
    <form class="card auth-card" @submit.prevent="submit">
      <div class="card-body stack">
        <div>
          <h1>Log in</h1>
          <p class="muted">Welcome back to NovaShop.</p>
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model.trim="email" type="email" class="input" required autocomplete="email" />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input id="password" v-model="password" type="password" class="input" required autocomplete="current-password" />
        </div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <button class="btn btn-primary btn-lg btn-block" :disabled="loading">
          <span v-if="loading" class="spinner"></span> Log in
        </button>
        <p class="small muted center">
          New here? <RouterLink :to="{ name: 'register', query: route.query }">Create an account</RouterLink>
        </p>
      </div>
    </form>
  </div>
</template>

<style scoped>
.auth-page {
  display: grid;
  place-items: center;
  padding-top: 56px;
}
.auth-card {
  width: 100%;
  max-width: 420px;
}
.center {
  text-align: center;
}
</style>
