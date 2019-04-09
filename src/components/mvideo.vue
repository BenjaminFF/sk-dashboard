<template>
  <div class="l-mvideo">
    <div class="l-mvideo__main">
      <div class="l-mvideo-table">
        <el-row class="l-mvideo-table__header">
          <el-col :span="5">文件名字</el-col>
          <el-col :span="3">所属菜单</el-col>
          <el-col :span="3">所属标签</el-col>
          <el-col :span="3">大小</el-col>
          <el-col :span="3">格式</el-col>
          <el-col :span="4">上传时间</el-col>
          <el-col :span="3" style="text-align: center">操作</el-col>
        </el-row>
        <ef-list class="m-el-scrollbar" ref="elscrollbar" :wrap-height="'100%'"
                 v-on:handleScroll="handleScroll" :list="resources">
          <div class="l-mvideo-table__body">
            <el-row v-for="item in resources" class="l-mvideo-table__tr">
              <el-col :span="5">{{item.Name.length<25?item.Name:item.Name.substring(0,25)+"..."}}</el-col>
              <el-col :span="3">{{item.Category.Name}}</el-col>
              <el-col :span="3">{{item.tagsName}}</el-col>
              <el-col :span="3">{{getSizeStrByByte(item.Size)}}</el-col>
              <el-col :span="3">{{item.FileType.Name}}</el-col>
              <el-col :span="4">{{item.CreatedTime}}</el-col>
              <el-col :span="3" style="text-align: center">
                <el-button type="text" @click="OpenEditDialog(item)">编辑</el-button>
                <el-button type="text" @click="OpenDeleteDialog(item)">删除</el-button>
              </el-col>
            </el-row>
          </div>
        </ef-list>
        <i class="mvideo-icon-down el-icon-arrow-down animated slideOutDown" v-if="downIconVisible"></i>
        <el-pagination
          class="pagination"
          :current-page.sync="resourcePages.curPage"
          @current-change="handlePageChange"
          layout="prev, pager, next, jumper"
          :page-count="resourcePages.totalPages">
        </el-pagination>
      </div>
    </div>
    <el-dialog
      title="提示"
      :visible.sync="deleteDialogVisible"
      width="30%">
      <span>确认删除这个资源吗？</span>
      <span slot="footer" class="dialog-footer">
    <el-button @click="deleteDialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="deleteResourceToServer" :loading="isUploading">删除</el-button>
  </span>
    </el-dialog>
    <el-dialog
      title="修改"
      :before-close="editDialogClosed"
      :visible.sync="editDialogVisible"
      width="25rem">
      <el-form ref="ruleForm" :model="form" label-width="80px" :rules="rules" class="demo-ruleForm"
               style="width: 80%;margin-left: 10%">
        <el-form-item label="文件封面">
          <div class="mvideo-upload">
            <el-upload
              ref="mUpload"
              action="/ccweb/api/icons/upload"
              class="edit-upload"
              :auto-upload="false"
              :on-change="fileOnChange"
              :on-success="picSuccess"
              :file-list="curPicList"
              list-type="picture-card">
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item label="文件名" prop="Name">
          <el-input v-model="form.Name"></el-input>
        </el-form-item>
        <el-form-item label="全景模式" prop="selectedFullMode">
          <el-select v-model="form.selectedFullMode" placeholder="请选择全景模式">
            <el-option :label="fullMode" :value="fullMode" v-for="fullMode in fullModes"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="立体格式" prop="selectedCubeFormat">
          <el-select v-model="form.selectedCubeFormat" placeholder="请选择立体格式">
            <el-option :label="cubeFormat" :value="cubeFormat" v-for="cubeFormat in cubeFormats"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="所属菜单" prop="selectedCategoryId">
          <el-select v-model="form.selectedCategoryId" placeholder="请选择菜单" @change="categoryChanged">
            <el-option :label="category.Name" :value="category.Id" v-for="category in categories"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="所属标签" prop="selectedTagId">
          <el-select v-model="form.selectedTagId" placeholder="请选择标签">
            <el-option :label="tag.Name" :value="tag.Id" v-for="tag in form.curTags"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
    <el-button @click="editDialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="submitForm('ruleForm')" :loading="isUploading">修改</el-button>
  </span>
    </el-dialog>
  </div>
</template>

