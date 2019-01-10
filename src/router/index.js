import Vue from 'vue'
import Router from 'vue-router'
import mdevice from '@/components/mdevice'
//const homepage = () => import('@/components/homepage')
//const listpage = () => import('@/components/listpage')

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'mdevice',
      component: mdevice
    },
  ]
})
