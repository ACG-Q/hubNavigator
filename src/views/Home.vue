<script setup>
import { ref, onMounted, computed, inject, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Fuse from 'fuse.js'
import CategorySidebar from '../components/CategorySidebar.vue'
import SiteGrid from '../components/SiteGrid.vue'
import realSitesData from '../../data/site_all.json'
import mockSitesData from '../../data/mock_data.json'
import categoriesData from '../../data/category_all.json'

const { t, locale } = useI18n()
const sitesData = import.meta.env.VITE_MOCK ? mockSitesData : realSitesData
const { searchQuery } = inject('search')

const sites = ref([])
const selectedCategory = ref('')

onMounted(() => {
  sites.value = sitesData
})

const activeCategories = computed(() => {
  const activeIds = new Set()
  sites.value.forEach(site => {
    if (Array.isArray(site.categories)) {
      site.categories.forEach(id => activeIds.add(id))
    }
  })
  return categoriesData.filter(cat => activeIds.has(cat.id))
})

const currentCategoryName = computed(() => {
  if (!selectedCategory.value) return t('home.allApps')
  const cat = categoriesData.find(c => c.id === selectedCategory.value)
  if (!cat) return selectedCategory.value
  return locale.value === 'zh' ? cat.name : cat.name_en
})

// Initialize Fuse.js
const fuse = computed(() => {
  const options = {
    keys: [
      { name: 'name', weight: 1.0 },
      { name: 'description', weight: 0.6 },
      { name: 'description_md', weight: 0.4 },
      { name: 'categoryNames', weight: 0.8 }
    ],
    threshold: 0.3, // Lower is stricter
    includeMatches: true
  }

  // Pre-process data for Fuse
  const list = sites.value.map(site => {
    const catNames = (site.categories || []).map(catId => {
      const cat = categoriesData.find(c => c.id === catId)
      return cat ? [cat.name, cat.name_en] : []
    }).flat()
    
    return {
      ...site,
      categoryNames: catNames.join(' ')
    }
  })

  return new Fuse(list, options)
})

const filteredSites = computed(() => {
  let result = sites.value

  // 1. Fuzzy Search first (if query exists)
  if (searchQuery.value) {
    const searchResult = fuse.value.search(searchQuery.value)
    result = searchResult.map(res => res.item)
  }

  // 2. Filter by Category (hard filter)
  if (selectedCategory.value) {
    result = result.filter(site => site.categories?.includes(selectedCategory.value))
  }

  return result
})
</script>

<template>
  <div class="flex flex-col md:flex-row md:gap-8">
    <!-- Sidebar -->
    <CategorySidebar 
      :categories="activeCategories"
      :selectedCategory="selectedCategory"
      @select="cat => selectedCategory = cat"
    />
    
    <!-- Main Content -->
    <div class="flex-1">
      <div v-if="filteredSites.length > 0">
         <div class="mb-6 flex items-center justify-between">
            <h2 class="text-2xl font-bold text-text-primary">
              {{ currentCategoryName }}
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
