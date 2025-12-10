<script setup>
import {onMounted, ref} from 'vue'
import axios from 'axios'
import {useRouter} from 'vue-router'
import {io} from "socket.io-client"
const socket = io("https://localhost",{withCredentials:true,transports: ["websocket", "polling"]})

const router = useRouter()

const users = ref([])
const usersToBeAccepted = ref([])
const usersToShow = ref([])
const admins = ref([])
socket.on('userAccepted',(user)=>{
    usersToBeAccepted.value = usersToBeAccepted.value.filter((x)=> x._id !== user._id)
    usersToShow.value.push(user)
})
socket.on('addUserToBeAccepted',(user)=>{
    usersToBeAccepted.value.push(user)
})
socket.on(`adminAdded`,(user)=>{
  admins.value.push(user)
})
socket.on(`userNotAccepted`,(user)=>{
  usersToBeAccepted.value = usersToBeAccepted.value.filter((x) => x !== user)
})
async function getUsers(){
    const fetch = axios.get('https://localhost/api/users',{withCredentials:true}).then((res)=>{
        users.value = res.data.users
        usersToShow.value = res.data.users.filter((x) => x.isAcceptedByAdmin === true)
        admins.value = res.data.users.filter((x) => x.isAdmin === true)
    }).catch((err)=>{
            console.log(err)
    })
}

async function deleteUser(id){
    const fetch = axios.delete(`https://localhost/api/users/${id}`,{withCredentials:true}).then((res)=>{
        getUsers()
    }).catch((err)=>{
            console.log(err)
    })
}
async function getUsersToBeAccepted(){
    const fetch = axios.get(`https://localhost/api/users/toBeAccepted`,{withCredentials:true}).then((res)=>{
        usersToBeAccepted.value = res.data.users}).catch((err)=>{
            console.log(err)
    })
}
async function acceptUser(id){
    const fetch = axios.post(`https://localhost/api/users/toBeAccepted/${id}`,{},{withCredentials:true}).catch((err)=>{
            console.log(err)
    })
}
async function dontAcceptUser(id){
    const fetch = axios.post(`https://localhost/api/users/notToBeAccepted/${id}`,{},{withCredentials:true}).catch((err)=>{
            console.log(err)
    })
}
async function giveAdmin(id){
    const fetch = axios.post(`https://localhost/api/users/giveAdmin/${id}`,{},{withCredentials:true}).catch((err)=>{
      console.log(err)
    })
}
onMounted(()=>{
    getUsers()
    getUsersToBeAccepted()
})

</script>
<template>
  <div class="user-panel">

    <h2>Users</h2>
    <ul class="user-list">
      <li v-for="user in usersToShow" :key="user._id" class="user-item">
        <div class="username">{{ user.login }}</div>

        <button v-if="!user.isAdmin" class="remove-btn" @click="deleteUser(user._id)">Remove user</button>
        <button v-if="!admins.includes(user)" class="remove-btn" @click="giveAdmin(user._id)">Make {{ user.login }} an admin</button>
      </li>
    </ul>

    <h2 class="section-title">Users to be accepted</h2>

    <ul class="user-list">
      <li v-for="user in usersToBeAccepted" :key="user._id" class="user-item">
        <div class="username">{{ user.login }}</div>

        <button class="accept-btn" @click="acceptUser(user._id)">Accept User</button>
        <button class="accept-btn" @click="dontAcceptUser(user._id)">Don't accept User</button>
      </li>
    </ul>

  </div>
</template>
<style scoped>
.user-panel {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px;
  color: var(--text);
}

h2 {
  font-size: 1.4rem;
  margin: 25px 0 12px;
  font-weight: 600;
  color: var(--text);
}

.section-title {
  margin-top: 35px;
}

.user-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--card);
  padding: 16px 18px;
  margin-bottom: 12px;
  border: 1px solid var(--border);
  border-radius: 14px;
  transition: all 0.2s;
}

.user-item:hover {
  background: #1d1d1d;
}

.username {
  font-size: 1.05rem;
  font-weight: 500;
}


.remove-btn,
.accept-btn {
  padding: 8px 18px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: #222;
  color: var(--text);
  font-size: 0.9rem;
  cursor: pointer;
  transition: 0.2s;
}

.remove-btn:hover,
.accept-btn:hover {
  background: #333;
}

.accept-btn {
  background: var(--accent);
  color: #000;
  border-color: var(--accent);
  font-weight: 600;
}

.accept-btn:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}

</style>