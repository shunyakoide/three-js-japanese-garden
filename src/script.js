import "./style.css"
import * as dat from "dat.gui"
import * as THREE from "three"
import gsap from "gsap"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"
import firefliesVertexShader from "./shaders/fireflies/vertex.glsl"
import firefliesFragmentShader from "./shaders/fireflies/fragment.glsl"
import waterVertexShader from "./shaders/water/vertex.glsl"
import waterFragmentShader from "./shaders/water/fragment.glsl"
import { Mesh, MeshBasicMaterial, PlaneBufferGeometry } from "three"
import { Flow } from "three/examples/jsm/modifiers/CurveModifier.js"

/**
 * Base
 */
// Debug
const debugObject = {}
const gui = new dat.GUI({
  width: 400,
  closed: true,
})

// Canvas
const canvas = document.querySelector("canvas.webgl")

// Scene
const scene = new THREE.Scene()
scene.fog = new THREE.Fog(0xffffff, 0, 17)
/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath("draco/")

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Mesh
 */
const floorGeometry = new PlaneBufferGeometry(4, 4, 1)
const floorMaterial = new MeshBasicMaterial({ color: "#2b1d0e" })
const floorMesh = new Mesh(floorGeometry, floorMaterial)
floorMesh.rotation.x = Math.PI * 0.5
scene.add(floorMesh)

/**
 * Koi Fish
 */
const matcapTexture = textureLoader.load("/matcaps11.png")
const koiMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTexture })

//Koi Fish path
const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.3, 0.2, -0.3),
  new THREE.Vector3(0.5, 0.2, -0.1),
  new THREE.Vector3(0.2, 0.2, 0.7),
  new THREE.Vector3(-0.8, 0.2, 0.7),
  new THREE.Vector3(-0.6, 0.2, 0.1),
  new THREE.Vector3(-0.6, 0.2, -0.2),
])

curve.curveType = "centripetal"
curve.closed = true

const points = curve.getPoints(50)
const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)

const lineMaterial = new THREE.LineBasicMaterial({
  transparent: true,
  opacity: 0,
})

const curveObject = new THREE.LineLoop(lineGeometry, lineMaterial)

scene.add(curveObject)

let flow

//model
// https://clara.io/view/b47726c8-02cf-4eb5-b275-d9b2be591bad
gltfLoader.load("/koi.glb", (gltf) => {
  const koi = gltf.scene.children.find((child) => child.name === "fish")
  koi.children[0].material = koiMaterial

  flow = new Flow(gltf.scene) //move on the curve
  flow.updateCurve(0, curve)
  scene.add(flow.object3D)
})

/**
 * Water
 */

//geometry
const waterGeometry = new THREE.PlaneGeometry(2.5, 2.5, 150, 150)

//material
debugObject.waterColor1 = "#96c4e8"
debugObject.waterColor2 = "#e1c1eb"

gui.addColor(debugObject, "waterColor1").onChange(() => {
  waterMaterial.uniforms.uColor1.value.set(debugObject.waterColor1)
})
gui.addColor(debugObject, "waterColor2").onChange(() => {
  waterMaterial.uniforms.uColor2.value.set(debugObject.waterColor2)
})

const waterMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color(debugObject.waterColor1) },
    uColor2: { value: new THREE.Color(debugObject.waterColor2) },
  },
  vertexShader: waterVertexShader,
  fragmentShader: waterFragmentShader,
  transparent: true,
})

//mesh
const waterMesh = new Mesh(waterGeometry, waterMaterial)
waterMesh.rotation.x = -Math.PI * 0.5
waterMesh.position.set(0, 0.3, 0.2)
scene.add(waterMesh)

/**
 * Texture
 */
const bakedTexture = textureLoader.load("/jg-bake.jpg")
bakedTexture.flipY = false
bakedTexture.encoding = THREE.sRGBEncoding

/**
 * Material
 */
//Baked material
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })

//Pole light material
const lampMeshMaterial = new THREE.MeshBasicMaterial({ color: "#f5deb3" })

/**
 * Model
 */
gltfLoader.load("/japanese-garden.glb", (gltf) => {
  const bakedMesh = gltf.scene.children.find((child) => child.name === "bake")
  const shishiodoshiMesh = gltf.scene.children.find(
    (child) => child.name === "shishi"
  )
  const lampMesh = gltf.scene.children.find((child) => child.name === "lamp")

  bakedMesh.material = shishiodoshiMesh.material = bakedMaterial
  lampMesh.material = lampMeshMaterial

  gsap.to(shishiodoshiMesh.rotation, {
    x: Math.PI * 0.25,
    repeat: -1,
    yoyo: true,
    repeatDelay: 2,
    ease: "power3.out",
    duration: 2,
  })

  scene.add(gltf.scene)
})

/**
 * Fireflies
 */
// Geometry

const firefliesGeomerty = new THREE.BufferGeometry()
const firefliesCount = 30
const positionArray = new Float32Array(firefliesCount * 3) //xyz
const scaleArray = new Float32Array(firefliesCount) //number

for (let i = 0; i < firefliesCount; i++) {
  positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4
  positionArray[i * 3 + 1] = Math.random() * 1.5 + 0.3
  positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4 + 0.5

  scaleArray[i] = Math.random()
}

firefliesGeomerty.setAttribute(
  "position",
  new THREE.BufferAttribute(positionArray, 3) //xyz
)

firefliesGeomerty.setAttribute(
  "aScale",
  new THREE.BufferAttribute(scaleArray, 1) //number
)

const firefliesMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: 200 },
    uTime: { value: 0 },
  },
  vertexShader: firefliesVertexShader,
  fragmentShader: firefliesFragmentShader,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
})

gui
  .add(firefliesMaterial.uniforms.uSize, "value")
  .min(0)
  .max(500)
  .step(1)
  .name("firefiessize")

//Points
const fireflies = new THREE.Points(firefliesGeomerty, firefliesMaterial)
scene.add(fireflies)

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  //Update fireflies
  firefliesMaterial.uniforms.uPixelRatio.value = Math.min(
    window.devicePixelRatio,
    2
  )
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
)
//真上から
// camera.position.x = 0
// camera.position.y = 4
// camera.position.z = 0

//camera postion
camera.position.x = 4.1
camera.position.y = 2.8
camera.position.z = 4.1
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding

debugObject.clearColor = "#d49c9c"
renderer.setClearColor(debugObject.clearColor)
gui.addColor(debugObject, "clearColor").onChange(() => {
  renderer.setClearColor(debugObject.clearColor)
})

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
  const elapsedTime = clock.getElapsedTime()

  //Update materials
  firefliesMaterial.uniforms.uTime.value = elapsedTime
  waterMaterial.uniforms.uTime.value = elapsedTime

  //Update Koi
  if (flow) {
    flow.moveAlongCurve(0.001)
  }

  // Update controls
  controls.update()

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
