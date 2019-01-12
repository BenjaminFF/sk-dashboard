<template>
  <div class="mdevice">
    <div class="mdevice__register">
      <div class="mdevice-register__title">设备注册</div>
      <el-row class="mdevice-register__input-container">
        <el-col :span="10">
          <span>序列号：</span>
          <el-input v-model="SerialNumber" style=" width: 60%;margin-left: 2rem;"></el-input>
        </el-col>
        <el-col :span="10">
          <span>描述：</span>
          <el-input v-model="Description" style=" width: 60%;margin-left: 2rem;"></el-input>
        </el-col>
        <el-col :span="4">
          <el-button style="margin-left: 5%" type="primary" @click="uploadData()" :loading="isUpLoading">注 册</el-button>
        </el-col>
      </el-row>
    </div>
    <div class="mdevice__list-container">
      <div class="mdevice-list-container__title">设备列表</div>
      <div class="mdevice-table">
        <el-row class="mdevice-table__header">
          <el-col v-for="tableHeader in tableHeaders" :span="tableHeader.span">{{tableHeader.title}}</el-col>
        </el-row>
        <el-scrollbar style="height: 80%;width: 100%">
          <div class="mdevice-table__body">
            <el-row v-for="item in tableData" class="mdevice-table__tr">
              <el-col :span="4">{{item.Id}}</el-col>
              <el-col :span="8">{{item.SerialNumber}}</el-col>
              <el-col :span="10">{{item.Description}}</el-col>
              <el-col :span="2" style="margin-left: -1rem">
                <el-button  type="text" size="small" @click="rowEdit(item)">编辑</el-button>
                <el-button type="text" size="small" @click="rowDelete(item)">删除</el-button>
              </el-col>
            </el-row>
          </div>
        </el-scrollbar>
      </div>
    </div>
    <el-dialog
      title="提示"
      :visible.sync="delDialogVisible"
      width="30%">
      <span>确认删除此行吗？</span>
      <span slot="footer" class="dialog-footer">
    <el-button @click="delDialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="uploadDelete()">删除</el-button>
  </span>
    </el-dialog>
    <el-dialog
      title="编辑"
      :visible.sync="editDialogVisible"
      width="30%">
      <el-input style="margin-bottom: 2rem" v-model="curRow.SerialNumber" placeholder="serialNumber"></el-input>
      <el-input style="margin-bottom: 2rem" v-model="curRow.Description" placeholder="Description"></el-input>
      <span slot="footer" class="dialog-footer">
    <el-button @click="editDialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="uploadEdit()">更新</el-button>
  </span>
    </el-dialog>
  </div>
</template>

<script>
  export default {
    name: "mdevice",
    data() {
      return {
        tableData: [],
        delDialogVisible: false,
        editDialogVisible: false,
        curRow: {},
        tableHeaders: [],
        SerialNumber:"",
        Description:"",
        isUpLoading:false
      }
    },
    created() {
      this.init();
    },
    methods: {
      fetchData() {
        this.axios.get('/ccweb/api/devices/list').then((res) => {
          this.tableData = res.data;
          console.log(res.data);
          //this.tableData=this.tableData.concat(res.data);
        })
      },
      init() {
        this.tableHeaders = [
          {title: "ID", span: 4},
          {title: "序列号", span: 8},
          {title: "描述", span: 10},
          {title: "操作", span: 2}
        ]
        this.fetchData();
      },
      rowEdit(row) {
        this.curRow = {
          Id: row.Id,
          SerialNumber: row.SerialNumber,
          Description: row.Description
        };
        this.editDialogVisible = true;
      },
      rowDelete(row) {
        this.curRow = row;
        this.delDialogVisible = true;
      },
      uploadDelete() {
        this.axios.post("/ccweb/api/devices/delete", {
          Id: this.curRow.Id
        }).then((res) => {
            this.delDialogVisible = false;
            this.fetchData();
          }).catch((err) => {
        });
      },
      uploadEdit() {
        if(this.curRow.SerialNumber==""){
          this.$notify.info({
            title: '消息',
            message: '序列号不能为空！'
          });
          return;
        }
        this.axios.post('/ccweb/api/devices/update', this.curRow)
          .then((res) => {
            this.editDialogVisible = false;
            this.fetchData();
          }).catch((err) => {
        });
      },
      uploadData(){
        if(this.SerialNumber==""){
          this.$notify.info({
            title: '消息',
            message: '序列号不能为空！'
          });
          return;
        }
        let Device={
          SerialNumber: this.SerialNumber,
          Description: this.Description
        }
        if(!this.isUploading){
          this.isUploading=true;
          this.axios.post("/ccweb/api/devices/create",Device)
            .then((res)=>{
              this.isUploading=false;
              this.$notify.info({
                title: '消息',
                message: '上传成功！'
              });
              this.SerialNumber="";
              this.Description="";
              this.fetchData();
              console.log(res.data);
            }).catch((err)=>{});
        }
      }
    }
  }
</script>

<style scoped>
</style>

<style>
  .el-scrollbar__wrap {
    overflow-x: hidden;
  }
</style>
