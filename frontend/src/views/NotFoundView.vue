<script setup>
import EmptyState from "@/components/EmptyState.vue"
</script>

<template>
  <div class="container" style="padding-top: 56px">
    <EmptyState title="Page not found" text="The page you're looking for doesn't exist or has moved.">
      <RouterLink to="/" class="btn btn-primary">Back to home</RouterLink>
    </EmptyState>
  </div>
</template>
