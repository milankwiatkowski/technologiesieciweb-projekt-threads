import { createRouter, createWebHistory } from 'vue-router'
import Login from './pages/Login.vue'
import MyProfile from './pages/MyProfile.vue'
import Register from './pages/Register.vue'
import SingleSubthreadPage from './pages/SingleSubthreadPage.vue'
import ThreadModeratorPanel from './pages/ThreadModeratorPanel.vue'
import Threads from './pages/Threads.vue'
import Users from './pages/Users.vue'
import AllSubthreadsPage from './pages/AllSubthreadsPage.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    {path: '/',component:Login},
    { path: '/register', component: Register },
    { path: '/myprofile', component: MyProfile },
    { path: '/thread/:threadId', component: AllSubthreadsPage },
    { path: '/threads', component: Threads },
    { path: '/subthreads/:threadId', component: SingleSubthreadPage },
    { path: '/modpanel/:threadId', component: ThreadModeratorPanel },
    { path: '/users', component: Users }
  ]
})