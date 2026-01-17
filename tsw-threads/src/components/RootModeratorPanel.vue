<script setup>
import {onMounted, ref ,onUnmounted} from "vue"
import {useRoute} from "vue-router"
import axios from "axios"

const userPage = ref(Number(localStorage.getItem('userModpanelPage') || 1))
const foundUser = ref({})
const ifSearched = ref(false)
const login = ref('')
const route = useRoute()
const me = ref({})
const usersToShow = ref([])
const admins = ref([])
const users = ref([])
async function giveMod(id){
    const fetch = axios.post(`https://localhost/api/threads/root/givemod/${id}`,{},{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
async function takeMod(id){
    const fetch = axios.delete(`https://localhost/api/threads/root/givemod/${id}`,{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
async function getMyData(){
    const fetch = axios.get('https://localhost/api/auth/me',{withCredentials:true}).then((res)=>[
        me.value = res.data.user,
    ]).catch((err)=>{
        console.log(err)
    })
}
async function getUsers(){
    const fetch = axios.get(`https://localhost/api/users/${1}/${50}`,{withCredentials:true}).then((res)=>{
        users.value = res.data.users
        usersToShow.value = res.data.users.filter((x) => x.isAcceptedByAdmin === true)
        admins.value = res.data.users.filter((x) => x.isAdmin === true)
    }).catch((err)=>{
        console.log(err)
    })
}
async function nextPage(){
    userPage.value++
    localStorage.setItem("userModpanelPage",userPage.value)
    getUsers(userPage.value)
}

async function prevPage(){
    if(userPage.value>1){
        userPage.value--
        localStorage.setItem("userModpanelPage",userPage.value)
        getUsers(userPage.value)
    }
}
onMounted(()=>{
    getMyData()
    getUsers()
})
</script>
<template>
<div class="user-panel" v-if="me.isAdmin || me.isRootMod">
    <form @submit.prevent="getUser" class="reply-form">
        <input v-model="login" placeholder="Search for a user" required />
        <button class="btn-wide" type="submit">Search</button>
    </form>
    <div v-if="!ifSearched">
    <h2>Users</h2>
    <div class="user-list">
      <div v-for="user in usersToShow" :key="user._id" class="user-item">
        <div class="username">{{ user.login }}</div>
        <button v-if="!user.isAdmin && !user.isRootMod" class="remove-btn" @click="giveMod(user._id)">Make {{ user.login }} a root moderator</button>
        <button v-if="!user.isAdmin && user.isRootMod" class="remove-btn" @click="takeMod(user._id)">Remove {{ user.login }} from root moderators</button>
      </div>
      <button class="btn" v-if="userPage > 1" @click="prevPage()">Previous page</button>
      <button class="btn" v-if="users.length >= 40" @click="nextPage()">Next page</button>
    </div>
    </div>
    <div v-else-if="foundUser">
      <h2>Searched user</h2>
        <div class="username">{{ foundUser.login }}</div>
        <button v-if="!foundUser.isAdmin && !foundUser.isRootMod" class="remove-btn" @click="giveMod(foundUser._id)">Make {{ foundUser.login }} a root moderator</button>
        <button v-if="!foundUser.isAdmin && foundUser.isRootMod" class="remove-btn" @click="takeMod(foundUser._id)">Remove {{ foundUser.login }} from root moderators</button>
    </div>
    <div v-else>
      <div>
        <h2>No user found</h2>
        <button class="btn" @click="ifSearched = false">Hide</button>
      </div>
    </div>
</div>
</template>

<style scoped>
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
button {
  padding: 7px 14px;
  background: #222;
  border-radius: 20px;
  border: 1px solid var(--border);
  color: var(--text);
  font-size: 0.85rem;
}

button:hover {
  background: #333;
}
</style>