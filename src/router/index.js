import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import SiteDetails from '../views/SiteDetails.vue'
import Go from '../views/Go.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/site/:id',
        name: 'SiteDetails',
        component: SiteDetails,
        props: true
    },
    {
        path: '/go/:id',
        name: 'Go',
        component: Go,
        props: true
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        } else {
            return { top: 0 }
        }
    }
})

export default router
