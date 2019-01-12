<template>
  <div class="l-mtag">
    <div class="l-mtag-tools">
      <el-col :span="10">
        <span>所属菜单：</span>
        <el-select v-model="curCategoryId" @change="toggleTags()">
          <el-option
            v-for="item in categories"
            :key="item.value"
            :label="item.Name"
            :value="item.Id">
          </el-option>
        </el-select>
      </el-col>
      <el-col :span="2" :offset="12">
        <el-button class="l-mtag-tools__button" type="primary" icon="el-icon-plus" @click="addDialogVisible=true">新增
        </el-button>
      </el-col>
    </div>
    <div class="l-mtag-content">
      <el-scrollbar style="height: 90%;width: 100%;">
        <div style="width: 90%;height: fit-content;margin-left: 5%">
          <div class="l-mtag-content__tagItem" v-for="tag in curTags">
            <span style="font-size: 2rem;margin-left: 3rem">{{tag.Name}}</span>
            <el-button-group style="margin-right: 3rem">
              <el-button icon="el-icon-edit" circle type="text" style="font-size: 1.2rem" @click="openEditDialog(tag)"></el-button>
              <el-button icon="el-icon-delete" circle type="text" style="font-size: 1.2rem" @click="openDelDialog(tag)"></el-button>
            </el-button-group>
          </div>
        </div>
      </el-scrollbar>
    </div>
    <el-dialog
      title="添加标签"
      :visible.sync="addDialogVisible"
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
      <span slot="footer" class="dialog-footer">
    <el-button @click="addDialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="addTagToServer">添加</el-button>
  </span>
    </el-dialog>
    <el-dialog
      title="编辑标签"
      :visible.sync="editDialogVisible"
      width="30%">
      <el-input style="margin-bottom: 2rem" placeholder="标签名" v-model="editTagData.Name"></el-input>
      <el-select style="margin-bottom: 2rem;width: 100%" placeholder="请选择" v-model="editTagData.curCategoryId">
        <el-option
          v-for="item in categories"
          :key="item.Id"
          :label="item.Name"
          :value="item.Id">
        </el-option>
      </el-select>
      <span slot="footer" class="dialog-footer">
    <el-button @click="editDialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="editTagToServer">修改</el-button>
  </span>
    </el-dialog>
    <el-dialog
      title="提示"
      :visible.sync="delDialogVisible"
      width="30%">
      <span>确认删除这个Tag吗？</span>
      <span slot="footer" class="dialog-footer">
    <el-button @click="delDialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="deleteTagToServer">删除</el-button>
  </span>
    </el-dialog>
  </div>
</template>

<script>
  export default {
    name: "mtag",
    data() {
      return {
        tags: [],
        categories: [],
        curCategoryId: "",
        curTags: [],
        addDialogVisible: false,
        editDialogVisible:false,
        delDialogVisible: false,
        editTagData:{},
        addTagData: {},
        curTag: {}
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
        this.axios.post("/ccweb/api/tags/create", this.addTagData).then((res) => {
          this.initByCategoryId(this.curCategoryId);
          this.$notify.info({
            title: '消息',
            message: '标签添加成功！'
          });
          this.addDialogVisible = false;
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
      editTagToServer(){
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
        console.log(this.editTagData);
        this.axios.post("/ccweb/api/tags/update", this.editTagData).then((res) => {
          this.initByCategoryId(this.curCategoryId);
          this.$notify.info({
            title: '消息',
            message: '标签修改成功！'
          });
          this.editDialogVisible = false;
        })
      },
      openEditDialog(tag){
        this.editTagData.Id=tag.Id;
        this.editTagData.Name=tag.Name;
        this.editTagData.curCategoryId=tag.Category.Id;
        this.editDialogVisible = true;
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
  
  .el-select-dropdown__list{
    height: fit-content;
  }
</style>
