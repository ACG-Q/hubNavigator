<script setup>
import SiteCard from './SiteCard.vue'

defineProps({
  sites: {
    type: Array,
    required: true
  }
})
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-slide-up">
    <SiteCard 
      v-for="site in sites" 
      :key="site.id" 
      :site="site" 
    />
  </div>
</template>
