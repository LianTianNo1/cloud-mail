<template>
  <div class="premium-hamburger" @click="toggleClick" :class="{ 'is-active': isActive }">
    <div class="hamburger-lines">
      <span class="line line-1"></span>
      <span class="line line-2"></span>
      <span class="line line-3"></span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isActive: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits()
const toggleClick = () => {
  emit('toggleClick');
}
</script>

<style scoped>
.premium-hamburger {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(0, 0, 0, 0.04);
  
  &:hover {
    background: rgba(102, 126, 234, 0.1);
    transform: translateY(-1px);
  }
  
  &.is-active {
    .line-1 {
      transform: rotate(45deg) translate(5px, 5px);
    }
    
    .line-2 {
      opacity: 0;
      transform: translateX(20px);
    }
    
    .line-3 {
      transform: rotate(-45deg) translate(7px, -6px);
    }
  }
}

.hamburger-lines {
  width: 20px;
  height: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
}

.line {
  width: 100%;
  height: 2px;
  background: var(--el-text-color-primary);
  border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
}

.line-1 {
  transform-origin: top left;
}

.line-3 {
  transform-origin: bottom left;
}
</style>