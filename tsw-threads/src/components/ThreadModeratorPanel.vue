<script setup>
import {onMounted, ref,watch} from "vue"
import {useRoute} from "vue-router"
import axios from "axios"
import {io} from "socket.io-client"
const socket = io("http://backend:3000",{withCredentials:true})
const route = useRoute()

const threadId = route.params.threadId
const thread = ref({})
const me = ref({})
const blockedUsersId = ref([])
socket.on('blockedUser',(id)=>{
    blockedUsersId.value.unshift(id)
    console.log(blockedUsersId.value)
})
socket.on('unblockedUser',(id)=>{
    blockedUsersId.value = blockedUsersId.value.filter((x)=> x !== id)
    console.log(blockedUsersId.value)
})
async function getMyData(){
    const fetch = axios.get('http://backend:3000/auth/me',{withCredentials:true}).then((res)=>[
        me.value = res.data.user,
    ]).catch((err)=>{
        console.log(err)
    })
}

async function getThread(){
    const fetch = axios.get(`http://backend:3000/threads/${threadId}/${1}/${10}`,{withCredentials:true}).then((res)=>{
        thread.value = res.data.thread
        blockedUsersId.value = res.data.thread.blockedId
    }).catch((err)=>{
        console.log(err)
    })
}

async function blockUser(id){
    const fetch = axios.post(`http://backend:3000/threads/${threadId}/block/${id}`,{},{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
async function unblockUser(id){
    const fetch = axios.post(`http://backend:3000/threads/${threadId}/unblock/${id}`,{},{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
async function giveMod(id){
    const fetch = axios.post(`http://backend:3000/threads/${threadId}/givemod/${id}`,{},{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
async function takeMod(id){
    const fetch = axios.delete(`http://backend:3000/threads/${threadId}/givemod/${id}`,{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}

onMounted(()=>{
    getMyData()
    getThread()
})


</script>

<template>
    <div v-if="thread && thread.title">Welcome to ModPanel for Thread {{thread.title}}</div>
    <ul v-if="thread && thread.threadAuthors">
        <li v-for="author in thread.threadAuthors":key="author.id">
            {{ author.login }}
            {{ author.id }}
            <button v-if="!blockedUsersId.includes(author.id)" @click="blockUser(author.id)">Block this user in this Thread</button>
            <button v-else @click="unblockUser(author.id)">Unblock this user in this Thread</button>
            <button v-if="!thread.modsThreadId.includes(author.id)" @click="giveMod(author.id)">Give mod to this user in this Thread</button>
            <button v-if="thread.modsThreadId.includes(author.id)" @click="takeMod(author.id)">Take mod from this user in this Thread</button>
        </li>
    </ul>
</template>