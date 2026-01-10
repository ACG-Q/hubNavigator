<script setup>
import { ref, onMounted, provide } from 'vue'
import NavBar from './components/NavBar.vue'

// Theme State
const isDark = ref(false)
const primaryColor = ref('indigo')

// Search & Data State (Global)
const searchQuery = ref('')
// Provide search to children (e.g. Home.vue)
provide('search', { searchQuery })

// Initialize Theme
const toggleTheme = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

onMounted(() => {
  // Theme init
  const savedTheme = localStorage.getItem('theme')
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
})

provide('theme', { isDark, toggleTheme, primaryColor })
</script>

<template>
  <div class="min-h-screen flex flex-col transition-colors duration-300 bg-background text-text-primary">
    <NavBar v-model:searchQuery="searchQuery" />
    
    <main class="flex-grow container mx-auto px-4 pt-24 pb-12">
       <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
       </router-view>
    </main>
    
    <footer class="text-center py-8 opacity-60 text-sm border-t border-gray-200 dark:border-gray-800 mt-auto">
      <p>&copy; 2026 HubNavigator. Built with Vue 3 & Tailwind CSS.</p>
    </footer>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
