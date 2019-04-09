<template>
  <div class="l-mtag">
    <div class="l-mtag__main">
      <div class="l-mtag-tools">
        <el-col :span="2" :offset="22">
          <el-button class="l-mtag-tools__button" type="primary" icon="el-icon-plus" @click="addDialogVisible=true">新增
          </el-button>
        </el-col>
      </div>
      <div class="l-mtag-table">
        <el-row class="l-mtag-table__header">
          <el-col :span="2">Id</el-col>
          <el-col :span="8">标签名</el-col>
          <el-col :span="12">所属菜单</el-col>
          <el-col :span="2" style="text-align: center">操作</el-col>
        </el-row>
        <el-scrollbar class="mtag-el-scrollbar">
          <div class="l-mtag-table__body">
            <el-row v-for="item in tags" class="l-mtag-table__tr">
              <el-col :span="2">{{item.Id}}</el-col>
              <el-col :span="8">{{item.Name}}</el-col>
              <el-col :span="12">{{item.Category.Name}}</el-col>
              <el-col :span="2" style="text-align: center">
                <el-button type="text" @click="openEditDialog(item)">编辑</el-button>
                <el-button type="text" @click="openDelDialog(item)">删除</el-button>
              </el-col>
            </el-row>
          </div>
        </el-scrollbar>
      </div>
    </div>
    <el-dialog
      title="添加标签"
      :visible.sync="addDialogVisible"
      :before-close="beforeAddDialogClose"
      custom-class="mtag-dialog"
      width="30%">
      <el-input style="margin-bottom: 2rem" placeholder="标签名" v-model="addTagData.Name"></el-input>
      <el-select style="margin-bottom: 2rem;width: 100%" placeholder="请选择" v-model="addTagData.curCategoryId">
        <el-option
          v-for="item in categories"
          :key="item.value"
          :label="item.Name"
          :value="item.Id">
        </el-option>
      </el-select>
      <span>标签背景</span>
      <ef-list style="width: 100%;margin-top: 1rem;" :wrapHeight="dialogScrollbarWidth+'px'" :list="tagIcons" ref="mTagAddEfList">
        <el-row v-for="row in tagIcons" :gutter="10" style="margin-bottom: 10px;width: 100%;padding-right: 10px">
          <el-col v-for="tagIcon in row" :span="6" style="position: relative" @click.native="toggleIcons(tagIcon)">
            <img :src="tagIcon.Uri" width="100%" height="60" style="cursor: pointer;;border-radius: 5px;background-color: #0063b2">
            <div class="icon-selected" v-if="tagIcon.selected"><i class="el-icon-check"></i></div>
          </el-col>
        </el-row>
      </ef-list>
      <div style="width: 100%;text-align: center;margin-top: 1rem;font-size: 1rem;">
        <i class="el-icon-arrow-down" style="cursor: pointer;transition: all .5s" @click="arrowClick" :style="{transform:'rotate('+arrowRotateDegree+'deg)'}"></i>
      </div>
      <span slot="footer" class="dialog-footer">
    <el-button @click="closeAddDialog">取 消</el-button>
    <el-button type="primary" @click="addTagToServer">添加</el-button>
  </span>
    </el-dialog>
    <el-dialog
      title="编辑标签"
      :visible.sync="editDialogVisible"
      :before-close="closeEditDialog"
      width="30%">
      <span>标签名</span>
      <el-input style="margin-bottom: 2rem;margin-top: 0.5rem" placeholder="标签名" v-model="editTagData.Name"></el-input>
      <span>所属菜单</span>
      <el-select style="margin-bottom: 2rem;width: 100%;margin-top: 0.5rem" placeholder="请选择" v-model="editTagData.curCategoryId">
        <el-option
          v-for="item in categories"
          :key="item.Id"
          :label="item.Name"
          :value="item.Id">
        </el-option>
      </el-select>
      <span>标签背景</span>
      <ef-list style="width: 100%;margin-top: 1rem;" :wrapHeight="dialogScrollbarWidth+'px'" :list="tagIcons" ref="mTagAddEfList">
        <el-row v-for="row in tagIcons" :gutter="10" style="margin-bottom: 10px;width: 100%;padding-right: 10px">
          <el-col v-for="tagIcon in row" :span="6" style="position: relative" @click.native="toggleIcons(tagIcon)">
            <img :src="tagIcon.Uri" width="100%" height="60" style="cursor: pointer;;border-radius: 5px;background-color: #0063b2">
            <div class="icon-selected" v-if="tagIcon.selected"><i class="el-icon-check"></i></div>
          </el-col>
        </el-row>
      </ef-list>
      <div style="width: 100%;text-align: center;margin-top: 1rem;font-size: 1rem;">
        <i class="el-icon-arrow-down" style="cursor: pointer;transition: all .5s" @click="arrowClick" :style="{transform:'rotate('+arrowRotateDegree+'deg)'}"></i>
      </div>
      <span slot="footer" class="dialog-footer">
    <el-button @click="closeEditDialog">取 消</el-button>
    <el-button type="primary" @click="editTagToServer">修改</el-button>
  </span>
    </el-dialog>
    <el-dialog
      title="提示"
      :visible.sync="delDialogVisible"
      width="30%">
      <span>确认删除这个标签和这个标签下的所有文件吗？</span>
      <span slot="footer" class="dialog-footer">
    <el-button @click="delDialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="deleteTagToServer">删除</el-button>
  </span>
    </el-dialog>
  </div>
