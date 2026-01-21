<script setup>
import { computed, inject, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import GlobalConfig from '../config'
import realSitesData from '../../data/site_all.json'
import mockSitesData from '../../data/mock_data.json'
import categoriesData from '../../data/category_all.json'

const { t, locale } = useI18n()
const sitesData = import.meta.env.VITE_MOCK ? mockSitesData : realSitesData
const route = useRoute()
const router = useRouter()
const site = ref(null)

const getCategoryName = (catId) => {
  const cat = categoriesData.find(c => c.id === catId)
  if (!cat) return catId
  return locale.value === 'zh' ? cat.name : cat.name_en
}

const loadSite = () => {
  const id = route.params.id
  site.value = sitesData.find(s => s.id === id)
}

const getIconUrl = (url) => {
  try {
    const domain = new URL(url).hostname
    return `https://icon.horse/icon/${domain}`
  } catch (e) {
    return ''
  }
}

const renderedMarkdown = computed(() => {
  if (!site.value || !site.value.description_md) return ''
  return marked.parse(site.value.description_md)
})

const githubIssueUrl = computed(() => {
  if (!site.value) return '#'
  const issueId = site.value.id.replace('site_issue_', '')
  return `https://github.com/${GlobalConfig.repo}/issues/${issueId}`
})

const reportIssueUrl = computed(() => {
  if (!site.value) return '#'
  const baseUrl = `https://github.com/${GlobalConfig.repo}/issues/new`
  const params = new URLSearchParams({
    template: 'site_correction.yml',
    site_id: site.value.id,
    url: site.value.url
  })
  return `${baseUrl}?${params.toString()}`
})

// Giscus Integration
const giscusContainer = ref(null)
const { isDark } = inject('theme')

const updateGiscus = () => {
  if (!giscusContainer.value || !site.value) return
  
  // Clear previous
  giscusContainer.value.innerHTML = ''
  
  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.dataset.repo = GlobalConfig.repo
  script.dataset.repoId = GlobalConfig.giscus.repoId
  script.dataset.category = GlobalConfig.giscus.category
  script.dataset.categoryId = GlobalConfig.giscus.categoryId
  script.dataset.mapping = 'pathname'
  script.dataset.strict = '0'
  script.dataset.reactionsEnabled = '1'
  script.dataset.emitMetadata = '0'
  script.dataset.inputPosition = 'top'
  script.dataset.theme = isDark.value ? 'dark' : 'light'
  script.dataset.lang = locale.value === 'zh' ? 'zh-CN' : 'en'
  script.dataset.loading = 'lazy'
  script.crossOrigin = 'anonymous'
  script.async = true
  
  giscusContainer.value.appendChild(script)
}

watch([site, isDark, locale], updateGiscus)
onMounted(() => {
  loadSite()
  setTimeout(updateGiscus, 500) // Small delay to ensure container is ready
})
</script>

<template>
  <div v-if="site" class="max-w-4xl mx-auto animate-fade-in">
    <!-- Back Button -->
    <button 
      @click="router.back()" 
      class="mb-8 flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-medium"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
      </svg>
      {{ t('details.back') }}
    </button>

    <!-- Header Card -->
    <div class="glass rounded-3xl p-8 mb-8 relative overflow-hidden text-text-primary">
      <div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5"></div>
      
      <div class="relative z-10 flex flex-col md:flex-row gap-8 items-start">
        <div class="w-24 h-24 rounded-2xl bg-white dark:bg-gray-800 p-4 shadow-xl flex items-center justify-center shrink-0">
           <img 
            :src="getIconUrl(site.url)" 
            :alt="site.name"
            class="w-16 h-16 object-contain"
          />
        </div>
        
        <div class="flex-1">
          <div class="flex flex-wrap gap-2 mb-4">
             <span v-for="catId in site.categories" :key="catId" class="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-white/5 flex items-center gap-1">
               <span>{{ categoriesData.find(c => c.id === catId)?.icon }}</span>
               {{ getCategoryName(catId) }}
             </span>
          </div>
          
          <h1 class="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
            {{ site.name }}
          </h1>
          
          <p class="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mb-6">
            {{ site.description }}
          </p>
          
          <div class="flex flex-wrap gap-4">
            <router-link 
              :to="{ name: 'Go', params: { id: site.id }}"
              class="px-8 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
            >
              {{ t('details.visit') }}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </router-link>

            <a 
              :href="reportIssueUrl" 
              target="_blank"
              class="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {{ t('details.reportIssue') }}
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Content (Markdown) -->
    <div class="glass rounded-3xl p-8 mb-8 text-text-primary" v-if="site.description_md">
       <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
         <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
         </svg>
         {{ t('details.detailsTitle') }}
       </h2>
       <div 
         class="markdown-content prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary hover:prose-a:underline"
         v-html="renderedMarkdown"
       ></div>
    </div>

    <!-- Comments Section -->
    <div class="glass rounded-3xl p-8 mb-8">
       <h2 class="text-2xl font-bold mb-6 flex items-center gap-2 text-text-primary">
         <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
         </svg>
         {{ t('details.comments') }}
       </h2>
       
       <!-- Giscus Container -->
       <div ref="giscusContainer" class="giscus-wrapper min-h-[200px]">
          <div class="bg-gray-50/50 dark:bg-black/20 rounded-2xl p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-800">
            <p class="text-gray-500 dark:text-gray-400">
              {{ t('details.loadingComments') || 'Loading comments...' }}
            </p>
          </div>
       </div>
       
       <div class="mt-8 text-center">
          <a :href="githubIssueUrl" target="_blank" class="text-primary font-bold hover:underline">
            {{ t('details.viewOnGithub') || 'View Conversation on GitHub →' }}
          </a>
       </div>
    </div>

  </div>
</template>

<style scoped>
.markdown-content :deep(pre) {
  @apply bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto my-4;
}

.markdown-content :deep(code) {
  @apply font-mono text-sm;
}

.markdown-content :deep(blockquote) {
  @apply border-l-4 border-primary pl-4 italic text-gray-600 dark:text-gray-400 my-4;
}

.markdown-content :deep(ul), .markdown-content :deep(ol) {
  @apply my-4 ml-6;
}

.markdown-content :deep(li) {
  @apply mb-2;
}
</style>
