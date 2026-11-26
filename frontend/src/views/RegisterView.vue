<script setup>
import { reactive, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import { useToastStore } from "@/stores/toast"
import { errorMessage } from "@/api/client"

const auth = useAuthStore()
const toast = useToastStore()
const route = useRoute()
const router = useRouter()

const form = reactive({ name: "", email: "", password: "", confirm: "" })
const loading = ref(false)
const error = ref("")

async function submit() {
  error.value = ""
  if (form.password.length < 8) return (error.value = "Password must be at least 8 characters")
  if (form.password !== form.confirm) return (error.value = "Passwords do not match")

  loading.value = true
  try {
    await auth.register(form.name, form.email, form.password)
    toast.success("Account created. Welcome to NovaShop!")
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
          <h1>Create account</h1>
          <p class="muted">It takes less than a minute.</p>
        </div>
        <div class="field">
          <label for="name">Name</label>
          <input id="name" v-model.trim="form.name" class="input" required autocomplete="name" />
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model.trim="form.email" type="email" class="input" required autocomplete="email" />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input id="password" v-model="form.password" type="password" class="input" required minlength="8" autocomplete="new-password" />
          <span class="small muted">At least 8 characters</span>
        </div>
        <div class="field">
          <label for="confirm">Confirm password</label>
          <input id="confirm" v-model="form.confirm" type="password" class="input" required autocomplete="new-password" />
        </div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <button class="btn btn-primary btn-lg btn-block" :disabled="loading">
          <span v-if="loading" class="spinner"></span> Create account
        </button>
        <p class="small muted center">
          Already have an account? <RouterLink :to="{ name: 'login', query: route.query }">Log in</RouterLink>
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