</template>

<script>
  import EfList from "./common/ef-list/list";
  export default {
    name: "mtag",
    components: {EfList},
    data() {
      return {
        tags: [],
        categories: [],
        curCategoryId: "",
        curTags: [],
        addDialogVisible: false,
        editDialogVisible: false,
        delDialogVisible: false,
        editTagData: {},
        addTagData: {},
        curTag: {},
        tagIcons:[],
        dialogScrollbarWidth:60,
        arrowRotateDegree:0,
        curIcon:{}
      }
    },
    created() {
      this.init();
    },
    methods: {
      async init() {
        await this.fetchData();
        this.curCategoryId = this.categories[0].Id;
        this.curTags = this.getTagsByCategoryId(this.curCategoryId);
        this.addTagData = {
          Id: 0,
          Description: "",
          Name: "",
          curCategoryId: "",
          Category: {},
          Resources: null,
        }
        this.editTagData = {
          Id: "",
          Description: "",
          Name: "",
          curCategoryId: "",
          Category: {},
          Resources: null,
        }
      },
      async initByCategoryId(categoryId) {
        await this.fetchData();
        this.curTags = this.getTagsByCategoryId(categoryId);
        this.addTagData = {
          Id: 0,
          Description: "",
          Name: "",
          curCategoryId: "",
          Category: {},
          Resources: null
        }
        this.editTagData = {
          Id: "",
          Description: "",
          Name: "",
          curCategoryId: "",
          Category: {},
          Resources: null,
        }
      },
      async fetchData() {
        await this.axios.get("/ccweb/api/categories/list").then((res) => {
          this.categories = res.data;
        });
        await this.axios.get("/ccweb/api/tags/list").then((res) => {
          this.tags = res.data;
          console.log(this.tags);
        });
        await this.axios.get("/ccweb/api/icons/list?type=101").then((res) => {
          console.log(res.data);
          let tagIcons = [];
          let defaultIcon={
            selected:true,
            Id:-1,
          }
          tagIcons.push(defaultIcon);
          res.data.forEach((tagIcon) => {
            tagIcon.selected = false;
            tagIcons.push(tagIcon);
          })
          this.tagIcons = this.groupArray(tagIcons, 4);
        });
      },
      groupArray(arr, rowItems) {
        let row = [];
        let groupedArr = [];
        for (let i = 0; i < arr.length; i++) {
          row.push(arr[i]);
          if (row.length == rowItems || i == arr.length - 1) {
            groupedArr.push(row);
            row = [];
          }
        }
        return groupedArr;
      },
      getTagsByCategoryId(categoryId) {
        let tags = [];
        this.tags.forEach((tag) => {
          if (tag.Category.Id == categoryId) {
            tags.push(tag);
          }
        });
        return tags;
      },
      toggleTags() {
        this.curTags = this.getTagsByCategoryId(this.curCategoryId);
      },
      addTagToServer() {
        if (this.addTagData.Name == "") {
          this.$notify.info({
            title: '消息',
            message: '标签名不能为空！'
          });
          return;
        }
        if (this.addTagData.curCategoryId == "") {
          this.$notify.info({
            title: '消息',
            message: '请选择一个菜单！'
          });
          return;
        }
        this.categories.forEach((category) => {
          if (category.Id == this.addTagData.curCategoryId) {
            this.addTagData.Category = category;
          }
        })
        if(this.curIcon.Id!=-1){       //-1表示为默认Icon
          this.addTagData.Icon=this.curIcon;
        }
        this.axios.post("/ccweb/api/tags/create", this.addTagData).then((res) => {
          this.initByCategoryId(this.curCategoryId);
          this.$notify.info({
            title: '消息',
            message: '标签添加成功！'
          });
          this.closeAddDialog();
        })
      },
      openDelDialog(tag) {
        this.curTag = tag;
        this.delDialogVisible = true;
      },
      deleteTagToServer() {
        this.axios.post("/ccweb/api/tags/delete", {Id: this.curTag.Id})
          .then((res) => {
            this.initByCategoryId(this.curCategoryId);
            this.$notify.info({
              title: '消息',
              message: '标签删除成功！'
            });
            this.delDialogVisible = false;
          })
      },
      openEditDialog(tag) {
        this.editTagData.Id = tag.Id;
        this.editTagData.Name = tag.Name;
        this.editTagData.curCategoryId = tag.Category.Id;
        if(tag.Icon!=null){
          this.initTagIcons();
          this.tagIcons[0][0].selected=false;
          this.tagIcons.forEach((row)=>{
            row.forEach((tagIcon)=>{
              if(tagIcon.Id==tag.Icon.Id){
                tagIcon.selected=true;
                this.curIcon=tagIcon;
              }
            })
          })
        }else {
          this.initTagIcons();
        }
        this.editDialogVisible = true;
      },
      editTagToServer() {
        if (this.editTagData.Name == "") {
          this.$notify.info({
            title: '消息',
            message: '标签名不能为空！'
          });
          return;
        }
        this.categories.forEach((category) => {
          if (category.Id == this.editTagData.curCategoryId) {
            this.editTagData.Category = category;
          }
        })
        if(this.curIcon.Id!=-1){
          this.editTagData.Icon=this.curIcon;
        }else {
          this.editTagData.Icon=null;
        }
        console.log(this.editTagData);
        this.axios.post("/ccweb/api/tags/update", this.editTagData).then((res) => {
          this.initByCategoryId(this.curCategoryId);
          this.$notify.info({
            title: '消息',
            message: '标签修改成功！'
          });
          this.initTagDialog();
          this.editDialogVisible = false;
        })
      },
      initTagDialog(){
        this.dialogScrollbarWidth=60;
        this.arrowRotateDegree=0;
        this.initTagIcons();
      },
      closeAddDialog(){
        this.initTagDialog();
        this.addDialogVisible=false;
      },
      closeEditDialog(done){
        this.initTagDialog();
        this.editDialogVisible=false;
        if(done!=undefined){
          done();
        }
      },
      beforeAddDialogClose(done){
        this.initTagDialog();
        done();
      },
      arrowClick(){
        if(this.dialogScrollbarWidth==60){
          this.dialogScrollbarWidth=240;
          this.arrowRotateDegree=180;
        }else {
          this.dialogScrollbarWidth=60;
          this.arrowRotateDegree=0;
        }
        this.$nextTick(()=>{
          this.$refs['mTagAddEfList'].updateThumb();
        });
      },
      toggleIcons(tagIcon){
        this.tagIcons.forEach((row)=>{
          row.forEach((tagIcon)=>{
            tagIcon.selected=false;
          })
        })
        tagIcon.selected=true;
        this.curIcon=tagIcon;
      },
      initTagIcons(){
        console.log(this.tagIcons);
        this.tagIcons.forEach((row)=>{
          row.forEach((tagIcon)=>{
            tagIcon.selected=false;
          })
        })
        this.tagIcons[0][0].selected=true;
        this.curIcon=this.tagIcons[0][0];
      }
    }
  }
</script>

<style scoped>
  .icon-selected{
    width: 1.5rem;
    height: 1.5rem;
    position: absolute;
    color: black;
    border-radius: 1.2rem;
    background-color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    left: 50%;
    top: 50%;
    transform: translate(-50%,-50%);
    cursor: pointer;
  }
</style>
<style>
  .mtag-dialog{
    min-width: 20rem;
  }

  .el-input__inner {
    background-color: transparent;
    color: black;
  }

  .mtag-el-scrollbar {
    height: 90%;
    width: 100%;
  }

  .mtag-el-scrollbar > .el-scrollbar__wrap {
    overflow-x: hidden;
  }

</style>