<script>
  import EfList from "./common/ef-list/list";
  export default {
    name: "mvideo",
    components: {EfList},
    data() {
      return {
        resources: [],
        deleteDialogVisible: false,
        editDialogVisible: false,
        curResource: {},
        form: {},
        categories: [],
        tags: [],
        curPicInfo: {},
        curPicList: [],
        picChanged: false,
        isUploading: false,
        videoFormats: [],
        fullModes: [],
        cubeFormats: [],
        rules:[],
        resourcePages: {},
        downIconVisible:false
      }
    },
    created() {
      this.init();
    },
    methods: {
      async init() {
        await this.fetchData();
        let videoFormats = [
          {Id: 1, Name: "窗口视频2D"},
          {Id: 2, Name: "窗口视频3D左右"},
          {Id: 3, Name: "窗口视频3D上下"},
          {Id: 4, Name: "180视频2D"},
          {Id: 5, Name: "180视频3D左右"},
          {Id: 6, Name: "180视频3D上下"},
          {Id: 7, Name: "360视频2D"},
          {Id: 8, Name: "360视频3D左右"},
          {Id: 9, Name: "360视频3D上下"}
        ]
        let rules = {
          Name:[
            {required:true,message:'名字不能为空'},
          ],
          selectedCubeFormat: [
            {required: true, message: '请选择立体格式', trigger: 'change'}
          ],
          selectedFullMode: [
            {required: true, message: '请选择全景模式', trigger: 'change'}
          ],
          selectedCategoryId: [
            {required: true, message: '请选择菜单', trigger: 'change'}
          ],
          selectedTagId: [
            {required: true, message: '请选择标签(如果为空，请切换菜单)', trigger: 'change'}
          ],
        }
        this.videoFormats=videoFormats;
        this.fullModes=["窗口视频", "180视频", "360视频"];
        this.cubeFormats=["2D", "3D左右", "3D上下"];
        this.rules=rules;
        this.form = {
          Name:"",
          selectedCubeFormat: "",
          selectedFullMode: "",
          selectedCategoryId: "",
          selectedTagId: "",
          curTags: [],
        }
      },
      async fetchData() {
        await this.axios.get('/ccweb/api/resources/count').then((res)=>{
          let numsperpage=50;
          let count=res.data;
          let totalPages = parseInt(count / numsperpage) == count / numsperpage ? parseInt(count / numsperpage) : parseInt(count / numsperpage) + 1;
          this.resourcePages = {
            curPage: 1,
            totalPages: totalPages,
            numsperpage: numsperpage
          }
        })
        await this.axios.get('/ccweb/api/resources/list',{
          params: {
            page: 1,
            numsperpage: 50,
          }
        }).then((res) => {
          console.log(res.data);
          for (let i = 0; i < res.data.length; i++) {
            let tagsName = "";
            if(res.data[i].Tags!=null){
              res.data[i].Tags.forEach((tag)=>{
                tagsName+=tag.Name;
              });
            }
            res.data[i].tagsName = tagsName;
            if (res.data[i].Category == null) {
              res.data[i].Category = {
                Id: 0,
                Name: ""
              }
            }
            if(res.data[i].FileType==null){
              res.data[i].FileType={
                Id:0,
                Name:""
              }
            }
          }
          //this.resources=res.data.concat(res.data);
          this.resources = res.data;
        });
        await this.axios.get("/ccweb/api/categories/list").then((res) => {
          this.categories = res.data;
        });
        await this.axios.get("/ccweb/api/tags/list").then((res) => {
          this.tags = res.data;
        });
        this.$nextTick(()=>{
          this.downIconVisible=this.$refs['elscrollbar'].thumbVisible();
        })
      },
      getSizeStrByByte(byteSize) {
        if (byteSize <= 1024) {
          return "1KB"
        } else if (byteSize > 1024 && byteSize <= 1024 * 1024) {
          return parseInt(byteSize / 1024) + 1 + "KB";
        } else {
          return parseFloat(byteSize / (1024 * 1024)).toFixed(2) + "M";
        }
      },
      OpenDeleteDialog(item) {
        this.curResource = item;
        this.deleteDialogVisible = true;
      },
      OpenEditDialog(item) {
        this.form = {
          Name:"",
          selectedCubeFormat: "",
          selectedFullMode: "",
          selectedCategoryId: "",
          selectedTagId: "",
          curTags: [],
        }
        this.form.Name=item.Name;
        this.curResource = item;
        this.curPicList = [];
        if (item.Icon != null) {
          this.curPicList = [{url: this.curResource.Icon.Uri}];
        }
        this.cubeFormats.forEach((cubeFormat) => {
          if (item.FileType.Name.includes(cubeFormat)) {
            this.form.selectedCubeFormat = cubeFormat;
          }
        });
        this.fullModes.forEach((fullMode) => {
          if (item.FileType.Name.includes(fullMode)) {
            this.form.selectedFullMode = fullMode;
          }
        });
        if(item.Category!=null){
          this.form.selectedCategoryId = item.Category.Id;
          this.form.curTags = this.getTagsByCategoryId(item.Category.Id);
        }
        if(item.Tags!=null){
          this.form.selectedTagId = item.Tags[0].Id;
        }
        this.editDialogVisible = true;
      },
      deleteResourceToServer() {
        this.isUploading=true;
        this.axios.post('/ccweb/api/resources/delete', {Id: this.curResource.Id}).then(res => {
          this.$notify.info({
            title: '消息',
            message: '资源删除成功！'
          });
          this.deleteDialogVisible = false;
          this.fetchData();
          this.isUploading=false;
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
      categoryChanged() {
        this.form.curTags = this.getTagsByCategoryId(this.form.selectedCategoryId);
        this.form.selectedTagId = this.form.curTags.length == 0 ? "" : this.form.curTags[0].Id;
      },
      submitForm(formName) {
        this.$refs[formName].validate((valid) => {
          if (valid) {
            this.isUploading = true;
            if (this.picChanged) {
              this.$refs['mUpload'].submit();
            } else {
              this.updateResource();
            }
            console.log(this.$refs['mUpload'].uploadFiles);
          } else {
            console.log('error submit!!');
            return false;
          }
        });
      },
      getFileTypeId() {
        let Id = 0;
        this.videoFormats.forEach((videoFormat) => {
          if (this.form.selectedFullMode + this.form.selectedCubeFormat == videoFormat.Name) {
            Id = videoFormat.Id;
          }
        })
        return Id;
      },
      picSuccess(response, file) {
        console.log(response);
        let img = new Image();
        img.src = file.url;
        response.Width = img.width;
        response.Height = img.height;
        response.Size = img.Size;
        response.FileType = {Id: 100};
        this.curPicInfo = response;
        this.updateResource();
      },
      async updateResource() {
        this.curResource.Name=this.form.Name;
        this.curResource.Category = {Id: this.form.selectedCategoryId};
        this.curResource.Tags = [{Id: this.form.selectedTagId}];
        this.curResource.FileType = {Id: this.getFileTypeId()};
        if (!this.picChanged) {
          this.curPicInfo = this.curResource.Icon;
        } else {
          this.curResource.Icon = this.curPicInfo;
        }
        await this.axios.post("/ccweb/api/icons/update", JSON.stringify(this.curPicInfo));
        await this.axios.post("/ccweb/api/resources/update", JSON.stringify(this.curResource))
          .then((res) => {
            this.$notify.info({
              title: '消息',
              message: '修改资源成功！'
            });
            this.init();
            this.isUploading=false;
            this.editDialogVisible = false;
            this.picChanged = false;
          })
      },
      editDialogClosed(done) {
        console.log(done);
        this.$refs['mUpload'].clearFiles();
        done();
      },
      fileOnChange(file, fileList) {
        console.log(fileList);
        let mFile = fileList[fileList.length - 1];
        this.curPicList = [mFile];
        if (!this.picChanged) {
          this.picChanged = true;
        }
        //this.$refs['mUpload'].clearFiles();
      },
      getResourceByPage(curPage, numsperpage) {
        this.$refs['elscrollbar'].$refs['wrap'].scrollTop = 0;
        this.axios.get('/ccweb/api/resources/list', {
          params: {
            page: curPage,
            numsperpage: numsperpage,
          }
        }).then((res) => {
          for (let i = 0; i < res.data.length; i++) {
            let tagsName = "";
            if(res.data[i].Tags!=null){
              res.data[i].Tags.forEach((tag)=>{
                tagsName+=tag.Name;
              });
            }
            res.data[i].tagsName = tagsName;
            if (res.data[i].Category == null) {
              res.data[i].Category = {
                Id: 0,
                Name: ""
              }
            }
            if(res.data[i].FileType==null){
              res.data[i].FileType={
                Id:0,
                Name:""
              }
            }
          }
          //this.resources=res.data.concat(res.data);
          this.resources = res.data;
          this.$nextTick(() => {
            this.$refs['elscrollbar'].updateThumb();
            this.downIconVisible=this.$refs['elscrollbar'].thumbVisible();
            console.log(this.$refs['elscrollbar'].thumbVisible());
          });
        });
      },
      handlePageChange() {
        console.log("curPage: " + this.resourcePages.curPage);
        this.getResourceByPage(this.resourcePages.curPage, this.resourcePages.numsperpage);
      },
      handleScroll(){
        this.downIconVisible=false;
        console.log('handleScroll');
      },
    }
  }
</script>

<style scoped>
  .pagination{
    position: absolute;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
  }
  .mvideo-icon-down{
    position: absolute;
    bottom: 10rem;
    left: 45%;
    font-size: 3rem;
    color: rgba(144, 147, 153, 0.8);
    animation-iteration-count: infinite;
  }
</style>

<style>
  .m-el-scrollbar {
    height: 80%;
    width: 100%;
  }

  .m-el-scrollbar .el-list__scrollbar__thumb {
    width: 5px !important;
  }

  .mvideo-upload {
    position: relative;
    width: fit-content;
    height: 10rem;
  }

  .mvideo-upload .el-upload-list__item {
    transition: none !important;
    -webkit-transition: none !important;
    position: absolute;
    left: 0;
    top: 0;
  }

  .mvideo-upload .el-upload--picture-card {
    position: absolute;
    left: 0;
    background-color: transparent;
  }

  .mvideo-upload .el-icon-plus {
    color: transparent;
  }
</style>
