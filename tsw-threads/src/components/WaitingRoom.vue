<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
function goToLogin(){
    router.push('/')
}
</script>
<template>
  <div class="waiting-wrapper">
    <h2>You are waiting to be accepted...</h2>

    <button class="retry-btn" @click="goToLogin()">
      Try logging in again
    </button>
  </div>
</template>
<style scoped>
.waiting-wrapper {
  max-width: 500px;
  margin: 120px auto;
  padding: 40px 30px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 20px;
  text-align: center;
  color: var(--text);
}

.waiting-wrapper h2 {
  margin-bottom: 28px;
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--text);
}

.retry-btn {
  background: var(--accent);
  color: #000;
  padding: 12px 22px;
  border-radius: 30px;
  border: none;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: 0.2s;
}

.retry-btn:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}

</style>