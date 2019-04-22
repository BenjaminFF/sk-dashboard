<template>
  <div class="mdevice">
    <div class="mdevice__register" v-if="false">
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
    <div class="mdevice__list-container" style="height: 90%">
      <div class="mdevice-list-container__title">设备列表<span style="color: gray;font-size: 1.2rem">(设备连接进来自动注册)</span></div>
      <div class="mdevice-table">
        <el-row class="mdevice-table__header">
          <el-col :span="4">ID</el-col>
          <el-col :span="8">序列号</el-col>
          <el-col :span="8">描述</el-col>
          <el-col :span="4" style="text-align: center">操作</el-col>
        </el-row>
        <el-scrollbar class="m-el-scrollbar">
          <div class="mdevice-table__body">
            <el-row v-for="item in tableData" class="mdevice-table__tr">
              <el-col :span="4">{{item.Id}}</el-col>
              <el-col :span="8">{{item.SerialNumber}}</el-col>
              <el-col :span="8">{{item.Description}}</el-col>
              <el-col :span="4" style="text-align: center">
                <el-button  type="text" size="small" @click="editDeviceResources(item)" :disabled="!item.connected">设备内容</el-button>
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
      <span>确认删除这个设备吗？</span>
      <span slot="footer" class="dialog-footer">
    <el-button @click="delDialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="uploadDelete()">删除</el-button>
  </span>
    </el-dialog>
    <el-dialog
      title="设备内容"
      :visible.sync="editDeviceResVisible"
      width="30%">
      <el-scrollbar class="m-dr-scrollbar">
        <div style="position: absolute;left: 0;top: 0;;width: 100%;height: 100%;display: flex;justify-content: center;align-items: center" class="m-dr-scrollbar" v-if="curResources.length==0">暂无内容</div>
        <div class="mdevice-table__body">
          <el-row v-for="resource in curResources" class="mdevice-table__tr" style="box-shadow: 0px 0px 10px rgba(0,0,0,0.16)">
            <el-col :span="20">{{resource.Name}}</el-col>
            <el-col :span="4" style="text-align: center">
              <el-button type="text" size="small" @click="DeleteResource(resource)">删除</el-button>
            </el-col>
          </el-row>
        </div>
      </el-scrollbar>
    </el-dialog>
    <el-dialog
      title="编辑"
      :visible.sync="editDialogVisible"
      width="30%">
      <span>序列号</span>
      <el-input style="margin-bottom: 2rem;margin-top: 0.3rem" v-model="curRow.SerialNumber" placeholder="serialNumber"></el-input>
      <span>描述</span>
      <el-input style="margin-bottom: 2rem;margin-top: 0.3rem" v-model="curRow.Description" placeholder="Description"></el-input>
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
        isUpLoading:false,
        wsAdmin: {},
        editDeviceResVisible:false,
        curDevice:{},
        curResources:[],
        lockReconnect: false
      }
    },
    created() {
      this.init();
    },
    methods: {
      fetchData() {
        this.axios.get('/ccweb/api/devices/list').then((res) => {
          res.data.forEach((device)=>{
            device.connected=false;
          });
          this.tableData=res.data;
        })
      },
      init() {
        this.tableHeaders = [
          {title: "ID", span: 4},
          {title: "序列号", span: 8},
          {title: "描述", span: 8},
          {title: "操作", span: 4}
        ]
        this.connectServerByWS();
        this.fetchData();
      },
      async connectServerByWS() {
        try {
          let url = window.location.host;
          this.adminSN = localStorage.getItem('adminSN') == null ? "admin" + new Date().getTime() : localStorage.getItem('adminSN');
          localStorage.setItem("adminSN", this.adminSN);
          this.wsAdmin = new WebSocket("ws://" + url + "/ccweb/ws/join?sn=" + this.adminSN);
          this.wsAdmin.onmessage = (evt) => {
            console.log(evt.data);
            let msg=JSON.parse(evt.data);
            if(msg.Type==3){
              let UserEvents = msg.Data.UserEvents;
              this.tableData.forEach((device) => {
                device.connected = false;
              })
              UserEvents.forEach((userEvent) => {
                this.tableData.forEach((device) => {
                  if (device.Id == userEvent.UserDevice.Id) {
                    device.connected = true;
                  }
                })
              });
              console.log(this.tableData);
            }
            if(msg.Type==4){
              msg.Data.ErrorCode==1?this.editDeviceResVisible=true:null;
              msg.Data.ErrorCode==1?this.curResources=msg.Data.Resources:null;
              console.log(this.curResources);
            }
            this.wsAdmin.send('OK');
          }
          this.wsAdmin.onclose = (evt) => {
            this.wsReconnect();
            console.log("websocket closed");
          }
          this.wsAdmin.onerror = (evt) => {
            this.wsReconnect();
            console.log("websocket error");
          }
        } catch (e) {
          this.wsReconnect();
        }
      },
      wsReconnect() {
        if (this.lockReconnect) return;
        this.lockReconnect = true;
        setTimeout(() => {
          this.connectServerByWS();
          this.lockReconnect = false;
        }, 2000);
      },
      DeleteResource(resource){
        this.curResources.forEach((mResource, index) => {
          if (resource.Id === mResource.Id) {
            this.curResources.splice(index, 1);
          }
        });
        this.wsAdmin.send(JSON.stringify({
          Type: 2,
          Data: {
            Admin: this.adminSN,
            UserDevice: this.curDevice,
            Command: 3,
            Resource:resource
          }
        }))
      },
      editDeviceResources(device){
        this.curDevice=device;
        this.wsAdmin.send(JSON.stringify({
            Type: 2,
            Data: {
              Admin: this.adminSN,
              UserDevice: device,
              Command: 1,
            }
        }))
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
    },
    beforeDestroy() {
      this.wsAdmin.onclose=null;
      this.wsAdmin.close();
    }
  }
</script>

<style scoped>
</style>

<style>

  .m-el-scrollbar{
    height: 80%;
    width: 100%;
  }
  .m-dr-scrollbar{
    height: 20rem;
    width: 100%;
  }
  .m-dr-scrollbar>.el-scrollbar__wrap {
    overflow-x: hidden;
  }
  .m-el-scrollbar>.el-scrollbar__wrap {
    overflow-x: hidden;
  }
</style>
