<template>
  <div class="upload_video">
    <el-steps :active="stepBar.active" finish-status="success" class="steps-bar">
      <el-step title="上传文件"></el-step>
      <el-step title="补充信息"></el-step>
      <el-step title="成功"></el-step>
    </el-steps>
    <div class="steps-container">
      <div class="step1" v-if="step1.visible">
        <el-upload
          :disabled="step1.nextStepAble"
          ref="videoUpload"
          :on-change="videoOnChange"
          style="font-size: 1.2rem;width: 100%"
          action="/ccweb/api/resources/fileupload"
          :on-success="uploadSuccess"
          :auto-upload="false"
          :on-exceed="fileExceed"
          :on-remove="videoOnRemove"
          :on-progress="uploadProgress"
          :file-list="step1.fileList"
          :limit="1">
          <el-button slot="trigger" size="small" type="primary" style="font-size: 1rem" :disabled="step1.nextStepAble">
            选择文件
          </el-button>
          <el-button style="margin-left: 10px;font-size: 1rem" size="small" type="success" @click="submitUpload"
                     :disabled="step1.nextStepAble">
            上传到服务器
          </el-button>
          <div slot="tip" class="el-upload__tip" style="font-size: 1rem;margin-top: 2rem">请上传支持VR播放的视频文件</div>
        </el-upload>
        <div v-if="step1.isDecoding" style="margin-top: 1rem;font-size: 0.8rem;color: #606266">服务器正在转码...</div>
        <el-button style="position: absolute;top: 60%;font-size: 1rem" type="primary"
                   @click="startStep2()">下一步
        </el-button>
        <video ref="mVideo" autoplay style="display: none;">
        </video>
        <img ref="mOutputImg" style="display: none;"/>
      </div>
      <div class="step2" v-if="step2.visible">
        <el-form ref="ruleForm" :model="step2.form" label-width="80px" class="demo-ruleForm" :rules="step2.form.rules">
          <el-form-item label="文件封面">
            <div class="mvideo-upload">
              <el-upload
                ref="mPicUpload"
                action="/ccweb/api/icons/upload"
                :on-change="picOnChanged"
                :auto-upload="false"
                :http-request="handlePicUpload"
                :on-exceed="fileExceed"
                list-type="picture-card">
                <i class="el-icon-plus"></i>
              </el-upload>
              <!--<img width="148" height="148" :src="this.curPicUrl"/>!-->
            </div>
          </el-form-item>
          <el-form-item label="立体格式" prop="selectedCubeFormat">
            <el-select v-model="step2.form.selectedCubeFormat" placeholder="请选择立体格式">
              <el-option :label="cubeFormat" :value="cubeFormat"
                         v-for="cubeFormat in step2.form.cubeFormats"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="全景模式" prop="selectedFullMode">
            <el-select v-model="step2.form.selectedFullMode" placeholder="请选择全景模式">
              <el-option :label="fullMode" :value="fullMode" v-for="fullMode in step2.form.fullModes"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="所属菜单" prop="selectedCategoryId">
            <el-select v-model="step2.form.selectedCategoryId" placeholder="请选择菜单" @change="categoryChanged">
              <el-option :label="category.Name" :value="category.Id" v-for="category in categories"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="所属标签" prop="selectedTagId">
            <el-select v-model="step2.form.selectedTagId" placeholder="请选择标签">
              <el-option :label="tag.Name" :value="tag.Id" v-for="tag in step2.form.curTags"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" style="margin-left: 2rem" @click="submitForm('ruleForm')" :loading="isUploading">
              下一步
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="step3" v-if="step3.visible">
        <i class="el-icon-check" style="font-size: 5rem;color: #55a532;margin-top: 2rem"></i>
        <div style="font-size: 1rem;color: #55a532;margin-top: 2rem">成功</div>
        <el-button style="margin-top: 10rem" type="primary" @click="init">确定</el-button>
      </div>
    </div>
    <canvas ref="mCanvas" style="display: none;"></canvas>
  </div>
