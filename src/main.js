import { createApp } from 'vue'
import './styles/tailwind.css'
import './styles/theme.css'
import router from './router'
import i18n from './i18n'
import App from './App.vue'
import GlobalConfig from './config'

// Simple SEO Injection
const initSEO = () => {
    document.title = GlobalConfig.siteName
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
        metaDesc.setAttribute('content', GlobalConfig.siteDescription)
    } else {
        const meta = document.createElement('meta')
        meta.name = 'description'
        meta.content = GlobalConfig.siteDescription
        document.head.appendChild(meta)
    }
}

initSEO()

createApp(App).use(router).use(i18n).mount('#app')
