<script setup>
import {ref, onMounted} from "vue"
import {useRoute} from "vue-router"
import axios from "axios"

const route = useRoute()

const subthreadId = route.params.threadId


const subthread = ref({})
const likes = ref(0)

async function getsubThread(){
    const fetch = axios.get(`http://localhost:3000/subthreads/subthread/${subthreadId}`,{withCredentials:true}).then((res)=>{
        subthread.value = res.data.subthread
    }).catch((err)=>{
            console.log(err)
    })
}

async function getLikes(){
    const fetch = axios.get(`http://localhost:3000/subthreads/${subthreadId}/likes`,{withCredentials:true}).then((res)=>{
        likes.value = res.data.likes
    }).catch((err)=>{
        console.log(err)
    })
}
async function like(){
    const fetch = axios.post(`http://localhost:3000/subthreads/${subthreadId}/likes`,{},{withCredentials:true}).then(()=>{
        getLikes()
    }).catch((err)=>{
        console.log(err)
    })
}

onMounted(()=>{
    getsubThread()
    getLikes()
})

</script>
<template>
    <ul>
        <li v-if="subthread">
            {{subthread.title}}
            {{likes}}
            <button @click="like()">Like</button>
        </li>
    </ul>
</template>