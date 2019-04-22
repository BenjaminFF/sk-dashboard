<template>
  <el-row id="app">
    <el-col :span="4" class="app-sidebar">
      <div class="app-sidebar__header">
        <img src="./assets/yidonglogo.svg" style="width: 20rem">
      </div>
      <el-menu
        :router="true"
        :default-active="defaultActive"
        background-color="#1F62B0"
        text-color="#fff">
        <el-menu-item index="/mdevice">
          <span slot="title">设备管理</span>
        </el-menu-item>
        <el-submenu index="2" style="color: white">
          <template slot="title">
            <span>视频管理</span>
          </template>
          <el-menu-item index="/upload_video" class="m-el-submenu-item">视频上传</el-menu-item>
          <el-menu-item index="/mvideo" class="m-el-submenu-item">视频列表</el-menu-item>
        </el-submenu>
        <el-submenu index="1" style="color: white">
          <template slot="title">
            <span>菜单和标签管理</span>
          </template>
          <el-menu-item index="/mcategory" class="m-el-submenu-item">菜单</el-menu-item>
          <el-menu-item index="/mtag" class="m-el-submenu-item">标签</el-menu-item>
        </el-submenu>
        <el-submenu index="3" style="color: white">
          <template slot="title">
            <span>任务管理</span>
          </template>
          <el-menu-item index="/mtask" class="m-el-submenu-item">下发任务</el-menu-item>
        </el-submenu>
      </el-menu>
    </el-col>
    <el-col :span="20" class="main">
      <router-view></router-view>
    </el-col>
  </el-row>
</template>

<script>

  export default {
    name: 'App',
    data() {
      return {
        defaultActive:false
      }
    },
    created(){
      this.init();
    },
    methods:{
      init(){
        console.log(this.$router.currentRoute.path);
        this.defaultActive=this.$router.currentRoute.path;
      },
    }
  }
</script>


<style>
  @import "assets/iconfont/iconfont.css";
  @import "assets/lib/index.css";
  @import "../sk-theme/lib/index.css";
  @import "../node_modules/animate.css/animate.css";
  body, html {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  body, html, div {
    margin: 0;
    padding: 0;
  }

  #app{
    width: 100%;
    height: 100%;
  }

  .main{
    height: 100%;
    background-color: rgba(179, 212, 252, 0.11);
    position: relative;
  }

  .m-el-submenu-item{
    background-color: transparent !important;
  }

  .el-menu{
    border-right: none !important;
    user-select: none;
  }

  .el-menu-item, .el-submenu__title{
    font-size: 1rem;
    background-color: transparent;
  }

  .el-menu-item.is-active{
    background-color: rgba(179, 212, 252, 0.11) !important;
  }

  .el-menu-item:hover{
    background-color: rgba(179, 212, 252, 0.11) !important;
  }
  .el-submenu__title:hover{
    background-color: rgba(179, 212, 252, 0.11) !important;
  }
</style>