</template>

<script>
  export default {
    name: "upload_video",
    data() {
      return {
        stepBar: {},
        step1: {},
        step2: {},
        curPicInfo: {},
        categories: [],
        tags: [],
        responseData: {},
        step3: {},
        curPicList: [],
        isUploading: false,
        picChanged: false,
        videoInfo: {},
        clipImg: {},
        curPicFile: {},
        curPicUrl:'',
        hasPicCover:false
      }
    },
    created() {
      this.init();
    },
    methods: {
      async init() {
        await this.fetchData();
        this.videoInfo = {
          Width: "",
          Height: "",
          Duration: "",
          IconUrl: ""
        }
        this.stepBar = {
          active: 0
        }
        this.step1 = {
          fileList: [],
          nextStepAble: false,
          isDecoding: false,
          visible: true,
          hasFile: false
        }
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
        this.step2 = {
          visible: false,
          form: {
            videoFormats: videoFormats,
            fullModes: ["窗口视频", "180视频", "360视频"],
            selectedCubeFormat: "",
            cubeFormats: ["2D", "3D左右", "3D上下"],
            selectedFullMode: "",
            selectedCategoryId: "",
            selectedTagId: "",
            curTags: [],
            rules: rules
          },
          succeed: false
        }
        this.step3 = {
          visible: false,
        }
      },
      submitUpload() {
        console.log(this.step1.hasFile);
        if (!this.step1.hasFile) {
          this.$notify.info({
            title: '消息',
            message: '请先选择文件！'
          });
          return;
        }
        this.$refs['videoUpload'].submit();
      },
      uploadSuccess(response) {
        this.responseData = response;
        this.step1.nextStepAble = true;
        this.step1.isDecoding = false;
        this.stepBar.active++;
        this.$notify.info({
          title: '消息',
          message: '文件上传成功，请点下一步补充信息！'
        });
      },
      fileExceed() {
        this.$notify.info({
          title: '消息',
          message: '暂时只支持每次上传一个文件！'
        });
      },
      videoOnRemove(file, fileList) {
        this.step1.hasFile = false;
      },
      uploadProgress(event, file, fileList) {
        if (event.loaded == event.total) {
          this.step1.isDecoding = true;
        }
      },
      startStep2() {
        if(!this.step1.nextStepAble){
          this.$notify.info({
            title: '消息',
            message: '请先上传文件！'
          });
          return;
        }
        this.step1.visible = false;
        this.step2.visible = true;
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
      categoryChanged() {
        this.step2.form.curTags = this.getTagsByCategoryId(this.step2.form.selectedCategoryId);
        this.step2.form.selectedTagId = this.step2.form.curTags.length == 0 ? "" : this.step2.form.curTags[0].Id;
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
      submitForm(formName) {
        this.$refs[formName].validate((valid) => {
          if (valid) {
            this.isUploading = true;
            this.handlePicUpload();           //在beforeUpload里处理图片上传，图片信息补充，和资源信息补充
          } else {
            console.log('error submit!!');
            return false;
          }
        });
      },
      getFileTypeId() {
        let Id = 0;
        this.step2.form.videoFormats.forEach((videoFormat) => {
          if (this.step2.form.selectedFullMode + this.step2.form.selectedCubeFormat == videoFormat.Name) {
            Id = videoFormat.Id;
          }
        })
        return Id;
      },
      startStep3() {
        this.step2.visible = false;
        this.step3.visible = true;
      },
      picOnChanged(file, fileList) {
        this.hasPicCover=true;
        this.curPicFile = file.raw;
        console.log('picOnChanged: ' + file);
        let fileType = file.raw.type;
        const isJPG = fileType === 'image/jpeg' || fileType === 'image/png' || fileType === 'image/svg+xml';
        const isLt2M = file.size / 1024 / 1024 < 2;

        if (!isJPG) {
          this.$message.error('上传头像图片只能是 jpg/png/svg 格式!');
          this.$refs['mUpload'].clearFiles();
          return;
        }
        if (!isLt2M) {
          this.$message.error('上传头像图片大小不能超过 2MB!');
          this.$refs['mUpload'].clearFiles();
          return;
        }

        return isJPG && isLt2M;
      },
      async handlePicUpload() {             //视频封面上传之前，手动上传图片资源
        console.log('beforePicUpload');
        let formData = new FormData();
        formData.append('file', this.curPicFile);
        console.log(typeof this.curPicFile);
        let config = {
          headers: {'Content-Type': 'multipart/form-data'}
        };
        let IconInfo = {};
        if(this.hasPicCover){
          await this.axios.post('/ccweb/api/icons/upload', formData, config).then((res) => {
            let IconInfo = res.data;
            let img = new Image();
            img.src = IconInfo.Url;
            IconInfo.Width = img.width;
            IconInfo.Height = img.height;
            IconInfo.Size = img.Size;
            IconInfo.FileType = {Id: 100};
            this.curPicInfo = IconInfo;
          });
          await this.axios.post("/ccweb/api/icons/update", JSON.stringify(this.curPicInfo));
        }

        this.responseData.Category = {Id: this.step2.form.selectedCategoryId};
        this.responseData.Tags = [{Id: this.step2.form.selectedTagId}];
        this.responseData.FileType = {Id: this.getFileTypeId()};
        this.responseData.Icon = this.curPicInfo;

        await this.axios.post("/ccweb/api/resources/update", JSON.stringify(this.responseData));
        //初始化
        this.curPicList = [];
        this.picChanged = false;
        this.isUploading = false;
        this.stepBar.active += 2;
        this.startStep3();
        return false;
      },
      //videoChange可以作为video加入文件列表
      videoOnChange(file, fileList) {
        this.step1.hasFile = true;
        /*let video = this.$refs['mVideo'];
        let canvas = this.$refs['mCanvas'];
        let outPutImg = this.$refs['mOutputImg'];
        this.$refs['mVideo'].src = URL.createObjectURL(file.raw);
        video.addEventListener('playing', function () {
          video.currentTime = video.duration/3;
          video.volume = 0;
          console.log(video.duration);
        });
        this.clipImg = () => {
          canvas.width = 720;
          canvas.height = 720 * video.videoHeight / video.videoWidth;
          this.videoInfo.Width = video.videoWidth;
          this.videoInfo.Height = video.videoHeight;
          let minutes = parseInt(video.duration / 60, 10);
          let seconds = parseInt(video.duration % 60);
          this.videoInfo.Duration = this.getType(minutes) + ':' + this.getType(seconds);
          this.draw(video, canvas, outPutImg);
        }
        video.addEventListener('seeked', this.clipImg);*/
      },
      getType(time) {
        return time < 10 ? "0" + time : time;
      },
      draw(video, canvas) {
        let context = canvas.getContext('2d');
        let proportion = video.videoWidth / video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        let dataURL = canvas.toDataURL();
        this.curPicFile = this.dataURLtoFile(dataURL);
        this.curPicUrl=dataURL;
        video.pause();
        video.removeAttribute('src'); // empty source
        video.load();
        video.removeEventListener('seeked', this.clipImg);
      },
      dataURLtoFile(dataURL) {
        let blobBin = atob(dataURL.split(',')[1]);
        let array = [];
        for (let i = 0; i < blobBin.length; i++) {
          array.push(blobBin.charCodeAt(i));
        }
        let file = new Blob([new Uint8Array(array)], {type: 'image/png'});
        return file;
      }
    }
  }
</script>

<style scoped>
  .upload_video {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
  }

  .steps-bar {
    width: 80%;
    height: 20%;
    flex-grow: 0;
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .steps-container {
    width: 80%;
    height: 80%;
    flex-grow: 0;
    flex-shrink: 0;
    position: relative;
  }

  .step1 {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .step2 {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    margin-left: 40%;
  }

  .step3 {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
  }
</style>

<style>
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
</style>
