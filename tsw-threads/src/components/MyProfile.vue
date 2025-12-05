<script setup>
import {onMounted, ref} from "vue"
import {useRouter} from "vue-router"
import axios from "axios"
import {io} from "socket.io-client"
const socket = io("https://localhost",{withCredentials:true,transports: ["websocket", "polling"]})

const router = useRouter()

const me = ref({})
const login = ref('')
const password = ref('')
const repeatedPassword = ref('')

socket.on('user',(user)=>{
    me.value = user
})

function getMyData(){
    const fetch = axios.get("https://localhost/api/auth/me",{withCredentials:true}).then((res)=>{
        me.value = res.data.user
    }).catch((err)=>{
            console.log(err)
    })
}
function patchPassword(){
    axios.post(`https://localhost/api/users/patch/${me.value._id}`,{password:password.value,repeatedPassword:repeatedPassword.value},{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
function seeAllUsers(){
    router.push('/users')
}

onMounted(()=>{
    getMyData()
})

</script>
<template>
    <ul v-if="me && me.login">
        <li>Login: {{me.login}}</li>
        <li>Email: {{me.email}}</li>
        <li>Admin?: {{me.isAdmin}}</li>
        <button v-if="me.isAdmin" @click="seeAllUsers()">See all users</button>
    </ul>
    <div v-if="me && me._id">
        <form @submit.prevent="patchPassword">
        <input v-model="password" type="password" placeholder="Your password" required/>
        <input v-model="repeatedPassword" type="password" placeholder="Repeat your password" required/>
        <button>Change your password</button>
    </form>
    </div>
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