<script setup>
import {onMounted,onUnmounted, ref} from "vue"
import {useRouter} from "vue-router"
import axios from "axios"
import { socket } from "./socket"

const router = useRouter()

const me = ref({})
const password = ref('')
const repeatedPassword = ref('')

function getMyData(){
    const fetch = axios.get("https://localhost/api/auth/me",{withCredentials:true}).then((res)=>{
        me.value = res.data.user
    }).catch((err)=>{
            console.log(err)
    })
}
function patchPassword(){
    axios.post(`https://localhost/api/users/patch/${me.value._id}`,{password:password.value,repeatedPassword:repeatedPassword.value},{withCredentials:true}).then(()=>{
      alert("Password changed successfully")
    }).catch((err)=>{
        alert(err.response.data.message)
    })
}
function seeAllUsers(){
    router.push('/users')
}
function seeHiddenPosts(){
    router.push('/hidden')
}
function setMyData(user){
    me.value = user
}
onMounted(()=>{
    if (!socket.connected) socket.connect();
    getMyData()
    socket.on('user',setMyData)
})
onUnmounted(()=>{
    socket.off('user',setMyData)
  })

</script>
<template>
  <div class="profile-page">
    <ul v-if="me && me.login" class="profile-card">
      <li><strong>Login:</strong> {{ me.login }}</li>
      <li><strong>Admin:</strong> {{ me.isAdmin }}</li>
      <div v-if="me.isAdmin">
        <button class="admin-btn" @click="seeAllUsers()">
          See all users
        </button>
        <button class="admin-btn" @click="seeHiddenPosts()">
          See hidden posts
        </button>
      </div>
    </ul>

    <div v-if="me && me._id" class="password-card">
      <form @submit.prevent="patchPassword" class="password-form">
        <h3>Change your password</h3>
        <input v-model="password" type="password" placeholder="Your password" required />
        <input v-model="repeatedPassword" type="password" placeholder="Repeat your password" required />

        <button class="change-btn">Change your password</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 600px;
  margin: 40px auto;
  padding: 0 20px;
  color: var(--text);
}

.profile-card {
  list-style: none;
  padding: 20px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 18px;
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.profile-card li {
  font-size: 1rem;
  color: var(--text);
}

.admin-btn {
  margin-top: 12px;
  align-self: flex-start;
  padding: 8px 18px;
  background: var(--accent);
  color: #000;
  border: none;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.admin-btn:hover {
  opacity: 0.85;
}

.password-card {
  background: var(--card);
  border: 1px solid var(--border);
  padding: 22px;
  border-radius: 18px;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

h3 {
  margin: 0 0 5px;
  font-size: 1.2rem;
  color: var(--text);
  font-weight: 600;
}

input {
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

.change-btn {
  padding: 12px;
  background: var(--accent);
  color: #000;
  border-radius: 26px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.change-btn:hover {
  opacity: 0.85;
}
</style>
