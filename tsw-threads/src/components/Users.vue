<script setup>
import {onMounted, ref} from 'vue'
import axios from 'axios'
import {useRouter} from 'vue-router'

const router = useRouter()

const users = ref([])

async function getUsers(){
    const fetch = axios.get('http://localhost:3000/users',{withCredentials:true}).then((res)=>{
        users.value = res.data.users
    }).catch((err)=>{
            console.log(err)
    })
}

async function deleteUser(id){
    const fetch = axios.delete(`http://localhost:3000/users/${id}`,{withCredentials:true}).then((res)=>{
        getUsers()
    }).catch((err)=>{
            console.log(err)
    })
}

onMounted(()=>{
    getUsers()
})

</script>
<template>
    <ul>
        <li v-for="user in users":key="user._id">
            {{user.login}}
            <button v-if="!user.isAdmin" @click="deleteUser(user._id)">Remove user</button>
        </li>
    </ul>
</template>