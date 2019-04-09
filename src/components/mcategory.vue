<template>
  <div class="mcategory">
    <div class="mcategory__main">
      <el-row class="mcategory__tools">
        <el-col :span="2" :offset="22">
          <el-button class="mcategory-tools__button" type="primary" icon="el-icon-plus" @click="OpenAddCategoryDialog">新增</el-button>
        </el-col>
      </el-row>
        <div class="mcategory__table">
          <el-row class="mcategory-table__header">
            <el-col :span="2">Id</el-col>
            <el-col :span="8" >菜单名</el-col>
            <el-col :span="12">描述</el-col>
            <el-col :span="2" style="text-align: center">操作</el-col>
          </el-row>
          <el-scrollbar class="m-el-scrollbar">
            <div class="mcategory-table__body">
              <el-row v-for="item in categories" class="mcategory-table__tr">
                <el-col :span="2">{{item.Id}}</el-col>
                <el-col :span="8">{{item.Name}}</el-col>
                <el-col :span="12">{{item.Description}}</el-col>
                <el-col :span="2" style="text-align: center">
                  <el-button  type="text" @click="OpenEditCategoryDialog(item)">编辑</el-button>
                  <el-button type="text" @click="OpenDeleteCategoryDialog(item)">删除</el-button>
                </el-col>
              </el-row>
            </div>
          </el-scrollbar>
        </div>
      <el-dialog
      title="添加菜单"
      :visible.sync="addCategoryDialogVisible"
      width="30%">
      <el-input style="margin-bottom: 2rem" placeholder="菜单名" v-model="addCategoryData.Name"></el-input>
      <el-input style="margin-bottom: 2rem" placeholder="菜单描述" v-model="addCategoryData.Description"></el-input>
      <span slot="footer" class="dialog-footer">
    <el-button @click="addCategoryDialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="addCategoryToServer">添加</el-button>
  </span>
    </el-dialog>
      <el-dialog
        title="编辑菜单"
        :visible.sync="editCategoryDialogVisible"
        width="30%">
        <span>菜单名</span>
        <el-input style="margin-bottom: 2rem;margin-top: 0.5rem" placeholder="菜单名" v-model="editCategoryData.Name"></el-input>
        <span>菜单描述</span>
        <el-input style="margin-bottom: 2rem;margin-top: 0.5rem" placeholder="菜单描述" v-model="editCategoryData.Description"></el-input>
        <span slot="footer" class="dialog-footer">
    <el-button @click="editCategoryDialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="uploadCategoryToServer">修改</el-button>
  </span>
      </el-dialog>
      <el-dialog
        title="提示"
        :visible.sync="deleteCategoryDialogVisible"
        width="30%">
        <span>确认删除这个菜单和这个菜单下的所有标签吗？</span>
        <span slot="footer" class="dialog-footer">
    <el-button @click="deleteCategoryDialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="deleteCategoryToServer">删除</el-button>
  </span>
      </el-dialog>
    </div>
  </div>
</template>

<script>
  import EfList from "./common/ef-list/list";
  export default {
    name: "mcategory",
    components: {EfList},
    data() {
      return {
        activeIndex: '1',
        categories:[],
        tags:[],
        addCategoryDialogVisible:false,
        editCategoryDialogVisible:false,
        deleteCategoryDialogVisible:false,
        curCategory:{},
        editCategoryData:{
          Name:"",
          Description:""
        },
        addCategoryData:{
          Name:"",
          Description:""
        }
      }
    },
    created() {
      this.init();
    },
    methods: {
      init() {
        this.fetchData();
      },
     fetchData(){
        this.axios.get("/ccweb/api/categories/list").then((res)=>{
          this.categories=res.data;
        })
      },
      OpenAddCategoryDialog(){
        this.addCategoryDialogVisible=true;
      },
      OpenEditCategoryDialog(curCategory){
        this.curCategory=curCategory;
        this.editCategoryData.Name=this.curCategory.Name;
        this.editCategoryData.Description=this.curCategory.Description;
        this.editCategoryDialogVisible=true;
      },
      OpenDeleteCategoryDialog(curCategory){
        this.curCategory=curCategory;
        this.deleteCategoryDialogVisible=true;
      },
      addCategoryToServer(){
        if(this.addCategoryData.Name==""){
          this.$notify.info({
            title: '消息',
            message: '菜单名不能为空！'
          });
          return;
        }
        this.axios.post("/ccweb/api/categories/create",{
          Id:0,
          Description: this.addCategoryData.Description,
          Name:this.addCategoryData.Name,
          Tags:null,
          Resources:null
        }).then((res)=>{
          this.addCategoryData.Description="";
          this.addCategoryData.Name="";
          this.$notify.info({
            title: '消息',
            message: '菜单添加成功！'
          });
          this.fetchData();
          this.addCategoryDialogVisible=false;
        })
      },
      uploadCategoryToServer(){
        if(this.curCategory.Name==""){
          this.$notify.info({
            title: '消息',
            message: '菜单名不能为空！'
          });
          return;
        }
        this.axios.post("/ccweb/api/categories/update",{
            Id:this.curCategory.Id,
            Description: this.editCategoryData.Description,
            Name:this.editCategoryData.Name,
            Tags:this.curCategory.Tags,
            Resources:this.curCategory.Resources
          }
        ).then((res)=>{
          this.$notify.info({
            title: '消息',
            message: '菜单修改成功！'
          });
          this.editCategoryDialogVisible=false;
          this.fetchData();
        })
      },
      deleteCategoryToServer(){
        this.axios.post("/ccweb/api/categories/delete",{
            Id:this.curCategory.Id
          }
        ).then((res)=>{
          this.$notify.info({
            title: '消息',
            message: '菜单删除成功！'
          });
          this.deleteCategoryDialogVisible=false;
          this.fetchData();
        });
      }
    }
  }
</script>

<style scoped>
</style>

<style>
  .el-input__inner {
    background-color: transparent;
    color: black;
  }
  .m-el-scrollbar{
    height: 80%;
    width: 100%;
  }
  .m-el-scrollbar>.el-scrollbar__wrap {
    overflow-x: hidden;
  }
</style>
