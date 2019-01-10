<template>
  <el-row id="app">
    <el-col :span="4" class="app-sidebar">
      <div class="app-sidebar__header">
        <i  class="sky-icon sky-logo" style="font-size: 3rem"/>
      </div>
      <div class="app-sidebar__items-container">
        <div class="sidebar-item" v-for="item in sidebarItems" :class="[{'is-active':item.selected}]" @click="toggleItem(item)">
          <i :class="['sky-'+item.icon]" class="sky-icon sidebar-item__icon"/>
          <div class="sidebar-item__title">{{item.title}}</div>
        </div>
      </div>
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
        sidebarItems:[]
      }
    },
    created(){
      this.init();
    },
    methods:{
      init(){
        this.sidebarItems=[
          {title:"设备",link:"/manage_device",selected:true,icon:"tag"},
          {title:"视频",link:"/manage_video",selected:false,icon:"menu"},
          {title:"菜单",link:"/manage_video",selected:false,icon:"tag"},
          {title:"标签",link:"/manage_video",selected:false,icon:"menu"}
        ]
      },
      toggleItem(item){
        if(item.selected){
          return;
        }
        this.sidebarItems.forEach((item)=>{
          item.selected=false;
        })
        item.selected=true;
      }
    }
  }
</script>

<style>
  @import "assets/iconfont/iconfont.css";
  @import "../sk-theme/lib/index.css";
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
</style>
