<script setup>
import {onMounted, ref} from "vue"
import {useRouter} from "vue-router"
import axios from "axios"

const router = useRouter()

const me = ref({})

function getMyData(){
    const fetch = axios.get("http://localhost:3000/auth/me",{withCredentials:true}).then((res)=>{
        me.value = res.data.user
    }).catch((err)=>{
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
</template>