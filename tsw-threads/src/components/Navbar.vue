<script setup>
import {useRouter, useRoute} from "vue-router"
import {ref,onMounted,watch} from 'vue'
import axios from "axios"
import { socket } from "./socket"
const router = useRouter()
const me = ref({})
const tag = ref('')
const route = useRoute()
function goToMyProfile(){
    router.push("/myprofile")
}
function goToRootPage(){
  router.push('/threads')
}
function getMyData(){
    const fetch = axios.get("/api/auth/me",{withCredentials:true}).then((res)=>{
        me.value = res.data.user
    }).catch((err)=>{
        console.log(err)
    })
}
function logout(){
    const fetch = axios.post("/api/auth/logout").then(()=>{
        socket.removeAllListeners()
        socket.disconnect()
        router.push("/")
    }).catch((err)=>{
        console.log(err)
    })
}
function search(){
  const fetch = axios.get(`/api/threads/find/${tag.value}/1/4`,{withCredentials:true}).then(()=>{
    router.push(`/searched/${tag.value}`)
  }).catch((err)=>{
    console.log(err)
  })
}
onMounted(()=>{
    if (!socket.connected) socket.connect();
})
watch(
  () => route.fullPath,
  ()=>{
    getMyData()
  },
  {immediate:true}
)
</script>
<template>
  <nav class="navbar">
    <div class="nav-left">
      <button @click="goToRootPage()">My Threads</button>
    </div>

    <div class="nav-center">
      <form class="search-form" @submit.prevent="search">
        <input v-model="tag" placeholder="Search by tag..." required />
        <button type="submit" class="search-btn">Search</button>
      </form>
    </div>

    <div class="nav-right">
      <div v-if="me.isAdmin">Administrator</div>
      <button @click="goToMyProfile()">Mój profil</button>
      <button @click="logout()">Wyloguj się</button>
    </div>
  </nav>
</template>
<style scoped>

.navbar {
  width: 100%;
  display: grid;
  grid-template-columns:2fr 2fr 2fr;
  align-items: center;
  gap: 20px;
  padding: 14px 20px;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}

.nav-left,
.nav-center,
.nav-right {
  min-width: 0;
}

.nav-center {
  display: flex;
  justify-content: center;
  min-width: 0;
}

.search-form {
  max-width: 300px;
  width: 100%;
}

.nav-right button,
.nav-left button {
  white-space: nowrap;
  background: none;
  border: none;
  color: var(--accent);
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}


.nav-left button:hover {
  opacity: 0.85;
}
.search-form {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card);
  padding: 8px 12px;
  border-radius: 30px;
  border: 1px solid var(--border);
  width: 100%;
  max-width: 300px;
}

.search-form input {
  flex: 1;
  padding: 8px 10px;
  background: transparent;
  border: none;
  color: var(--text);
}

.search-form input:focus {
  outline: none;
}

.search-btn {
  background: var(--accent);
  color: #000;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
}

.search-btn:hover {
  opacity: 0.85;
}

</style>