<script setup>
import {onMounted, ref} from "vue"
import {useRouter} from "vue-router"
import axios from "axios"
import {io} from "socket.io-client"
const socket = io("http://localhost:3000",{withCredentials:true})

const router = useRouter()

const me = ref({})
const login = ref('')
const password = ref('')
const repeatedPassword = ref('')
const email = ref('')

socket.on('user',(user)=>{
    me.value = user
})

function getMyData(){
    const fetch = axios.get("http://localhost:3000/auth/me",{withCredentials:true}).then((res)=>{
        me.value = res.data.user
    }).catch((err)=>{
            console.log(err)
    })
}
function patchLogin(){
    axios.post(`http://localhost:3000/users/patch/${me.value._id}`,{login:login.value},{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
function patchEmail(){
    axios.post(`http://localhost:3000/users/patch/${me.value._id}`,{email:email.value},{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
function patchPassword(){
    axios.post(`http://localhost:3000/users/patch/${me.value._id}`,{password:password.value,repeatedPassword:repeatedPassword.value},{withCredentials:true}).catch((err)=>{
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
    <form @submit.prevent="patchLogin">
        <input v-model="login" placeholder="Your login" required/>
        <button>Change your login</button>
    </form>
        <form @submit.prevent="patchPassword">
        <input v-model="password" type="password" placeholder="Your password" required/>
        <input v-model="repeatedPassword" type="password" placeholder="Repeat your password" required/>
        <button>Change your password</button>
    </form>
        <form @submit.prevent="patchEmail">
        <input v-model="email" placeholder="Your email" required/>
        <button>Change your email address</button>
    </form>
    </div>
</template>