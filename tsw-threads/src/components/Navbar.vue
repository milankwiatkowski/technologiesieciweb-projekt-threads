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
    <button @click="goToMyProfile()">Mój profil</button>
    <button @click="logout()">Wyloguj się</button>
</template>
<style scoped>
button {
  background: #333;
  border: none;
  padding: 8px 14px;
  color: #eee;
  border-radius: 4px;
  cursor: pointer;
  transition: 0.2s;
}
</style>