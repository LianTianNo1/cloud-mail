<template>
  <div class="premium-sidebar">
    <div class="sidebar-content">
      <!-- Brand Section -->
      <div class="brand-section">
        <div class="brand-icon">
          <Icon icon="fluent:mail-24-filled" width="28" height="28" />
        </div>
        <div class="brand-text">
          <h2 class="brand-title">{{settingStore.settings.title}}</h2>
          <p class="brand-subtitle">Premium Mail</p>
        </div>
      </div>

      <!-- Navigation Section -->
      <div class="navigation-section">
        <div class="nav-group">
          <h3 class="nav-group-title">{{$t('mail')}}</h3>
          <div class="nav-items">
            <div class="nav-item" @click="router.push({name: 'email'})"
                 :class="route.meta.name === 'email' ? 'nav-item-active' : ''">
              <div class="nav-item-icon">
                <Icon icon="hugeicons:mailbox-01" width="20" height="20" />
              </div>
              <span class="nav-item-text">{{$t('inbox')}}</span>
              <div class="nav-item-indicator"></div>
            </div>

            <div class="nav-item" @click="router.push({name: 'send'})" v-perm="'email:send'"
                 :class="route.meta.name === 'send' ? 'nav-item-active' : ''">
              <div class="nav-item-icon">
                <Icon icon="cil:send" width="20" height="20" />
              </div>
              <span class="nav-item-text">{{$t('sent')}}</span>
              <div class="nav-item-indicator"></div>
            </div>

            <div class="nav-item" @click="router.push({name: 'draft'})" v-perm="'email:send'"
                 :class="route.meta.name === 'draft' ? 'nav-item-active' : ''">
              <div class="nav-item-icon">
                <Icon icon="ep:document" width="19" height="19" />
              </div>
              <span class="nav-item-text">{{$t('drafts')}}</span>
              <div class="nav-item-indicator"></div>
            </div>

            <div class="nav-item" @click="router.push({name: 'star'})"
                 :class="route.meta.name === 'star' ? 'nav-item-active' : ''">
              <div class="nav-item-icon">
                <Icon icon="solar:star-line-duotone" width="20" height="20" />
              </div>
              <span class="nav-item-text">{{$t('starred')}}</span>
              <div class="nav-item-indicator"></div>
            </div>

            <div class="nav-item" @click="router.push({name: 'setting'})"
                 :class="route.meta.name === 'setting' ? 'nav-item-active' : ''">
              <div class="nav-item-icon">
                <Icon icon="fluent:settings-48-regular" width="20" height="20" />
              </div>
              <span class="nav-item-text">{{$t('settings')}}</span>
              <div class="nav-item-indicator"></div>
            </div>
          </div>
        </div>

        <!-- Management Section -->
        <div class="nav-group" v-perm="['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']">
          <h3 class="nav-group-title">{{$t('manage')}}</h3>
          <div class="nav-items">
            <div class="nav-item" @click="router.push({name: 'analysis'})" v-perm="'analysis:query'"
                 :class="route.meta.name === 'analysis' ? 'nav-item-active' : ''">
              <div class="nav-item-icon">
                <Icon icon="fluent:data-pie-20-regular" width="20" height="20" />
              </div>
              <span class="nav-item-text">{{$t('analytics')}}</span>
              <div class="nav-item-indicator"></div>
            </div>

            <div class="nav-item" @click="router.push({name: 'user'})" v-perm="'user:query'"
                 :class="route.meta.name === 'user' ? 'nav-item-active' : ''">
              <div class="nav-item-icon">
                <Icon icon="si:user-alt-2-line" width="20" height="20" />
              </div>
              <span class="nav-item-text">{{$t('allUsers')}}</span>
              <div class="nav-item-indicator"></div>
            </div>

            <div class="nav-item" @click="router.push({name: 'all-email'})" v-perm="'all-email:query'"
                 :class="route.meta.name === 'all-email' ? 'nav-item-active' : ''">
              <div class="nav-item-icon">
                <Icon icon="fluent:mail-list-28-regular" width="20" height="20" />
              </div>
              <span class="nav-item-text">{{$t('allMail')}}</span>
              <div class="nav-item-indicator"></div>
            </div>

            <div class="nav-item" @click="router.push({name: 'role'})" v-perm="'role:query'"
                 :class="route.meta.name === 'role' ? 'nav-item-active' : ''">
              <div class="nav-item-icon">
                <Icon icon="fluent:lock-closed-16-regular" width="20" height="20" />
              </div>
              <span class="nav-item-text">{{$t('permissions')}}</span>
              <div class="nav-item-indicator"></div>
            </div>

            <div class="nav-item" @click="router.push({name: 'reg-key'})" v-perm="'reg-key:query'"
                 :class="route.meta.name === 'reg-key' ? 'nav-item-active' : ''">
              <div class="nav-item-icon">
                <Icon icon="fluent:fingerprint-20-filled" width="20" height="20" />
              </div>
              <span class="nav-item-text">{{$t('inviteCode')}}</span>
              <div class="nav-item-indicator"></div>
            </div>

            <div class="nav-item" @click="router.push({name: 'sys-setting'})" v-perm="'setting:query'"
                 :class="route.meta.name === 'sys-setting' ? 'nav-item-active' : ''">
              <div class="nav-item-icon">
                <Icon icon="eos-icons:system-ok-outlined" width="20" height="20" />
              </div>
              <span class="nav-item-text">{{$t('SystemSettings')}}</span>
              <div class="nav-item-indicator"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import router from "@/router/index.js";
