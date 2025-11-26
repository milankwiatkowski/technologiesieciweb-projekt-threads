<script setup>
import {onMounted, ref,watch} from "vue"
import {useRoute} from "vue-router"
import axios from "axios"

const route = useRoute()

const threadId = route.params.threadId
const parentThread = ref({})
const me = ref({})


async function getMyData(){
    const fetch = axios.get('http://localhost:3000/auth/me',{withCredentials:true}).then((res)=>[
        me.value = res.data.user,
    ]).catch((err)=>{
        console.log(err)
    })
}

async function getAuthors(){
    const fetch = axios.get(`http://localhost:3000/threads/${threadId}`,{withCredentials:true}).then((res)=>{
        parentThread.value = res.data.thread
    }).catch((err)=>{
        console.log(err)
    })
}

async function blockUser(id){
    const fetch = axios.post(`http://localhost:3000/threads/${threadId}/block/${id}`,{},{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}

async function giveMod(id){
    const fetch = axios.post(`http://localhost:3000/threads/${threadId}/givemod/${id}`,{},{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
async function takeMod(id){
    const fetch = axios.delete(`http://localhost:3000/threads/${threadId}/givemod/${id}`,{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}

onMounted(()=>{
    getMyData()
    getAuthors()
})


</script>

<template>
    <div v-if="parentThread && parentThread.title">Welcome to ModPanel for Thread {{parentThread.title}}</div>
    <ul v-if="parentThread && parentThread.threadAuthors">
        <li v-for="author in parentThread.threadAuthors":key="author.id">
            {{ author.login }}
            {{ author.id }}
            <button @click="blockUser(author.id)">Block this user in this Thread</button>
            <button @click="giveMod(author.id)">Give mod to this user in this Thread</button>
            <button @click="takeMod(author.id)">Take mod from this user in this Thread</button>
        </li>
    </ul>
</template>