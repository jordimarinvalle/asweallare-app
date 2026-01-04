import HomePage from '../pages/home.js'
import ExperiencePage from '../pages/experience.js'
import GamePage from '../pages/game.js'
import StorePage from '../pages/store.js'
import ProfilePage from '../pages/profile.js'

export const routes = [
  {
    path: '/',
    component: HomePage
  },
  {
    path: '/experience/',
    component: ExperiencePage
  },
  {
    path: '/game/',
    component: GamePage
  },
  {
    path: '/store/',
    component: StorePage
  },
  {
    path: '/profile/',
    component: ProfilePage
  }
]
