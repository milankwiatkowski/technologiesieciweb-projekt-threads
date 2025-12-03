<script setup>
import axios from "axios"
import {io} from "socket.io-client"
import { ref,onMounted } from "vue"
const socket = io("http://backend:3000",{withCredentials:true})
const me = ref({})
const adminMessages = ref([])

socket.on('adminMessage',(info)=>{
  if(adminMessages.value.length==5){
    adminMessages.value.pop()
    adminMessages.value.unshift(info)
  }
  else{
    adminMessages.value.unshift(info)
  }
})

async function getMyData(){
    const fetch = axios.get("http://backend:3000/auth/me",{withCredentials:true}).then((res)=>{
        me.value = res.data.user
    }).catch((err)=>{
            console.log(err)
    })
}
onMounted(()=>{
    getMyData()
})
</script>
<template>
    <div class="chat" v-if="me.isAdmin">
        <ul v-if="adminMessages && adminMessages.length>0">
            <li v-for="message in adminMessages">
                <p>{{ message }}</p>
            </li>
        </ul>
    </div>
</template>
<style scoped>
.chat{
    width:fit-content;
    border: 2px solid black;
    border-radius: 10px;
    display:flex;
    transform:translate(0,120%);
    font-size: small;
}
</style>