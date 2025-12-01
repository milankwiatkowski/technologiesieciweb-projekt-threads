<script setup>
import {useRouter} from "vue-router"
import {ref} from 'vue'
import axios from "axios"

const router = useRouter()

const me = ref({})
const tag = ref('')

function goToMyProfile(){
    router.push("/myprofile")
}
function goToRootPage(){
  router.push('/threads')
}
function logout(){
    const fetch = axios.post("http://localhost:3000/auth/logout").then(()=>{
        router.push("/")
    }).catch((err)=>{
        console.log(err)
    })
}
function search(){
  const fetch = axios.get(`http://localhost:3000/threads/find/${tag.value}`,{withCredentials:true}).then(()=>{
    router.push(`/searched/${tag.value}`)
  }).catch((err)=>{
    console.log(err)
  })
}
</script>

<template>
  <nav class="navbar">
    <button @click="goToRootPage()" class="nav-left">My Threads</button>

    <div class="nav-right">
      <button @click="goToMyProfile()">Mój profil</button>
      <button @click="logout()">Wyloguj się</button>
    </div>
    <div class="search">
      <form @submit.prevent="search">
        <input v-model="tag" placeholder="Search for threads by a tag" required />
        <button>Search</button>
      </form>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  background: #1c1c1c;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #333;
}
input {
  padding: 8px;
  background: #222;
  border: 1px solid #444;
  border-radius: 4px;
  color: #eee;
  flex: 1;
}
.nav-left button {
  color: black;
  font-size: 1.1rem;
  font-weight: 600;
}

.nav-right button {
  background: #333;
  border: none;
  padding: 8px 14px;
  margin-left: 8px;
  color: #eee;
  border-radius: 4px;
  cursor: pointer;
  transition: 0.2s;
}

.nav-right button:hover {
  background: #444;
}
</style>
