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

async function sendRegister(){
    if(password.value===repeatedpassword.value){
        const fetch = await axios.post('https://localhost/api/auth/register',{
            password:password.value,
            repeatedPassword:repeatedpassword.value,
            login:login.value
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
  <div class="register-wrapper">
    <form class="register-form" @submit.prevent="sendRegister">
      <h2>Create your account</h2>

      <input type="email" v-model="login" placeholder="Your email as login" required />
      <input v-model="password" type="password" placeholder="Your password" required />
      <input v-model="repeatedpassword" type="password" placeholder="Repeat your password" required />

      <button type="submit">Register</button>
    </form>
  </div>
</template>

<style scoped>
.register-wrapper {
  max-width: 420px;
  margin: 80px auto;
  padding: 20px;
}

.register-form {
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
  text-align: center;
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

button {
  padding: 12px;
  background: var(--accent);
  color: #000;
  border-radius: 26px;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

button:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}
</style>
