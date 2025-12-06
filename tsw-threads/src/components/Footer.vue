<script setup>
import AdminChat from "./AdminChat.vue";
</script>

<template>
  <div class="footer-wrapper">
    <AdminChat />

    <footer class="footer">
      Milan Kwiatkowski 2025
    </footer>
  </div>
</template>

<style scoped>
.footer-wrapper {
  margin-top: 40px;
  padding: 0 20px;
}

.footer {
  width: 100%;
  padding: 20px 0;
  text-align: center;
  color: var(--text-soft);
  font-size: 0.9rem;
  border-top: 1px solid var(--border);
  margin-top: 30px;
}
</style>

