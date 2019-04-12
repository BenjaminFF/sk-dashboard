import Vue from 'vue'
import Router from 'vue-router'
import mdevice from '@/components/mdevice'
import mcategory from '@/components/mcategory'
import mvideo from '@/components/mvideo'
import upload_video from '@/components/upload_video'
import mtag from '@/components/mtag'
import mtask from '@/components/mtask'
//const homepage = () => import('@/components/homepage')
//const listpage = () => import('@/components/listpage')

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'index',
      component: mdevice
    },
    {
      path: '/mcategory',
      name: 'mcategory',
      component: mcategory
    },
    {
      path: '/mdevice',
      name: 'mdevice',
      component: mdevice
    },
    {
      path: '/mtag',
      name: 'mtag',
      component: mtag
    },
    {
      path: '/mvideo',
      name: 'mvideo',
      component: mvideo
    },
    {
      path: '/upload_video',
      name: 'upload_video',
      component: upload_video
    },
    {
      path: '/mtask',
      name: 'mtask',
      component: mtask
    }
  ]
})
