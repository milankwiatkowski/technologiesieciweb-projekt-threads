<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
function goToLogin(){
    router.push('/')
}
</script>
<template>
    <div>You are waiting to be accepted...</div>
    <button @click="goToLogin()">Try logging in again</button>
</template>