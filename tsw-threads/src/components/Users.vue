<script setup>
import {onMounted,onUnmounted, ref, watch} from 'vue'
import axios from 'axios'
import {useRouter} from 'vue-router'
import {io} from "socket.io-client"
const socket = io("https://localhost",{withCredentials:true,transports: ["websocket", "polling"]})

const router = useRouter()
const userPage = ref(Number(localStorage.getItem('userPage') || 1))
const foundUser = ref({})
const users = ref([])
const usersToBeAccepted = ref([])
const usersToShow = ref([])
const admins = ref([])
const login = ref('')
const ifSearched = ref(false)
const me = ref({})
async function getMyData(){
    const fetch = axios.get("https://localhost/api/auth/me",{withCredentials:true}).then((res)=>{
        me.value = res.data.user
    }).catch((err)=>{
            console.log(err)
    })
}
async function getUsers(){
    const fetch = axios.get(`https://localhost/api/users/${userPage.value}/${40}`,{withCredentials:true}).then((res)=>{
        users.value = res.data.users
        usersToShow.value = res.data.users.filter((x) => x.isAcceptedByAdmin === true)
        admins.value = res.data.users.filter((x) => x.isAdmin === true)
    }).catch((err)=>{
            console.log(err)
    })
}
async function getUser(){
    const fetch = axios.get(`https://localhost/api/users/find/${login.value}`,{withCredentials:true}).then((res)=>{
      foundUser.value = res.data.user
      ifSearched.value = true
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
async function nextPage(){
    userPage.value++
    localStorage.setItem("userPage",userPage.value)
    getUsers(userPage.value)
}

async function prevPage(){
    if(userPage.value>1){
        userPage.value--
        localStorage.setItem("userPage",userPage.value)
        getUsers(userPage.value)
    }
}
function addAdmin(user){
  admins.value.push(user)
}
function userDeniedAccept(user){
  usersToBeAccepted.value = usersToBeAccepted.value.filter((x) => x._id !== user._id)
}
function userAccepted(user){
  usersToBeAccepted.value = usersToBeAccepted.value.filter((x) => x._id !== user._id)
  usersToShow.value.push(user)
}
function userToBeAccepted(user){
  usersToBeAccepted.value.push(user)
}
function adminMessagesListener(){
    socket.on("userAccepted",userAccepted)
    socket.on("userDeniedAccept",userDeniedAccept)
    socket.on("addUserToBeAccepted",userToBeAccepted)
    socket.on("adminAdded",addAdmin)
}
function detachAdminMessagesListener(){
    socket.off("userAccepted",userAccepted)
    socket.off("userDeniedAccept",userDeniedAccept)
    socket.off("addUserToBeAccepted",userToBeAccepted)
    socket.off("adminAdded",addAdmin)
}
onMounted(()=>{
    getMyData()
})
watch(
  ()=>me.value?.isAdmin,
  (isAdmin)=>{
      detachAdminMessagesListener()
      if (isAdmin){
        getUsers()
        getUsersToBeAccepted()
        adminMessagesListener()
    }
})
onUnmounted(() => {
  detachAdminMessagesListener()
  socket.disconnect()
})
</script>
<template>
  <div class="user-panel" v-if="me.isAdmin">
    <form @submit.prevent="getUser" class="reply-form">
        <input v-model="login" placeholder="Search for a user" required />
        <button class="btn-wide" type="submit">Search</button>
    </form>
    <div v-if="!ifSearched">
    <h2>Users</h2>
    <div class="user-list">
      <div v-for="user in usersToShow" :key="user._id" class="user-item">
        <div class="username">{{ user.login }}</div>
        <button v-if="!user.isAdmin" class="remove-btn" @click="deleteUser(user._id)">Remove user</button>
        <button v-if="!user.isAdmin" class="remove-btn" @click="giveAdmin(user._id)">Make {{ user.login }} an admin</button>
      </div>
      <button class="btn" v-if="userPage > 1" @click="prevPage()">Previous page</button>
      <button class="btn" v-if="users.length >= 40" @click="nextPage()">Next page</button>
    </div>
    </div>
    <div v-else-if="foundUser">
      <h2>Searched user</h2>
        <div class="username">{{ foundUser.login }}</div>
        <button v-if="!foundUser.isAdmin" class="remove-btn" @click="deleteUser(foundUser._id)">Remove user</button>
        <button v-if="!foundUser.isAdmin" class="remove-btn" @click="giveAdmin(foundUser._id)">Make {{ foundUser.login }} an admin</button>
    </div>
    <div v-else>
      <div>
        <h2>No user found</h2>
        <button class="btn" @click="ifSearched = false">Hide</button>
      </div>
    </div>
    <h2 class="section-title">Users to be accepted</h2>

    <div class="user-list">
      <div v-for="user in usersToBeAccepted" :key="user._id" class="user-item">
        <div class="username">{{ user.login }}</div>

        <button class="accept-btn" @click="acceptUser(user._id)">Accept User</button>
        <button class="accept-btn" @click="dontAcceptUser(user._id)">Don't accept User</button>
      </div>
    </div>

  </div>
</template>
<style scoped>
.user-panel {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
  color: var(--text);
}

.user-list {
  list-style: none;
  padding: 0;
  margin: 0;

  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  align-items: start;
}

.user-item {
  display: flex;
  flex-direction: column;
  gap: 12px;

  background: var(--card);
  padding: 16px 18px;
  border: 1px solid var(--border);
  border-radius: 14px;
  transition: all 0.2s;
  margin-bottom: 0;
}

.user-item:hover {
  background: #1d1d1d;
}

.username {
  font-size: 1.05rem;
  font-weight: 600;
  text-align: center;
  word-break: break-word;
}

.remove-btn,
.accept-btn {
  width: 100%;
  padding: 10px 14px;
  border-radius: 12px;
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
  font-weight: 700;
}

.accept-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.user-list > .btn {
  grid-column: 1 / -1;
  justify-self: center;
}
input{
  width: 100%;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  padding: 12px;
  border-radius: 12px;
  color: var(--text);
  font-size: 0.95rem;
}
input:focus {
  outline: none;
  border-color: #444;
}
.btn {
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color 0.12s ease,
    border-color 0.12s ease,
    color 0.12s ease,
    transform 0.1s ease;
}

.btn:hover {
  background: var(--bg-soft);
  border-color: #3a3a3a;
}

.btn:active {
  transform: translateY(1px);
}

.btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.btn.accent {
  background: var(--accent);
  color: #000;
  border-color: transparent;
  font-weight: 700;
}

.btn.accent:hover {
  opacity: 0.9;
}

.btn.delete,
.btn.warn {
  background: transparent;
  border-color: #4a1a1a;
  color: #ffb3b3;
}

.btn.delete:hover,
.btn.warn:hover {
  background: #2a0f0f;
  border-color: #6a2a2a;
}

.btn-wide {
  width: 100%;
  margin: 10px 0 0;
  padding: 10px 14px;
  border-radius: 14px;
  font-weight: 700;
}
</style>
