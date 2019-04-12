<template>
  <div class="mtask-container">
    <div class="mtask-main">
      <div class="mtask-tool">
        <el-col :span="4" :offset="20" style="display: flex;justify-content: flex-end">
          <el-button class="mtask-tool-button" type="primary" icon="el-icon-plus" @click="addDialogVisible=true">新增任务
          </el-button>
        </el-col>
      </div>
      <div class="l-mtag-table">
        <el-row class="l-mtag-table__header">
          <el-col :span="2">设备ID</el-col>
          <el-col :span="4">设备内存</el-col>
          <el-col :span="4">设备电量</el-col>
          <el-col :span="6">资源名称</el-col>
          <el-col :span="4">下发进度</el-col>
          <el-col :span="4" style="text-align: center">操作</el-col>
        </el-row>
        <el-scrollbar class="mtag-el-scrollbar">
          <div class="l-mtag-table__body">
            <el-row v-for="task in taskQueue" class="l-mtag-table__tr">
              <el-col :span="2">设备ID</el-col>
              <el-col :span="4">设备内存</el-col>
              <el-col :span="4">设备电量</el-col>
              <el-col :span="6">资源名称</el-col>
              <el-col :span="4">下发进度</el-col>
              <el-col :span="4" style="text-align: center">操作</el-col>
            </el-row>
          </div>
        </el-scrollbar>
      </div>
    </div>
    <el-dialog
      title="新增任务"
      :visible.sync="addDialogVisible"
      custom-class="mtag-dialog"
      width="50%">
      <el-scrollbar class="mtask-select-scrollbar">
        <el-row v-for="item in resources" class="l-mvideo-table__tr"
                style="box-shadow: 0px 0px 15px rgba(0,0,0,0.16);height: 3rem;width: 96%;left: 2%">
          <el-col :span="2">
            <el-checkbox v-model="item.selected"></el-checkbox>
          </el-col>
          <el-col :span="8">{{item.Name.length<20?item.Name:item.Name.substring(0,20)+"..."}}</el-col>
          <el-col :span="3">{{item.Category.Name}}</el-col>
          <el-col :span="3">{{item.Tags[0].Name}}</el-col>
          <el-col :span="4">{{getSizeStrByByte(item.Size)}}</el-col>
          <el-col :span="4">{{item.FileType.Name}}</el-col>
        </el-row>
      </el-scrollbar>
      <span slot="footer" class="dialog-footer">
          <el-button @click="addDialogVisible=false">取 消</el-button>
          <el-button type="primary" @click="createTask">添加</el-button>
     </span>
    </el-dialog>
  </div>
</template>

