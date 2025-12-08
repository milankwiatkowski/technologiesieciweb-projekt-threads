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
    const fetch = await axios.post('https://localhost/api/auth/login',{
        password:password.value,
        login:login.value},
        {withCredentials:true}).then((res)=>{
            console.log(res)
            router.push("/threads")
        }).catch((err)=>{
            if(err.status==500){
              router.push('/waitingRoom')
            }
            else{
              alert("Wrong credentials!")
            }
        })
}
function goToRegister(){
    router.push("/register")
}

</script>

<template>
  <div class="login-wrapper">
    <form class="login-form" @submit.prevent="sendLogin">
      <h2>Log in</h2>

      <input v-model="login" placeholder="Your login" required />
      <input v-model="password" type="password" placeholder="Your password" required />

      <button type="submit" class="login-btn">Login</button>
    </form>

    <button class="to-register-btn" @click="goToRegister()">
      Don't have an account yet? Register now!
    </button>
  </div>
</template>

<style scoped>
.login-wrapper {
  max-width: 420px;
  margin: 80px auto;
  padding: 20px;
  text-align: center;
  color: var(--text);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--card);
  padding: 30px 26px;
  border-radius: 18px;
  border: 1px solid var(--border);
}

h2 {
  margin: 0 0 10px;
  font-weight: 600;
  font-size: 1.4rem;
  color: var(--text);
}

input {
  width: 100%;
  padding: 12px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text);
  font-size: 0.95rem;
}

input:focus {
  outline: none;
  border-color: #555;
}

.login-btn {
  padding: 12px;
  background: var(--accent);
  color: #000;
  border-radius: 26px;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.login-btn:hover {
  opacity: 0.85;
}

.to-register-btn {
  margin-top: 16px;
  background: none;
  border: none;
  color: var(--accent);
  font-size: 0.95rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.to-register-btn:hover {
  opacity: 0.7;
}
</style>
