<script setup>
import {ref,onMounted, onUnmounted, computed} from "vue"
import {useRoute, useRouter} from "vue-router"
import AdminChat from "./AdminChat.vue";
import axios from "axios"

const route = useRoute();
const router = useRouter()

const posts = ref([])
const tag = computed(()=>route.params.tag)
const me = ref({})
const lastPage = ref(Number(localStorage.getItem("lastTagPage")) || 1)


async function getPosts(){
    const fetch = axios.get(`https://localhost/api/threads/find/${tag.value}/${lastPage.value}/${30}`,{withCredentials:true}
    ).then((res)=>{
        posts.value = res.data.posts
    }).catch((err)=>{
            console.log(err)
    })
}

async function hidePost(pid){
  const fetch = axios.post(`https://localhost/api/threads/post/hide/${pid}`,{},{withCredentials:true}).catch((err)=>{
    console.log(err)
  })
}

async function goToPost(postId){
    router.push(`/thread/postDetails/${postId}`)
}

async function nextPage(){
    lastPage.value++
    localStorage.setItem("lastTagPage",lastPage.value)
    getPosts()
}

async function prevPage(){
    if(lastPage.value>1){
        lastPage.value--
        localStorage.setItem("lastTagPage",lastPage.value)
        getPosts()
    }
}

async function getMyData(){
    const fetch = axios.get('https://localhost/api/auth/me',{withCredentials:true}).then((res)=>{
        me.value = res.data.user
    }).catch((err)=>{
        console.log(err)
    })
}


onMounted(()=>{
    getPosts()
    getMyData()
})
onUnmounted(()=>{
    localStorage.removeItem("lastTagPage")
})

</script>
<template>
  <div class="container">
    <ul class="thread-list">
      <li v-for="post in posts" :key="post._id" class="thread-item">
        <div class="thread-info">
          <strong>{{ post.creatorLogin }}</strong><br></br>
          <div class="title">{{ post.title }}</div>
          <div class="content">
            <div v-if="post.content.length<30">{{ post.content }}</div>
            <div v-else>{{ post.content.slice(0,25) + '...' }}</div>
          </div>
        </div>

        <div class="actions">
          <button v-if="me.isAdmin || me?._id?.toString?.() === post?.creatorId?.toString?.()" class="btn delete" @click="hidePost(post._id)">Hide</button>
          <button class="btn" @click="goToPost(post._id)">See more</button>
        </div>
      </li>
    </ul>

    <div class="pagination">
      <button v-if="lastPage > 1" @click="prevPage()">Previous page</button>
      <button v-if="posts.length >= 30" @click="nextPage()">Next page</button>
    </div>
  </div>
  <AdminChat />
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.thread-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.thread-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--card);
  padding: 16px 18px;
  margin-bottom: 14px;
  border: 1px solid var(--border);
  border-radius: 16px;
  transition: background-color 0.2s;
}

.thread-item:hover {
  background-color: #1d1d1d;
}

.thread-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
}

.likes {
  font-size: 0.9rem;
  color: var(--text-soft);
}

.actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 14px;
  background: #222;
  color: var(--text);
  border-radius: 20px;
  border: 1px solid var(--border);
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.2s;
}

.btn:hover {
  background-color: #333;
}

.delete {
  background: #2a0000;
  border-color: #3d0000;
}

.delete:hover {
  background: #3d0000;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.pagination button {
  padding: 10px 18px;
  background: var(--accent);
  color: #000;
  border: none;
  border-radius: 26px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.pagination button:hover {
  opacity: 0.85;
}
</style>
