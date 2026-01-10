<script setup>
import { ref, onMounted, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import CategorySidebar from '../components/CategorySidebar.vue'
import SiteGrid from '../components/SiteGrid.vue'
import realSitesData from '../../data/site_all.json'
import mockSitesData from '../../data/mock_data.json'

const { t } = useI18n()
const sitesData = import.meta.env.VITE_MOCK ? mockSitesData : realSitesData
const { searchQuery } = inject('search')

const sites = ref([])
const selectedCategory = ref('')

onMounted(() => {
  sites.value = sitesData
})

const categories = computed(() => {
  const cats = new Set()
  sites.value.forEach(site => {
    if (Array.isArray(site.categories)) {
      site.categories.forEach(c => cats.add(c))
    }
  })
  return Array.from(cats).sort()
})

const filteredSites = computed(() => {
  return sites.value.filter(site => {
    // Filter by Category
    if (selectedCategory.value && !site.categories?.includes(selectedCategory.value)) {
      return false
    }
    // Filter by Search
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      return (
        site.name.toLowerCase().includes(q) ||
        (site.description && site.description.toLowerCase().includes(q)) ||
        (site.description_md && site.description_md.toLowerCase().includes(q))
      )
    }
    return true
  })
})
</script>

<template>
  <div class="flex flex-col md:flex-row md:gap-8">
    <!-- Sidebar -->
    <CategorySidebar 
      :categories="categories"
      :selectedCategory="selectedCategory"
      @select="cat => selectedCategory = cat"
    />
    
    <!-- Main Content -->
    <div class="flex-1">
      <div v-if="filteredSites.length > 0">
         <div class="mb-6 flex items-center justify-between">
            <h2 class="text-2xl font-bold text-text-primary">
              {{ selectedCategory ? selectedCategory.replace(/-/g, ' ') : t('home.allApps') }}
              <span class="text-sm font-normal text-gray-500 ml-2">({{ filteredSites.length }})</span>
            </h2>
         </div>
         <SiteGrid :sites="filteredSites" />
      </div>
      
      <div v-else class="text-center py-20">
         <h3 class="text-xl font-bold text-gray-400">{{ t('home.noResults') }}</h3>
         <p class="text-gray-500 mt-2">{{ t('home.clearFilters') }}</p>
         <button 
           @click="() => { searchQuery = ''; selectedCategory = '' }"
           class="mt-4 text-primary hover:underline"
         >
           {{ t('home.clearFilters') }}
         </button>
      </div>
    </div>
  </div>
</template>
