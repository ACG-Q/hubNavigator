import { createI18n } from 'vue-i18n'

const messages = {
    en: {
        nav: {
            searchPlaceholder: 'Search for tools...',
            home: 'Home'
        },
        home: {
            allApps: 'All Applications',
            categories: 'Categories',
            noResults: 'No results found',
            clearFilters: 'Clear filters'
        },
        details: {
            back: 'Back to Browsing',
            visit: 'Visit Official Website',
            detailsTitle: 'Product Details',
            reportIssue: 'Report Error / Suggest Fix',
            comments: 'Comments',
            viewOnGithub: 'View Conversation on GitHub →',
            loadingComments: 'Loading comments...',
            notFound: 'Site not found'
        },
        go: {
            title: 'Redirecting',
            message: 'You are being redirected to {site}. Please wait...',
            manual: 'Not redirecting? Click here',
            seconds: 'Redirecting in {n}s...'
        }
    },
    zh: {
        nav: {
            searchPlaceholder: '搜索工具...',
            home: '首页'
        },
        home: {
            allApps: '全部应用',
            categories: '全部分类',
            noResults: '未找到结果',
            clearFilters: '清除筛选'
        },
        details: {
            back: '返回浏览',
            visit: '访问官方网站',
            detailsTitle: '产品介绍',
            reportIssue: '报错 / 建议修改',
            comments: '评论交流',
            viewOnGithub: '在 GitHub 查看对话 →',
            loadingComments: '评论加载中...',
            notFound: '未找到该站点'
        },
        go: {
            title: '正在跳转',
            message: '正在为您跳转至 {site}，请稍等...',
            manual: '如果未自动跳转，请点击此处',
            seconds: '{n}s 后自动跳转...'
        }
    }
}

const savedLocale = localStorage.getItem('locale') || 'zh'

const i18n = createI18n({
    legacy: false,
    locale: savedLocale,
    fallbackLocale: 'en',
    messages
})

export default i18n
