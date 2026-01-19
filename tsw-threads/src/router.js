import { createRouter, createWebHistory } from 'vue-router'
import Login from './pages/Login.vue'
import MyProfile from './pages/MyProfile.vue'
import Register from './pages/Register.vue'
import ThreadModeratorPanel from './pages/ThreadModeratorPanel.vue'
import RootThreads from './pages/RootThreads.vue'
import Users from './pages/Users.vue'
import ChildThreadsPage from './pages/ChildThreadsPage.vue'
import FoundByTag from './components/FoundByTag.vue'
import WaitingRoom from './components/WaitingRoom.vue'
import PostPage from './components/PostPage.vue'
import RootModeratorPanel from './components/RootModeratorPanel.vue'
import HiddenPosts from './components/HiddenPosts.vue'
export default createRouter({
  history: createWebHistory(),
  routes: [
    {path: '/',component:Login},
    { path: '/register', component: Register },
    { path: '/myprofile', component: MyProfile },
    { path: '/thread/:threadId', component: ChildThreadsPage },
    { path: '/threads', component: RootThreads },
    { path: '/thread/:threadId/post/:postId',component:PostPage},
    { path: '/modpanel/:threadId', component: ThreadModeratorPanel },
    { path: '/rootModpanel', component: RootModeratorPanel },
    { path: '/users', component: Users },
    { path: '/searched/:tag', component:FoundByTag},
    { path: '/hidden', component:HiddenPosts},
    { path: '/waitingRoom',component:WaitingRoom}
  ]
})