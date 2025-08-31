<template>
  <div class="premium-header" :class="!hasPerm('email:send') ? 'not-send' : ''">
    <div class="header-left">
      <div class="hamburger-wrapper">
        <hanburger @click="changeAside"></hanburger>
      </div>
      <div class="breadcrumb-section">
        <h1 class="page-title">{{ $t(route.meta.title) }}</h1>
        <div class="page-subtitle">{{ getPageSubtitle() }}</div>
      </div>
    </div>
    <div v-perm="'email:send'" class="compose-button" @click="openSend">
      <div class="compose-icon">
        <Icon icon="material-symbols:edit-outline-sharp" width="20" height="20"/>
      </div>
      <span class="compose-text">Compose</span>
    </div>
    <div class="header-actions">
      <el-dropdown>
        <div class="action-item translate">
          <Icon icon="carbon:ibm-watson-language-translator" width="20" height="20"/>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="changeLang('zh')">简体中文</el-dropdown-item>
            <el-dropdown-item @click="changeLang('zhTW')">繁體中文</el-dropdown-item>
            <el-dropdown-item @click="changeLang('en')">English</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <div v-if="uiStore.dark" class="action-item theme-toggle" @click="openDark($event)">
        <Icon icon="mingcute:sun-fill" width="20" height="20"/>
      </div>
      <div v-else class="action-item theme-toggle" @click="openDark($event)">
        <Icon icon="solar:moon-linear" width="20" height="20"/>
      </div>
      <div class="action-item notification" @click="openNotice">
        <Icon icon="streamline-plump:announcement-megaphone" width="20" height="20"/>
      </div>
      <el-dropdown :teleported="false" popper-class="user-dropdown">
        <div class="user-profile">
          <div class="user-avatar">
            <div class="avatar-text">
              <div>{{ formatName(userStore.user.email) }}</div>
            </div>
          </div>
          <div class="user-info">
            <div class="user-name">{{ userStore.user.name }}</div>
            <div class="user-role">{{ $t(userStore.user.role.name) }}</div>
          </div>
          <Icon class="dropdown-icon" icon="mingcute:down-small-fill" width="20" height="20"/>
        </div>
        <template #dropdown>
          <div class="user-details">
            <div class="details-header">
              <div class="details-avatar">
                {{ formatName(userStore.user.email) }}
              </div>
              <div class="details-info">
                <div class="user-name">{{ userStore.user.name }}</div>
                <div class="detail-email" @click="copyEmail(userStore.user.email)">
                  {{ userStore.user.email }}
                </div>
                <div class="detail-user-type">
                  <el-tag>{{ $t(userStore.user.role.name) }}</el-tag>
                </div>
              </div>
            </div>
            
            <div class="stats-section">
              <div class="stat-item">
                <span class="stat-label">{{ $t('sendCount') }}</span>
                <div class="stat-value">
                  <span v-if="sendCount">{{ sendCount }}</span>
                  <el-tag>{{ sendType }}</el-tag>
                </div>
              </div>
              <div class="stat-item">
                <span class="stat-label">{{ $t('accountCount') }}</span>
                <div class="stat-value">
                  <el-tag v-if="settingStore.settings.manyEmail || settingStore.settings.addEmail">
                    {{ $t('disabled') }}
                  </el-tag>
                  <span v-else-if="accountCount && hasPerm('account:add')">
                    {{ $t('totalUserAccount', {msg: accountCount}) }}
                  </span>
                  <el-tag v-else-if="!accountCount && hasPerm('account:add')">{{ $t('unlimited') }}</el-tag>
                  <el-tag v-else-if="!hasPerm('account:add')">{{ $t('unauthorized') }}</el-tag>
                </div>
              </div>
            </div>
            
            <div class="logout-section">
              <el-button type="primary" :loading="logoutLoading" @click="clickLogout">
                {{ $t('logOut') }}
              </el-button>
            </div>
          </div>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import router from "@/router";
import hanburger from '@/components/hamburger/index.vue'
import {logout} from "@/request/login.js";
import {Icon} from "@iconify/vue";
import {useUiStore} from "@/store/ui.js";
import {useUserStore} from "@/store/user.js";
import {useRoute} from "vue-router";
import {computed, ref} from "vue";
import {useSettingStore} from "@/store/setting.js";
import {hasPerm} from "@/perm/perm.js"
import {useI18n} from "vue-i18n";
import {copyText} from "@/utils/clipboard-utils.js";
import {setExtend} from "@/utils/day.js"

const {t} = useI18n();
const route = useRoute();
const settingStore = useSettingStore();
const userStore = useUserStore();
const uiStore = useUiStore();
const logoutLoading = ref(false)

const accountCount = computed(() => {
  return userStore.user.role.accountCount
})

const sendType = computed(() => {

  if (settingStore.settings.send === 1) {
    return t('disabled')
  }

  if (!hasPerm('email:send')) {
    return t('unauthorized')
  }

  if (userStore.user.role.sendType === 'ban') {
    return t('sendBanned')
  }

  if (!userStore.user.role.sendCount) {
    return t('unlimited')
  }

  if (userStore.user.role.sendType === 'day') {
    return t('daily')
  }

  if (userStore.user.role.sendType === 'count') {
    return t('total')
  }
})

const sendCount = computed(() => {


  if (!hasPerm('email:send')) {
    return null
  }

  if (userStore.user.role.sendType === 'ban') {
    return null
  }

  if (!userStore.user.role.sendCount) {
    return null
  }

  if (settingStore.settings.send === 1) {
    return null
  }

  return userStore.user.sendCount + '/' + userStore.user.role.sendCount
})

