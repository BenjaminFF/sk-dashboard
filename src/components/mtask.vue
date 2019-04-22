<template>
  <div class="mtask-container">
    <div class="mtask-main">
      <div class="mtask-tool">
        <el-col :span="4" :offset="20" style="display: flex;justify-content: flex-end">
          <el-button class="mtask-tool-button" type="primary" icon="el-icon-plus" @click="addDialogVisible=true">新增任务
          </el-button>
        </el-col>
      </div>
      <div class="l-mtag-table" style="position: relative">
        <div
          style="position: absolute;left: 0;top: 0;width: 100%;height: 100%;display: flex;justify-content:center;align-items: center;font-size: 2rem"
          v-if="taskQueue.length==0">暂无任务
        </div>
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
              <el-col :span="2">{{task.Device.Id}}</el-col>
              <el-col :span="4">{{task.Storage}}</el-col>
              <el-col :span="4">{{task.PowerState}}</el-col>
              <el-col :span="6">{{task.Resource.Name}}</el-col>
              <el-col :span="4">{{getDownLoadStateText(task)}}</el-col>
              <el-col :span="4" style="text-align: center">
                <el-button type="text" @click="deleteDeviceResource(task)">删除</el-button>
                <el-button type="text" v-if="task.downloadState==2" @click="resendDownload(task)">重发</el-button>
              </el-col>
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
      <el-checkbox :indeterminate="isIndeterminate" v-model="checkAll" @change="handleCheckAllChange"
                   style="margin-left: 2%">全选
      </el-checkbox>
      <el-scrollbar class="mtask-select-scrollbar">
        <el-row v-for="item in resources" class="l-mvideo-table__tr"
                style="box-shadow: 0px 0px 15px rgba(0,0,0,0.16);height: 3rem;width: 96%;left: 2%">
          <el-col :span="2">
            <el-checkbox v-model="item.selected" @change="handleCheckedCitiesChange"></el-checkbox>
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
        adminSN: "",
        isIndeterminate: false,
        checkAll: false,
        lockReconnect: false
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
              this.isIndeterminate = false;
              this.checkAll = false;
            }, 100);
          })
        }
      }
    },
    methods: {
      init() {
        this.connectServerByWS();
        this.taskQueue = localStorage.getItem('taskQueue') == null ? [] : JSON.parse(localStorage.getItem('taskQueue'));
        this.taskQueue.sort((task1, task2) => {
          return task1.downloadState - task2.downloadState;
        })
        setTimeout(()=>{
          this.taskQueue.forEach((task)=>{
            if(task.downloadState==0){  //正在下载
              this.wsAdmin.send(JSON.stringify({
                Type: 2,
                Data: {
                  Admin: this.adminSN,
                  UserDevice: task.Device,
                  Command: 2,
                  Resource: task.Resource
                }
              }))
            }
          });
        },3000);
      },
      async connectServerByWS() {
        try {
          let url = window.location.host;
          this.adminSN = localStorage.getItem('adminSN') == null ? "admin" + new Date().getTime() : localStorage.getItem('adminSN');
          localStorage.setItem("adminSN", this.adminSN);
          this.wsAdmin = new WebSocket("ws://" + url + "/ccweb/ws/join?sn=" + this.adminSN);
          this.wsAdmin.onopen = (evt) => {
            //this.heartCheck.start();
          }
          this.wsAdmin.onmessage = (evt) => {
            console.log(evt.data);
            this.updateTaskQueue(JSON.parse(evt.data));
            this.wsAdmin.send('OK');
          }
          this.wsAdmin.onclose = (evt) => {
            this.wsAdmin.close();
            this.wsReconnect();
            console.log("websocket closed");
          }
          this.wsAdmin.onerror = (evt) => {
            this.wsAdmin.close();
            this.wsReconnect();
            console.log("websocket error");
          }
        } catch (e) {
          //this.wsReconnect();
        }
      },
      getDownLoadStateText(task) {
        //0正在下载，1等待下载，2失败重发，3下载完成
        switch (task.downloadState) {
          case 0:
            return task.DownloadProgress + "%";
          case 1:
            return "等待下载";
          case 2:
            return "失败";
          case 3:
            return "下载完成"
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
      async fetchData() {
        this.resources=[];
        await this.axios.get("/ccweb/api/resources/list").then((res) => {
          let resources = res.data;
          resources.forEach((resource) => {
            resource.selected = false;
            if(resource.Category!=null&&resource.Tags!=null){
              this.resources.push(resource);
            }
          })
          console.log(this.resources);
        });
        await this.axios.get("/ccweb/api/devices/list").then((res) => {
          let devices = res.data;
          devices.forEach((device) => {
            device.connected == false;
          });
          this.devices = devices;
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
        this.resources.forEach((resource) => {
          if (resource.selected) {
            this.devices.forEach((device) => {
              if (device.connected) {
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
          }
        });
        taskQueue.forEach((task) => {
          //已经有这个任务了
          let hasTask = this.taskQueue.find((preTask) => {
            return (preTask.Device.Id == task.Device.Id && preTask.Resource.Id == task.Resource.Id);
          }) != undefined;
          if (!hasTask) {
            this.taskQueue.push(task);
          }
        })
        console.log(this.taskQueue);
        this.taskQueue.sort((task1, task2) => {
          return task1.downloadState - task2.downloadState;
        })
        localStorage.setItem("taskQueue", JSON.stringify(this.taskQueue));
        let curTaskCount = this.taskQueue.length < 3 ? this.taskQueue.length : 3;
        for (let i = 0; i < curTaskCount; i++) {
          if (this.taskQueue[i].downloadState == 1) {
            console.log('send message');
            this.wsAdmin.send(JSON.stringify({
              Type: 2,
              Data: {
                Admin: this.adminSN,
                UserDevice: this.taskQueue[i].Device,
                Command: 2,
                Resource: this.taskQueue[i].Resource
              }
            }))
          }
        }
        this.addDialogVisible = false;
      },
      deleteDeviceResource(task) {
        this.taskQueue.forEach((mTask, index) => {
          if (mTask === task) {
            this.taskQueue.splice(index, 1);
          }
        });
        localStorage.setItem('taskQueue', JSON.stringify(this.taskQueue));
      },
      resendDownload(task) {
        this.wsAdmin.send(JSON.stringify({
          Type: 2,
          Data: {
            Admin: this.adminSN,
            UserDevice: task.Device,
            Command: 2,
            Resource: task.Resource
          }
        }))
        task.downloadState = 1;
      },
      MBToGB(MB) {
        return (MB / 1024).toFixed(2);
      },
      updateTaskQueue(res) {
        if (res.Type == 3) {
          let UserEvents = res.Data.UserEvents;
          UserEvents.forEach((userEvent) => {
            this.devices.forEach((device) => {
              if (device.Id == userEvent.UserDevice.Id) {
                device.connected = true;
              }
            })
          });
          this.taskQueue.forEach((task) => {
            UserEvents.forEach((userEvent) => {
              if (task.Device.Id == userEvent.UserDevice.Id) {
                task.PowerState = userEvent.PowerState;
                if (userEvent.DownloadingResource != null && task.Resource.Id == userEvent.DownloadingResource.Id && task.downloadState != 3) {
                  if (userEvent.DownloadProgress == -1) {
                    task.downloadState = 1;
                    task.DownloadProgress = userEvent.DownloadProgress;
                  } else {
                    task.downloadState = 0;
                    task.DownloadProgress = userEvent.DownloadProgress;
                  }
                }
              }
            })
          });
        } else if (res.Type == 4) {
          let UserDevice = res.Data.UserDevice;
          let Storage = "已用" + this.MBToGB(res.Data.UsedStorage) + 'G/' + this.MBToGB(res.Data.TotalStorage) + 'G'
          let Resources = res.Data.Resources;
          let ErrorCode = res.Data.ErrorCode;
          this.taskQueue.forEach((task) => {
            if (task.Device.Id == UserDevice.Id) {
              task.Storage = Storage;
              if (Resources != null) {
                Resources.forEach((resource) => {
                  if (resource.Id == task.Resource.Id) {
                    ErrorCode < 0 ? task.downloadState = 2 : null;
                    ErrorCode == 4 ? task.downloadState = 3 : null;
                    if(ErrorCode==2){
                      task.downloadState=0;
                      task.DownloadProgress=0;
                    }
                  }
                });
              }
            }
          });
          if (ErrorCode == 4) {
            let curTaskCount=this.taskQueue.filter((task)=>task.downloadState==0).length;
            let mTaskCount=3-curTaskCount;
            for (let i = 0; i < this.taskQueue.length; i++) {
              if(mTaskCount==0){
                break;
              }
              if (this.taskQueue[i].downloadState == 1) {
                mTaskCount--;
                console.log("send message after success");
                this.wsAdmin.send(JSON.stringify({
                  Type: 2,
                  Data: {
                    Admin: this.adminSN,
                    UserDevice: this.taskQueue[i].Device,
                    Command: 2,
                    Resource: this.taskQueue[i].Resource
                  }
                }))
              }
            }
            this.taskQueue.sort((task1, task2) => {
              return task1.downloadState - task2.downloadState;
            })
          }
        }
        localStorage.setItem("taskQueue", JSON.stringify(this.taskQueue));
      },
      handleCheckedCitiesChange(val) {
        let selectedCount = this.resources.filter((resource) => resource.selected).length;
        this.checkAll = selectedCount == this.resources.length;
        this.isIndeterminate = selectedCount < this.resources.length && selectedCount > 0;
      },
      handleCheckAllChange(val) {
        this.isIndeterminate = false;
        this.resources.forEach((resource) => {
          resource.selected = val;
        })
      }
    },
    beforeDestroy() {
      this.wsAdmin.onclose = null;
      this.wsAdmin.close();
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

  .mtag-el-scrollbar {
    height: 90%;
    width: 100%;
  }

  .mtag-el-scrollbar > .el-scrollbar__wrap {
    overflow-x: hidden;
  }
</style>
