import { createRouter, createWebHistory } from 'vue-router'
import Login from './pages/Login.vue'
import MyProfile from './pages/MyProfile.vue'
import Register from './pages/Register.vue'
import ThreadModeratorPanel from './pages/ThreadModeratorPanel.vue'
import RootThreads from './pages/RootThreads.vue'
import Users from './pages/Users.vue'
import ChildThreadsPage from './pages/ChildThreadsPage.vue'
import FoundByTag from './components/FoundByTag.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    {path: '/',component:Login},
    { path: '/register', component: Register },
    { path: '/myprofile', component: MyProfile },
    { path: '/thread/:threadId', component: ChildThreadsPage },
    { path: '/threads', component: RootThreads },
    { path: '/modpanel/:threadId', component: ThreadModeratorPanel },
    { path: '/users', component: Users },
    { path: '/searched/:tag', component:FoundByTag}
  ]
})