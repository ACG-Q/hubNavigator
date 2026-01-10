<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import realSitesData from '../../data/site_all.json'
import mockSitesData from '../../data/mock_data.json'

const { t } = useI18n()
const sitesData = import.meta.env.VITE_MOCK ? mockSitesData : realSitesData
const route = useRoute()
const router = useRouter()
const site = ref(null)
const countdown = ref(3)
const progress = ref(100)
let timer = null
let progressTimer = null

const getIconUrl = (url) => {
  try {
    const hostname = new URL(url).hostname
    return `https://icon.horse/icon/${hostname}`
  } catch (e) {
    return ''
  }
}

onMounted(() => {
  const id = route.params.id
  site.value = sitesData.find(s => s.id === id)
  
  if (site.value) {
    // Smooth progress timer (every 50ms)
    const totalTime = 3000
    const interval = 50
    progressTimer = setInterval(() => {
      progress.value -= (interval / totalTime) * 100
      if (progress.value <= 0) {
        progress.value = 0
        clearInterval(progressTimer)
      }
    }, interval)

    // Actual countdown for text
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
        window.location.href = site.value.url
      }
    }, 1000)
  } else {
    router.replace('/')
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (progressTimer) clearInterval(progressTimer)
})
</script>

<template>
  <div class="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
    <div v-if="site" class="glass rounded-3xl p-12 max-w-lg w-full relative overflow-hidden animate-fade-in text-text-primary">
      <div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5"></div>
      
      <div class="relative z-10 flex flex-col items-center">
        <!-- Icon -->
        <div class="w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 p-4 shadow-xl mb-8 animate-bounce">
           <img 
            :src="getIconUrl(site.url)" 
            :alt="site.name"
            class="w-12 h-12 object-contain"
          />
        </div>

        <h1 class="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
          {{ t('go.title') }}
        </h1>
        
        <p class="text-lg text-gray-600 dark:text-gray-300 mb-8">
          {{ t('go.message', { site: site.name }) }}
        </p>

        <!-- Progress/Countdown -->
        <div class="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden mb-4">
           <div 
             class="h-full bg-primary"
             :style="{ width: `${progress}%`, transition: 'width 50ms linear' }"
           ></div>
        </div>
        <p class="text-sm font-medium text-primary mb-8">
          {{ t('go.seconds', { n: countdown }) }}
        </p>

        <div class="flex flex-col gap-4 w-full">
          <a 
            :href="site.url" 
            class="px-8 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all"
          >
            {{ t('details.visit') }}
          </a>
          
          <button 
            @click="router.back()"
            class="text-gray-400 hover:text-primary transition-colors text-sm underline"
          >
            {{ t('details.back') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
