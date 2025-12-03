<script setup>
import {onMounted, ref} from 'vue'
import axios from 'axios'
import {useRouter} from 'vue-router'
import {io} from "socket.io-client"
const socket = io("http://backend:3000",{withCredentials:true})

const router = useRouter()

const users = ref([])
const usersToBeAccepted = ref([])
const usersToShow = ref([])
socket.on('userAccepted',(user)=>{
    usersToBeAccepted.value = usersToBeAccepted.value.filter((x)=> x._id !== user._id)
    usersToShow.value.push(user)
})
socket.on('addUserToBeAccepted',(user)=>{
    usersToBeAccepted.value.push(user)
})
async function getUsers(){
    const fetch = axios.get('http://backend:3000/users',{withCredentials:true}).then((res)=>{
        users.value = res.data.users
        usersToShow.value = res.data.users.filter((x) => x.isAcceptedByAdmin === true)
    }).catch((err)=>{
            console.log(err)
    })
}

async function deleteUser(id){
    const fetch = axios.delete(`http://backend:3000/users/${id}`,{withCredentials:true}).then((res)=>{
        getUsers()
    }).catch((err)=>{
            console.log(err)
    })
}
async function getUsersToBeAccepted(){
    const fetch = axios.get(`http://backend:3000/users/toBeAccepted`,{withCredentials:true}).then((res)=>{
        usersToBeAccepted.value = res.data.users}).catch((err)=>{
            console.log(err)
    })
}
async function acceptUser(id){
    const fetch = axios.post(`http://backend:3000/users/toBeAccepted/${id}`,{},{withCredentials:true}).catch((err)=>{
            console.log(err)
    })
}
onMounted(()=>{
    getUsers()
    getUsersToBeAccepted()
})

</script>
<template>
    <ul>
        <div v-for="user in usersToShow":key="user._id">
            {{user.login}}
            <button v-if="!user.isAdmin" @click="deleteUser(user._id)">Remove user</button>
        </div>
    </ul>
    <h2>Users to be accepted:</h2>
    <ul>
        <div v-for="user in usersToBeAccepted":key="user._id">
            {{ user.login }}
            <button @click="acceptUser(user._id)">Accept User</button>
        </div>
    </ul>
</template>