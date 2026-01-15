<script setup>
import {ref,onMounted, watch, computed} from "vue"
import {useRoute, useRouter} from "vue-router"
import axios from "axios"
import {io} from "socket.io-client"
import HighlightedText from './HighlightedText.vue'
import hljs from "highlight.js"
const isEditing = ref(false)
const title = ref('')
const content = ref('')
const likes = ref(0)
const disLikes = ref(0)
const socket = io("https://localhost",{withCredentials:true,transports: ["websocket", "polling"]})
const post = ref({})
const me = ref({})
const route = useRoute()
const threadId = route.params.threadId
const postId = route.params.postId
socket.on("liked",(payload)=>{
  likes.value = payload.likes
  disLikes.value = payload.disLikes
})
socket.on("disliked",(payload)=>{
  disLikes.value = payload.disLikes
  likes.value = payload.likes
})
async function like(){
    const fetch = axios.post(`https://localhost/api/threads/${threadId}/${postId}/likes`,{like:'like'},{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
async function disLike(){
    const fetch = axios.post(`https://localhost/api/threads/${threadId}/${postId}/likes`,{like:'dislike'},{withCredentials:true}).catch((err)=>{
        console.log(err)
    })
}
function setEditing(){
  isEditing.value = true
}
async function editPost(postId){
    const fetch = axios.post(`https://localhost/api/threads/edit/${threadId}/${postId}`,{
        title: title.value,
        content: content.value},
        {withCredentials:true}).then(()=>{
          isEditing.value = false
        }).catch((err)=>{
        console.log(err)
    })
}
async function getMyData(){
    const fetch = axios.get("https://localhost/api/auth/me",{withCredentials:true}).then((res)=>{
        me.value = res.data.user
    }).catch((err)=>{
            console.log(err)
    })
}
async function getPostDetails(threadId,postId){
    const fetch = axios.get(`https://localhost/api/threads/${threadId}/posts/${postId}`,{withCredentials:true}).then((res)=>{
        post.value = res.data.post
        likes.value = res.data.post.likes
        disLikes.value = res.data.post.disLikes}).catch((err)=>{
        console.log(err)
    })
}
onMounted(()=>{
    getMyData()
    getPostDetails(threadId,postId)
    hljs.highlightAll()
})
watch(
  () => route.params.postId,
  (newId) => {
    getPostDetails(threadId, newId)
  },
  { immediate: true }
)
</script>
<template>
    <div class="thread-info" v-if="!isEditing">
      <div>{{ post.creatorLogin }}</div>
      <p class="likes"><strong>Likes:</strong> {{ likes }}</p>
      <p class="likes"><strong>Dislikes:</strong> {{ disLikes }}</p>
      <HighlightedText v-if="post.content" :text="post.content" class="post-content" />
      <div class="post-buttons">
        <button class="btn accent" @click="like()">Like</button>
        <button class="btn accent" @click="disLike()">Dislike</button>
        <button class="btn" v-if="me.isAdmin || (post.rootModId || []).includes(me._id)" @click="setEditing()">Edit</button>
      </div>
    </div>
    <div v-if="isEditing && (me.isAdmin || (post.rootModId || []).includes(me._id))" class="edit-box">
      <form @submit="editPost(thread._id,post._id)" class="edit-form">
        <div class="edit-group">
          <strong>Current title:</strong> {{ post.title }}
          <input v-model="title" placeholder="Change title" />
        </div>

        <div class="edit-group">
          <strong>Current content:</strong> {{ post.content }}
          <textarea v-model="content" placeholder="Change content"></textarea>
        </div>
        <button class="btn accent" type="submit">Submit editing</button>
      </form>
    </div>
</template>
<style scoped>
.thread-info {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.likes {
  display: inline-block;
  margin-right: 14px;
  color: var(--text-soft);
  font-size: 0.9rem;
}

.likes strong {
  color: var(--text);
  font-weight: 600;
}

.post-content {
  margin: 18px 0 22px;
  line-height: 1.6;
  color: var(--text);
  font-size: 0.95rem;
}

.post-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #202020;
  color: var(--text);
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.15s ease, opacity 0.15s ease;
}

.btn:hover {
  background-color: #2a2a2a;
}

.btn.accent {
  background: var(--accent);
  color: #000;
  border-color: transparent;
  font-weight: 600;
}

.btn.accent:hover {
  opacity: 0.85;
}

.edit-box {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  max-width: 900px;
  margin: 20px auto 0;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.edit-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.edit-group strong {
  font-size: 0.85rem;
  color: var(--text-soft);
}

input,
textarea {
  padding: 12px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text);
  font-size: 0.95rem;
}

textarea {
  min-height: 140px;
  resize: vertical;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #555;
}

</style>