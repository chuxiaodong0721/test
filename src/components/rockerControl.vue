<template>
  <div style="padding: 50px 0 0 180px">
    <div v-show="connectCar" class="rockerControl" ref="rockerControl">
      <div class="rockerOutsideBorder">
        <div class="rockerArrow"></div>
        <div class="rockerInsideBorder" ref="rotate">
          <div class="rocker" ref="rocker"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: "rockerControl",
  data() {
    return {
      mouseDown: false,
      // 摇杆初始相对坐标值
      rockerPos: {
        x: 0,
        y: 0,
      },
      // 摇杆相对全屏的坐标
      rockerCenterPos: {
        x: 0,
        y: 0,
      },
      moveTimer: null,
      // deviceAddr: '192.168.1.100:8080',
      deviceAddr: location.host,
      authorization: '', //登陆成功返回的token
      connectCar: true, //小车连接成功标识
      websocket: null,
    }
  },
  mounted() {
    this.initRocker()
    // this.loginCar()
  },
  methods: {
    loginCar() {
      axios({
        url:`http://${this.deviceAddr}/car/api/user/login`,
        method: 'post',
        headers:{
          'Content-Type': 'application/json'
        },
        data: JSON.stringify({
          username: "admin",
          password: "admin",
        })
      }).then((res) => {
        if (res.data.code === 0) {
          this.authorization = res.headers.authorization
          this.connectWebsocket()
        } else {
          console.log("身份异常")
        }
      })
    },
    connectWebsocket() {
      this.websocket = new WebSocket(`ws://${this.deviceAddr}/car/api/ws?token=${this.authorization}`)
      this.websocket.onopen = () => {
        this.connectCar = true
      }
      this.websocket.onmessage = (data) => {
        data
      }
    },
    // 初始化摇杆信息
    initRocker() {
      // 获取摇杆中心点坐标
      const rocker = this.$refs['rocker']
      this.rockerPos.x = rocker.offsetLeft
      this.rockerPos.y = rocker.offsetTop
      const rockerControl = this.$refs['rockerControl']
      this.rockerCenterPos.x = rockerControl.offsetLeft + rockerControl.clientWidth / 2
      this.rockerCenterPos.y = rockerControl.offsetTop + rockerControl.clientHeight / 2

      this.$refs["rotate"].style.transform = 'rotate(0deg)'
      // 记录摇杆点击状态
      rockerControl.addEventListener('mousedown', () => {
        this.mouseDown = true
        console.log('click')
      })
      document.addEventListener('mouseup', () => {
        this.mouseDown = false
        this.$refs['rocker'].style.left = this.rockerPos.x + 'px'
        this.$refs['rocker'].style.top = this.rockerPos.y + 'px'
      })
      document.addEventListener('mousemove', (event) => {
        this.mouseMove(event)
      })
      // this.connectCar = false
    },
    // 鼠标移动摇杆，总体设计：计算鼠标当前位置与摇杆中心点之间的直线距离，改变摇杆的top定位，至于方向用旋转属性，达到对准鼠标方向的效果，这样解决了圆形边界的问题
    mouseMove(event) {
      console.log('move')
      if (this.mouseDown) {
        // console.log(event)
        // 摇杆直径
        const d = this.$refs["rockerControl"].clientHeight
        const rocker = this.$refs["rocker"]
        let dx = Math.abs(event.clientX - this.rockerCenterPos.x);
        let dy = Math.abs(event.clientY - this.rockerCenterPos.y);
        let distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

        // console.log(Math.atan2(event.clientY - this.rockerCenterPos.y, event.clientX - this.rockerCenterPos.x) * 100)
        //如果鼠标当前位置与摇杆中心点的距离，处在摇杆控制器的直径范围内，并且
        if (0 <= rocker.offsetTop && rocker.offsetTop <= d && (this.rockerPos.y - distance).toFixed(0) >= 0) {
          rocker.style.top = (this.rockerPos.y - distance).toFixed(0) + 'px'
        }

        // 摇杆朝向
        let rotate = this.getAngle(this.rockerCenterPos.x, this.rockerCenterPos.y, event.x, event.y, event);
        this.$refs['rotate'].style.transform = `rotate(${rotate}deg)`

        // console.log(`方向${rotate/90}°，速度${(this.rockerPos.y - rocker.offsetTop)/100}`)

        let carMoveRotate = 0
        // 确定小车转向角度
        if (0 <= rotate && rotate < 90) {
          //第一象限
          carMoveRotate = rotate / 90 * -1
        } else if (90 <= rotate && rotate < 180) {
          //第二象限
          carMoveRotate = (180 - rotate) / 90 * -1
        } else if (180 <= rotate && rotate < 270) {
          //第三象限
          carMoveRotate = (180 - rotate) / 90 * -1
        } else if (270 <= rotate && rotate < 360) {
          // 第四象限
          carMoveRotate = (270 - rotate) / 90 + 1
        }
        // 小车前进速度，摇杆越接近左右极点，速度越小
        let carMoveSpeed = (1 - Math.abs(carMoveRotate)) * ((this.rockerPos.y - rocker.offsetTop) / 100)
        // 当摇杆方向为第二第三象限，速度为负数，即为倒车
        if (90 <= rotate && rotate < 270) {
          carMoveSpeed *= -1
        }

        if (this.websocket) {
          this.ws_car_move(carMoveSpeed,carMoveRotate)
        }
        // console.log(`速度${carMoveSpeed},方向${carMoveRotate}`)
        // console.log(rocker.clientTop)
      }
    },
    /**
     * 获得旋转夹角
     * @param {*} x1 旋转点1
     * @param {*} y1
     * @param {*} x2 旋转点2
     * @param {*} y2
     * @param {*} event 当前位置
     */
    getAngle(x1, y1, x2, y2, event) {
      //中心点
      let cx = this.rockerCenterPos.x
      let cy = this.rockerCenterPos.y
      //2个点之间的角度获取
      let c1 = Math.atan2(y1 - cy, x1 - cx) * 180 / (Math.PI);
      let c2 = Math.atan2(y2 - cy, x2 - cx) * 180 / (Math.PI);
      let angle;
      c1 = c1 <= -90 ? (360 + c1) : c1;
      c2 = c2 <= -90 ? (360 + c2) : c2;
      //夹角获取
      angle = Math.floor(c2 - c1);
      angle = angle < 0 ? angle + 360 : angle;
      // let startAngle = parseInt(this.$refs['rotate'].style.transform.slice(7))
      let startAngle = 0
      let deg;
      // 赋值的旋转角度
      let rotate;
      // 顺时针旋转
      if (event.x - this.rockerPos.x > 0) {
        deg = startAngle + angle;
        rotate = deg > 360 ? deg - 360 : deg;
      } else {
        // 逆时针旋转
        angle = 360 - angle;
        deg = startAngle - angle;
        rotate = deg < 0 ? deg + 360 : deg;
      }
      rotate += 90
      rotate = rotate >= 360 && rotate <= 450 ? rotate - 360 : rotate
      return rotate
    },
    ws_car_move(carMoveSpeed,carMoveRotate){
      this.websocket.send(JSON.stringify({
        data: {
          linear: carMoveSpeed,
          angular: carMoveRotate
        },
        type: 4
      }))
    }
  }
}
</script>

<style scoped lang="scss">
.rockerControl {
  height: 200px;
  width: 200px;
  position: relative;

  .rockerOutsideBorder, .rockerInsideBorder {
    height: 100%;
    width: 100%;
    border-radius: 50%;
    //border: 1px solid rgba(1,1,1,0.5);
  }

  .rockerOutsideBorder {
    box-shadow: 0 0 10px 1px rgba(1, 1, 1, 0.5);

    .rockerInsideBorder {
      box-shadow: inset 0 0 10px 1px rgba(1, 1, 1, 0.5);
    }
  }

  .rockerArrow {
    position: absolute;
    z-index: 10;
  }

  .rocker {
    position: absolute;
    z-index: 20;
    height: 30%;
    width: 30%;
    border-radius: 50%;
    background-color: #c2c2c2;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 10px 1px rgba(1, 1, 1, 0.7);
  }
}
</style>