<script setup>
defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
})
defineEmits(["change"])
</script>

<template>
  <nav v-if="totalPages > 1" class="pagination" aria-label="Pages">
    <button class="btn btn-outline btn-sm" :disabled="page <= 1" @click="$emit('change', page - 1)">Previous</button>
    <button
      v-for="n in totalPages"
      :key="n"
      class="btn btn-sm"
      :class="n === page ? 'btn-primary' : 'btn-ghost'"
      @click="$emit('change', n)"
    >
      {{ n }}
    </button>
    <button class="btn btn-outline btn-sm" :disabled="page >= totalPages" @click="$emit('change', page + 1)">Next</button>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 32px;
  flex-wrap: wrap;
}
</style>