import { useRoute } from "vue-router";
import {Icon} from "@iconify/vue";
import {useSettingStore} from "@/store/setting.js";

const settingStore = useSettingStore();
const route = useRoute();
</script>

<style lang="scss" scoped>
.premium-sidebar {
  width: 280px;
  height: 100vh;
  background: linear-gradient(180deg, 
    rgba(15, 23, 42, 0.95) 0%, 
    rgba(30, 41, 59, 0.95) 50%, 
    rgba(51, 65, 85, 0.95) 100%);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 20%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 60%, rgba(79, 172, 254, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }

  .sidebar-content {
    position: relative;
    z-index: 1;
    height: 100%;
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
  }

  .brand-section {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    margin-bottom: 32px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    }

    .brand-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }

    .brand-text {
      flex: 1;

      .brand-title {
        font-size: 18px;
        font-weight: 700;
        color: white;
        margin: 0;
        line-height: 1.2;
      }

      .brand-subtitle {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        margin: 2px 0 0 0;
        font-weight: 500;
      }
    }
  }

  .navigation-section {
    flex: 1;
    overflow-y: auto;
    
    &::-webkit-scrollbar {
      width: 4px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
    }
  }

  .nav-group {
    margin-bottom: 32px;

    .nav-group-title {
      font-size: 11px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 16px 20px;
    }

    .nav-items {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    margin: 0 8px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    color: rgba(255, 255, 255, 0.8);
    user-select: none;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      color: white;
      transform: translateX(4px);

      .nav-item-icon {
        transform: scale(1.1);
      }
    }

    &.nav-item-active {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
      color: white;
      border: 1px solid rgba(102, 126, 234, 0.3);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);

      .nav-item-indicator {
        opacity: 1;
        transform: scaleY(1);
      }

      .nav-item-icon {
        color: #667eea;
        transform: scale(1.1);
      }
    }

    .nav-item-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .nav-item-text {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
    }

    .nav-item-indicator {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%) scaleY(0);
      width: 3px;
      height: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 2px 0 0 2px;
      opacity: 0;
      transition: all 0.3s ease;
    }
  }

  @media (max-width: 1199px) {
    width: 250px;
  }
}
</style>