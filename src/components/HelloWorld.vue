<template>
  <div class="container">
    <div id="main"></div>
    <button class="bt1" @click="bt1">test</button>
    <button class="bt1" @click="stopRotate">stop rotate</button>
<!--    <img src="@/assets/basketball.png" alt="">-->
  </div>
</template>

<script>
import * as THREE from 'three'
import * as dat from 'dat.gui'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import gasp from 'gsap'

let carGLB = null
let animationMixer = null
export default {
  name: 'HelloWorld',
  data() {
    return {
      scene: '',
      camera: '',
      renderer: '',
      basketballAnimation: '',
    }
  },
  mounted() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 20)

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.querySelector('#main').appendChild(renderer.domElement);

    // 控制器
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    // orbitControls.autoRotate = true
    orbitControls.autoRotateSpeed = 2

    // 网格
    // const gridHelper = new THREE.GridHelper(10, 10);
    // scene.add(gridHelper);


    // 材质
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const textureLoader = new THREE.TextureLoader();
    const basketballTexture = textureLoader.load(require('../assets/basketball2.png'))
    // 纹理显示的算法 默认为线性显示
    basketballTexture.magFilter = THREE.NearestFilter
    basketballTexture.minFilter = THREE.NearestFilter
    const material = new THREE.MeshBasicMaterial({
      color: '#d7d7d7',
      map: basketballTexture,
    });
    const cube = new THREE.Mesh(geometry,material);
    cube.position.set(0, 5, 0)
    const basketballAnimation = gasp.to(cube.position,
        {
          y: -5,
          duration: 3,
          repeat: -1,
          yoyo: true,
          yoyoEase: 'power4.out',
          ease: "power4.out"
        }
    )

    //灯光
    const ambientLight = new THREE.AmbientLight(0xffffff,0.5);
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff,1.5);
    directionalLight.position.set(0.3,0.6,0.5)
    scene.add(directionalLight)

    //陆地
    const land = new THREE.BoxGeometry(10,0.01,10);
    const landMaterial = new THREE.MeshBasicMaterial({color:'#5b5b5b'});
    scene.add(new THREE.Mesh(land,landMaterial))

    //车模型
    new GLTFLoader().load('../3dModel/lanboCar.glb',gltf=>{
      console.log(gltf)
      carGLB = gltf
      scene.add(carGLB.scene)
      this.bt1()
    })


    // scene.add(cube);




    // 实时渲染页面
    function render() {
      orbitControls.update()
      renderer.render(scene, camera);
      requestAnimationFrame(render)

      if (animationMixer){
        animationMixer.update(0.009)
      }
    }
    render()


    // 参数编辑器
    const gui = new dat.GUI();
    gui.add(basketballTexture.offset,'x').min(-1).max(1)
    gui.add(basketballTexture.offset,'y').min(-1).max(1)
    gui.add(ambientLight,'intensity').min(0).max(2)
    gui.add(directionalLight.position,'x').min(0).max(1)
    gui.add(directionalLight.position,'y').min(0).max(1)
    gui.add(directionalLight.position,'z').min(0).max(1)
    gui.add(directionalLight.position,'x').min(0).max(1)
    gui.add(directionalLight,'intensity').min(0).max(2)


    this.basketballAnimation = basketballAnimation
    this.orbitControls = orbitControls
  },
  methods: {
    bt1() {
      // this.basketballAnimation.duration(this.basketballAnimation.duration() + 1)
      // this.basketballAnimation.ease = 'bounce.out'

      animationMixer = new THREE.AnimationMixer(carGLB.scene);
      carGLB.animations.forEach(clip=>{
        const action = animationMixer.clipAction(clip);
        action.loop = THREE.LoopOnce
        action.play()
        action.clampWhenFinished = true
      })
    },
    stopRotate() {
      this.orbitControls.autoRotate = !this.orbitControls.autoRotate
    }
  },
}
</script>

<style scoped>
.bt1 {
  height: 100px;
  width: 200px;
  position: relative;
  top: 0px;
  left: 0px;
  z-index: 1000;
}
</style>
<style>

canvas {
  position: fixed;
  top: 0;
  left: 0;
}
</style>
