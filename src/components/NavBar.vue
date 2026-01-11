<script setup>
import { inject, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GlobalConfig from '../config'

const { t, locale } = useI18n()
const { isDark, toggleTheme } = inject('theme')

defineProps({
  searchQuery: String
})

const emit = defineEmits(['update:searchQuery'])
const searchInput = ref(null)

const handleKeydown = (e) => {
  // Focus on '/' (if not already focused and not typing in another input)
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault()
    searchInput.value?.focus()
  }
  // Clear on 'Esc'
  if (e.key === 'Escape' && document.activeElement === searchInput.value) {
    emit('update:searchQuery', '')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const toggleLocale = () => {
  locale.value = locale.value === 'zh' ? 'en' : 'zh'
  localStorage.setItem('locale', locale.value)
}
</script>

<template>
  <nav class="fixed top-0 left-0 w-full z-50 glass border-b border-white/10 transition-all duration-300">
    <div class="container mx-auto px-4 h-16 flex items-center justify-between">
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/30">
          {{ GlobalConfig.siteLogo }}
        </div>
        <span class="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
          {{ GlobalConfig.siteName }}
        </span>
      </router-link>

      <!-- Search Bar -->
      <div class="flex-1 max-w-xl mx-8 hidden md:block group">
        <div class="relative">
          <input 
            ref="searchInput"
            type="text" 
            :value="searchQuery"
            @input="emit('update:searchQuery', $event.target.value)"
            :placeholder="t('nav.searchPlaceholder')"
            class="w-full bg-gray-100 dark:bg-gray-800/50 border-none rounded-xl py-2.5 pl-10 pr-12 focus:ring-2 focus:ring-primary/50 transition-all duration-300 group-hover:bg-white dark:group-hover:bg-gray-800 shadow-inner"
          />
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          
          <!-- Shortcut Hint -->
          <div v-if="!searchQuery" class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40 group-focus-within:opacity-0 transition-opacity pointer-events-none">
            <kbd class="px-1.5 py-0.5 text-[10px] font-sans font-bold bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">/</kbd>
          </div>

          <!-- Clear Button -->
          <button 
            v-else
            @click="emit('update:searchQuery', '')"
            class="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <!-- Language Switch -->
        <button 
          @click="toggleLocale"
          class="px-3 py-1.5 rounded-lg text-sm font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {{ locale === 'zh' ? 'EN' : '中文' }}
        </button>

        <!-- Theme Toggle -->
        <button 
          @click="toggleTheme" 
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative overflow-hidden group"
          aria-label="Toggle Theme"
        >
          <div class="relative z-10 w-5 h-5">
            <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-yellow-400 animate-fade-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-600 animate-fade-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </div>
          <div class="absolute inset-0 bg-primary/10 scale-0 group-hover:scale-100 transition-transform rounded-lg"></div>
        </button>

        <a 
          :href="`https://github.com/${GlobalConfig.repo}`" 
          target="_blank"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden sm:block"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
          </svg>
        </a>
      </div>
    </div>
  </nav>
</template>
