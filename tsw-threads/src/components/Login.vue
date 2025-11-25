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
    const fetch = await axios.post('http://localhost:3000/auth/login',{
            password:password.value,
            login:login.value},
            {withCredentials:true}).then((res)=>{
            if(res.status===200){
                router.push("/threads")
            }
        }).catch((err)=>{
            console.log(err)
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
.read-the-docs {
  color: #888;
}
</style>
