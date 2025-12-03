<script setup>
import { ref } from 'vue'
import axios from "axios"
import { useRouter } from 'vue-router'

defineProps({
  msg: String,
})

const router = useRouter()

const login = ref('')
const password = ref('')

async function sendLogin(){
    const fetch = await axios.post('http://backend:3000/auth/login',{
        password:password.value,
        login:login.value},
        {withCredentials:true}).then((res)=>{
            console.log(res)
            router.push("/threads")
        }).catch((err)=>{
            console.log(err)
            router.push('/waitingRoom')
        })
}
function goToRegister(){
    router.push("/register")
}

</script>

<template>
    <form @submit.prevent="sendLogin">
        <input v-model="login" placeholder="Your login" required/>
        <input v-model="password" type="password" placeholder="Your password" required/>
        <button>Login</button>
    </form>
    <button @click="goToRegister()">Don't have an account yet? Register now!</button>
</template>

<style scoped>
button {
  background: #333;
  border: none;
  padding: 8px 14px;
  color: #eee;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 6px;
  transition: 0.2s;
}
button:hover {
  background: #444;
}
input {
  padding: 8px;
  background: #222;
  border: 1px solid #444;
  border-radius: 4px;
  color: #eee;
  flex: 1;
}

input:focus {
  outline: none;
  border-color: #666;
}
</style>
