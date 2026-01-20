<script setup>
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import categoriesData from '../../data/category_all.json'

const { locale } = useI18n()
const props = defineProps({
  site: {
    type: Object,
    required: true
  }
})

const getCategoryName = (catId) => {
  const cat = categoriesData.find(c => c.id === catId)
  if (!cat) return catId
  return locale.value === 'zh' ? cat.name : cat.name_en
}

const getIconUrl = (url) => {
  try {
    const domain = new URL(url).hostname
    return `https://icon.horse/icon/${domain}`
  } catch (e) {
    return ''
  }
}

const visibleCategories = computed(() => {
  return props.site.categories ? props.site.categories.slice(0, 2) : []
})

const remainingCount = computed(() => {
  return props.site.categories ? Math.max(0, props.site.categories.length - 2) : 0
})
</script>

<template>
  <router-link 
    :to="{ name: 'SiteDetails', params: { id: site.id }}"
    class="block group relative bg-white dark:bg-gray-800 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/20 border border-gray-100 dark:border-gray-700/50 overflow-hidden"
  >
    <!-- Glow Effect -->
    <div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    
    <div class="relative z-10 flex flex-col h-full">
      <!-- Header -->
      <div class="flex items-start justify-between mb-3">
        <div class="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 p-2 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
          <img 
            :src="getIconUrl(site.url)" 
            :alt="site.name"
            class="w-6 h-6 object-contain"
            loading="lazy"
            @error="$event.target.style.display='none'"
          />
        </div>
        <div class="flex gap-1 flex-wrap justify-end max-w-[65%]">
           <span v-for="cat in visibleCategories" :key="cat" class="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 whitespace-nowrap">
             {{ getCategoryName(cat) }}
           </span>
           <span v-if="remainingCount > 0" class="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400 border border-gray-100 dark:border-gray-700">
             +{{ remainingCount }}
           </span>
        </div>
      </div>

      <!-- Content -->
      <h3 class="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">
        {{ site.name }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-grow">
        {{ site.description_md || site.description || 'No description available.' }}
      </p>

      <!-- Footer/Link Icon -->
      <div class="flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-2 group-hover:translate-x-0">
        View Details 
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </div>
  </router-link>
</template>
