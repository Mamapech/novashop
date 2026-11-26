<script setup>
defineProps({ status: { type: String, required: true } })

const CLASSES = {
  pending: "badge-warn",
  paid: "badge-info",
  shipped: "",
  delivered: "badge-success",
  cancelled: "badge-muted",
}
</script>

<template>
  <span class="badge" :class="CLASSES[status]" style="text-transform: capitalize">{{ status }}</span>
</template>
