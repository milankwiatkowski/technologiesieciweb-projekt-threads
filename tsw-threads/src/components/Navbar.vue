<script setup>
import {useRouter} from "vue-router"
import {ref} from 'vue'
import axios from "axios"

const router = useRouter()

const me = ref({})

function goToMyProfile(){
    router.push("/myprofile")
}
function logout(){
    const fetch = axios.post("http://localhost:3000/auth/logout").then((res)=>{
        router.push("/")
    }).catch((err)=>{
        console.log(err)
    })
}

</script>

<template>
  <nav class="navbar">
    <div class="nav-left">My Forum</div>

    <div class="nav-right">
      <button @click="goToMyProfile()">Mój profil</button>
      <button @click="logout()">Wyloguj się</button>
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

/* Lewa strona (logo/tekst) */
.nav-left {
  color: #eee;
  font-size: 1.1rem;
  font-weight: 600;
}

/* Prawa strona */
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
