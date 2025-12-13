import { createMemoryHistory, createRouter } from 'vue-router'

import HomeView from '~/views/Home.vue'
import SvgView from '~/views/Svg.vue'
import Panel from '~/views/Panel.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/svg', component: SvgView },
  { path: '/panel', component: Panel },
]

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
})