<script>
  export default {
    name: "",
    data() {
      return {
        taskQueue: [],
        addDialogVisible: false,
        resources: [],
        devices: [],
        wsAdmin: {},
        adminSN: ""
      }
    },
    created() {
      this.init();
      this.fetchData();
    },
    watch: {
      addDialogVisible() {
        if (!this.addDialogVisible) {
          setTimeout(() => {
            this.resources.forEach((resource) => {
              resource.selected = false;
            }, 100);
          })
        }
      }
    },
    methods: {
      init() {
        let url = window.location.host;
        this.adminSN = localStorage.getItem('adminSN') == null ? new Date().getTime() : localStorage.getItem('adminSN');
        localStorage.setItem("adminSN",this.adminSN);
        this.wsAdmin = new WebSocket("ws://"+url+"/ccweb/ws/join?sn=admin" + this.adminSN);
        this.wsAdmin.onmessage = (evt) => {
          console.log(evt.data);
          this.updateTaskQueue(JSON.parse(evt.data));
          this.wsAdmin.send('OK');
        }
        this.taskQueue = localStorage.getItem('taskQueue') == null ? [] : JSON.parse(localStorage.getItem('taskQueue'));
      },
      async fetchData() {
        await this.axios.get("/ccweb/api/resources/list").then((res) => {
          let resources = res.data;
          resources.forEach((resource) => {
            resource.selected = false;
          })
          this.resources = resources;
        });
        await this.axios.get("/ccweb/api/devices/list").then((res) => {
          this.devices = res.data;
        });
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
      createTask() {
        let taskQueue = [];
        this.devices.forEach((device) => {
          this.resources.forEach((resource) => {
            if (resource.selected) {
              taskQueue.push({
                Device: device,
                Resource: resource,
                Storage: "xx",
                PowerState: "xx",
                downloadState: 1,           //0正在下载，1等待下载，2失败重发，3下载完成
                DownloadProgress: "xx"
              });
            }
          });
        });
        this.taskQueue.push(...taskQueue);
        this.taskQueue.sort((task1, task2) => {
          return task1.downloadState - task2.downloadState;
        })
        localStorage.setItem("taskQueue", JSON.parse(this.taskQueue));
        let curTaskCount = this.taskQueue.length < 5 ? this.taskQueue.length : 5;
        for (let i = 0; i < curTaskCount; i++) {
          if (this.taskQueue[i].downloadState == 1) {
            this.wsAdmin.send({
              Type: 2,
              Data: {
                Admin: this.adminSN,
                UserDevice: this.taskQueue.Device,
                Command: 2,
                Resource: this.Resource
              }
            })
          }
        }
      },
      updateTaskQueue(res) {
        if (res.Type == 3) {
          let UserEvents = res.Data.UserEvents;
          this.taskQueue.forEach((task) => {
            UserEvents.forEach((userEvent) => {
              if (task.Device.Id == userEvent.UserDevice.Id) {
                task.PowerState = userEvent.PowerState;
                if (task.Resource.Id == userEvent.DownloadingResource.Id) {
                  if (userEvent.DownloadingProgress == -1) {
                    task.downloadState = 1;
                    task.DownloadingProgress = userEvent.DownloadProgress;
                  } else {
                    task.downloadState = 0;
                    task.DownloadingProgress = userEvent.DownloadProgress;
                  }
                }
              }
            })
          });
        } else if (res.Type == 4) {
          let UserEvents = res.Data.UserEvents;
          this.taskQueue.forEach((task) => {
            UserEvents.forEach((userEvent) => {
              if (userEvent.UserDevice.Id == task.Device.Id) {
                task.Storage = userEvent.UsedStorage + "/" + userEvent.TotalStorage;
                if (task.Resource.Id == userEvent.DownloadingResource.Id) {
                  userEvent.ErrorCode != 0 ? task.downloadState = 1 : null;
                }
              }
            })
          });
        }
        let curTaskCount = this.taskQueue.length < 5 ? this.taskQueue.length : 5;
        for (let i = 0; i < curTaskCount; i++) {
          if (this.taskQueue[i].downloadState == 1) {
            this.wsAdmin.send({
              Type: 2,
              Data: {
                Admin: this.adminSN,
                UserDevice: this.taskQueue.Device,
                Command: 2,
                Resource: this.Resource
              }
            })
          }
        }
      }
    }
  }
</script>

<style scoped>
  .mtask-container {
    width: 100%;
    height: 100%;
  }

  .mtask-main {
    margin-left: 5%;
    width: 90%;
    background-color: transparent;
    height: 100%;
  }

  .mtask-tool {
    width: 100%;
    height: 10%;
    margin-top: 5%;
    display: flex;
    align-items: center;
  }

  .mtask-tool-button {
    min-width: 5rem;
    box-shadow: 0px 0px 30px 0px rgba(0, 0, 0, 0.16);
  }
</style>

<style>
  .mtask-select-scrollbar {
    width: 100%;
    height: 20rem;
  }

  .mtask-select-scrollbar > .el-scrollbar__wrap {
    overflow-x: hidden;
  }

  .el-checkbox__inner {
    border-color: gray;
  }
</style>
