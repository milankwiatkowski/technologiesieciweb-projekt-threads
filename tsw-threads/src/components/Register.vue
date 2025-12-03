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
const repeatedpassword = ref('')
const email = ref('')

async function sendRegister(){
    if(password.value===repeatedpassword.value){
        const fetch = await axios.post('http://backend:3000/auth/register',{
            password:password.value,
            login:login.value,
            email:email.value
        }).then((res)=>{
            if(res.status===200){
                router.push("/")
            }
        }).catch((err)=>{
            alert(err.response.data.message)
        })
    }
    else{
        alert("Passwords must match!")
    }
}

</script>

<template>
    <form @submit.prevent="sendRegister">
        <input v-model="login" placeholder="Your login" required/>
        <input v-model="password" type="password" placeholder="Your password" required/>
        <input v-model="repeatedpassword" type="password" placeholder="Repeat your password" required/>
        <input v-model="email" type="email" placeholder="Your email" required/>
        <button>Register</button>
    </form>
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
