import { createRouter, createWebHistory } from 'vue-router'
import BeatmapsView from '@/views/BeatmapsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'beatmaps', component: BeatmapsView },
  ],
})

export default router