async function copyEmail(email) {
  try {
    await copyText(email);
    ElMessage({
      message: t('copySuccessMsg'),
      type: 'success',
      plain: true,
    })
  } catch (err) {
    console.error(`${t('copyFailMsg')}:`, err);
    ElMessage({
      message: t('copyFailMsg'),
      type: 'error',
      plain: true,
    })
  }
}

function changeLang(lang) {
  setExtend(lang === 'en' ? 'en' : 'zh-cn')
  settingStore.lang = lang
}

function openNotice() {
  uiStore.showNotice()
}

function openDark(e) {

  const nextIsDark = !uiStore.dark
  const root = document.documentElement

  if (!document.startViewTransition) {
    switchDark(nextIsDark, root);
    return
  }

  const x = e.clientX
  const y = e.clientY

  const maxX = Math.max(x, window.innerWidth - x)
  const maxY = Math.max(y, window.innerHeight - y)
  const endRadius = Math.hypot(maxX, maxY)

  // 标记切换目标，供 CSS 选择器使用
  root.setAttribute('data-theme-to', nextIsDark ? 'dark' : 'light')
  root.style.setProperty('--vt-x', `${x}px`)
  root.style.setProperty('--vt-y', `${y}px`)
  root.style.setProperty('--vt-end-radius', `${endRadius + 10}px`)

  const transition = document.startViewTransition(() => {
    switchDark(nextIsDark, root);
  })

  transition.finished.finally(() => {
    // 清理标记
    root.removeAttribute('data-theme-to')
  })
}

function switchDark(nextIsDark, root) {
  root.setAttribute('class', nextIsDark ? 'dark' : '')
  uiStore.dark = nextIsDark
}

function openSend() {
  uiStore.writerRef.open()
}

function changeAside() {
  uiStore.asideShow = !uiStore.asideShow
}

function clickLogout() {
  logoutLoading.value = true
  logout().then(() => {
    localStorage.removeItem("token")
    router.replace('/login')
  }).finally(() => {
    logoutLoading.value = false
  })
}

function formatName(email) {
  return email[0]?.toUpperCase() || ''
}

function getPageSubtitle() {
  const routeName = route.meta.name;
  const subtitles = {
    'email': 'Manage your inbox efficiently',
    'send': 'Sent messages and delivery status',
    'draft': 'Your saved drafts',
    'star': 'Important starred messages',
    'setting': 'Customize your preferences',
    'analysis': 'Email analytics and insights',
    'user': 'User management and permissions',
    'all-email': 'All system emails overview',
    'role': 'Role and permission management',
    'reg-key': 'Invitation codes management',
    'sys-setting': 'System configuration'
  };
  return subtitles[routeName] || 'Welcome to your dashboard';
}

</script>

<style>
.user-dropdown {
  color: var(--el-text-color-primary) !important;
  border-radius: 16px !important;
  backdrop-filter: blur(20px) !important;
  background: rgba(255, 255, 255, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1) !important;
}
</style>

<style lang="scss" scoped>
.premium-header {
  height: 80px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  position: relative;
  z-index: 10;
  
  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.1), transparent);
  }

  &.not-send {
    .compose-button {
      display: none;
    }
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 24px;
    flex: 1;
  }

  .hamburger-wrapper {
    display: flex;
    align-items: center;
  }

  .breadcrumb-section {
    .page-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--el-text-color-primary);
      margin: 0;
      line-height: 1.2;
    }

    .page-subtitle {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin: 2px 0 0 0;
      font-weight: 400;
    }
  }

  .compose-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    font-weight: 500;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
      background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
    }

    .compose-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .compose-text {
      font-size: 14px;
      font-weight: 500;
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;

    .action-item {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: rgba(0, 0, 0, 0.04);
      color: var(--el-text-color-primary);

      &:hover {
        background: rgba(102, 126, 234, 0.1);
        color: #667eea;
        transform: translateY(-1px);
      }
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      background: rgba(0, 0, 0, 0.04);

      &:hover {
        background: rgba(102, 126, 234, 0.1);
        transform: translateY(-1px);
      }

      .user-avatar {
        .avatar-text {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }
      }

      .user-info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;

        .user-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          line-height: 1.2;
        }

        .user-role {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          line-height: 1.2;
        }
      }

      .dropdown-icon {
        color: var(--el-text-color-secondary);
        transition: transform 0.3s ease;
      }
    }
  }
}

.user-details {
  width: 320px;
  padding: 24px;
  
  .details-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .details-avatar {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 700;
    }

    .details-info {
      flex: 1;

      .user-name {
        font-size: 18px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        margin-bottom: 4px;
      }

      .detail-email {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        cursor: pointer;
        margin-bottom: 8px;
        
        &:hover {
          color: var(--el-color-primary);
        }
      }
    }
  }

  .stats-section {
    margin-bottom: 24px;

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--el-border-color-lighter);

      &:last-child {
        border-bottom: none;
      }

      .stat-label {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        font-weight: 500;
      }

      .stat-value {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
      }
    }
  }

  .logout-section {
    .el-button {
      width: 100%;
      height: 40px;
      border-radius: 10px;
    }
  }
}

@media (max-width: 768px) {
  .premium-header {
    padding: 0 16px;
    height: 70px;

    .breadcrumb-section {
      .page-title {
        font-size: 20px;
      }

      .page-subtitle {
        font-size: 12px;
      }
    }

    .compose-button {
      .compose-text {
        display: none;
      }
    }

    .user-profile {
      .user-info {
        display: none;
      }
    }
  }
}
</style>