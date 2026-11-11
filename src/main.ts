import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { i18n, navigatorCloseLanguage } from './i18n'
import { applyPortfolioI18n, initPortfolio, applyPortfolioLocale, syncPortfolioLocaleToI18n } from './content/portfolio'

import './assets/main.css'

initPortfolio()
  .then(() => {
    applyPortfolioI18n(i18n)
    return navigatorCloseLanguage().then((lang) => {
      applyPortfolioLocale(lang)
      syncPortfolioLocaleToI18n(i18n, lang)
      return lang
    })
  })
  .then(() => {
    createApp(App).use(router).use(i18n).mount('#app')
  })
  .catch((err) => {
    console.error('Failed to load portfolio database', err)
    document.body.innerHTML =
      '<p style="font-family:sans-serif;padding:2rem">Could not load portfolio content. Check that portfolio.sqlite is available.</p>'
  })
