<script setup>
import { ref } from "vue"
import { useAuthStore } from "@/stores/auth"
import { useToastStore } from "@/stores/toast"
import { errorMessage, imageUrl } from "@/api/client"
import { date } from "@/utils/format"

const auth = useAuthStore()
const toast = useToastStore()
const name = ref(auth.member?.name || "")
const saving = ref(false)

async function saveName() {
  saving.value = true
  try {
    await auth.updateName(name.value)
    toast.success("Name updated")
  } catch (err) {
    toast.error(errorMessage(err))
  } finally {
    saving.value = false
  }
}

async function onAvatar(event) {
  const file = event.target.files[0]
  if (!file) return
  try {
    await auth.uploadAvatar(file)
    toast.success("Profile picture updated")
  } catch (err) {
    toast.error(errorMessage(err))
  }
}
</script>

<template>
  <div class="container narrow">
    <div class="page-header">
      <h1>Account</h1>
      <p>Member since {{ auth.member && date(auth.member.createdAt) }}</p>
    </div>

    <div class="card">
      <div class="card-body stack">
        <div class="row profile">
          <img v-if="auth.member?.avatarUrl" :src="imageUrl(auth.member.avatarUrl)" class="avatar" alt="" />
          <span v-else class="avatar letter">{{ auth.member?.name?.[0]?.toUpperCase() }}</span>
          <div>
            <strong>{{ auth.member?.name }}</strong>
            <div class="muted small">{{ auth.member?.email }}</div>
            <label class="btn btn-outline btn-sm upload">
              Change photo
              <input type="file" accept="image/png,image/jpeg,image/webp" hidden @change="onAvatar" />
            </label>
          </div>
        </div>

        <form class="field" @submit.prevent="saveName">
          <label for="name">Display name</label>
          <div class="row">
            <input id="name" v-model.trim="name" class="input" required />
            <button class="btn btn-primary" :disabled="saving || name === auth.member?.name">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.narrow {
  max-width: 640px;
}
.profile {
  gap: 20px;
}
.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.letter {
  display: grid;
  place-items: center;
  background: var(--brand);
  color: #fff;
  font-size: 2rem;
  font-weight: 700;
}
.upload {
  margin-top: 8px;
}
</style>
