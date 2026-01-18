<script setup>
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
defineProps({
  categories: {
    type: Array, // Array of category objects {id, name, name_en, icon, ...}
    required: true
  },
  selectedCategory: {
    type: String, // This is the ID
    default: ''
  }
})

defineEmits(['select'])
</script>

<template>
  <aside class="w-full md:w-64 flex-shrink-0 mb-8 md:mb-0">
    <div class="sticky top-24 glass rounded-2xl p-4 border border-white/5 shadow-xl">
      <h2 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 px-2">
        {{ t('home.categories') }}
      </h2>
      
      <div class="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-hide">
        <button
          @click="$emit('select', '')"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap"
          :class="[
            selectedCategory === '' 
              ? 'bg-primary text-white shadow-lg shadow-primary/30' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-primary dark:hover:text-white'
          ]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          {{ t('home.allApps') }}
        </button>

        <button
          v-for="cat in categories"
          :key="cat.id"
          @click="$emit('select', cat.id)"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap"
          :title="locale === 'zh' ? cat.description : cat.desc_en"
          :class="[
            selectedCategory === cat.id
              ? 'bg-primary text-white shadow-lg shadow-primary/30' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-primary dark:hover:text-white'
          ]"
        >
          <span class="text-lg">{{ cat.icon }}</span>
          {{ locale === 'zh' ? cat.name : cat.name_en }}
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
