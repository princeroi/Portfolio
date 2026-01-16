import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'dat.gui';

// Get container element
const container = document.getElementById('modelContainer');
if (!container) {
    console.error('modelContainer not found');
}

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Grid
const grid = new THREE.GridHelper(20, 40, 0x888888, 0xcccccc);
grid.position.y = 0;
scene.add(grid);

// Camera
const containerRect = container.getBoundingClientRect();
const width = containerRect.width;
const height = containerRect.height;

const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
camera.position.set(7, 7, 7);
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = true;
controls.touchZoom = true;
controls.touchRotate = true;

// Lights
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.3));
scene.add(new THREE.PointLight(0xffffff, 0.3).position.set(3, 3, 3));
scene.add(new THREE.PointLight(0xffffff, 0.3).position.set(-3, 3, -3));

// GUI
const gui = new GUI();
gui.domElement.style.width = "200px";

// Globals for meshes & sizes (so link controls can access them)
let model;
let meshNodes = [];
let meshNames = [];
let selectedMesh = null;
let baseSize = null;
let size = null;

// GLTF Loader
const loader = new GLTFLoader();

loader.load('asset/model/danpla_box.glb',
    (gltf) => {
        model = gltf.scene;
        scene.add(model);

        // collect meshes
        meshNodes = [];
        meshNames = [];
        let unnamedCount = 0;

        model.traverse((node) => {
            if (node.isMesh) {
                if (!node.material) node.material = new THREE.MeshStandardMaterial();

                if (node.material.map) {
                    node.material.color.setHex(0xffffff);
                    node.material.needsUpdate = true;
                    node.material.map.encoding = THREE.sRGBEncoding;
                    node.material.map.needsUpdate = true;
                }

                const cleanName = (node.name && node.name.trim() !== "") ? node.name : `Mesh_${++unnamedCount}`;
                meshNodes.push(node);
                meshNames.push(cleanName);

                node.userData.original = {
                    color: "#" + node.material.color.getHexString(),
                    scale: node.scale.clone(),
                    visible: node.visible
                };
            }
        });

        // bounding box
        const box = new THREE.Box3().setFromObject(model);
        baseSize = {
            min: box.min.clone(),
            max: box.max.clone(),
            length: (box.max.x - box.min.x) * 1000,
            height: (box.max.y - box.min.y) * 1000,
            width:  (box.max.z - box.min.z) * 1000
        };
        size = box.getSize(new THREE.Vector3());

        // center model
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.position.y += size.y / 2;

        // ---------- GUI: Mesh Controls ----------
        // params for selected mesh (defaults)
        /*const params = {
            meshName: meshNames[0] || "",
            color: "#ffffff",
            width: 1,
            height: 1,
            length: 1,
            visible: true,
            reset: () => resetMesh()
        };

        const folder = gui.addFolder("Mesh Controls");
        folder.open();

        // create the dropdown using the loaded meshNames
        const dropdown = folder.add(params, "meshName", meshNames).name("Select Mesh");
        let colorCtrl, widthCtrl, heightCtrl, lengthCtrl, visibleCtrl, resetCtrl;

        // Called whenever dropdown changes or initially to setup controls for the mesh
        dropdown.onChange((name) => selectMesh(name));
        selectMesh(params.meshName);

        // ---------- Linked scaling group (shared) ----------
        const linkedGroup = {
            meshes: [],   // array of mesh references
            axis: "x",    // 'x' | 'y' | 'z'
            enabled: false
        };

        // helper to apply scaling to linked meshes
        function applyLinkedScaling(axis, value) {
            if (!linkedGroup.enabled) return;
            linkedGroup.meshes.forEach(m => {
                if (!m) return;
                m.scale[axis] = value;
            });
        }

        // GUI: Link Mesh Scaling
        const linkFolder = gui.addFolder("Link Mesh Scaling");
        linkFolder.open();
        linkFolder.add(linkedGroup, "enabled").name("Enable Linking");
        linkFolder.add(linkedGroup, "axis", ["x", "y", "z"]).name("Link Axis");

        // helper actions to add/clear linked meshes
        linkFolder.add({
            addSelected: () => {
                if (!selectedMesh) {
                    console.warn("No mesh selected to link");
                    return;
                }
                if (!linkedGroup.meshes.includes(selectedMesh)) {
                    linkedGroup.meshes.push(selectedMesh);
                    console.log("Added linked mesh:", selectedMesh.name || "(unnamed)");
                }
            }
        }, "addSelected").name("➕ Add Selected Mesh");

        linkFolder.add({
            addByName: () => {
                // simple prompt for a mesh name (developer/testing convenience)
                const name = prompt("Enter mesh name to add (exact):");
                if (!name) return;
                const idx = meshNames.indexOf(name);
                if (idx === -1) {
                    alert("Mesh not found: " + name);
                    return;
                }
                const m = meshNodes[idx];
                if (!linkedGroup.meshes.includes(m)) {
                    linkedGroup.meshes.push(m);
                    console.log("Added linked mesh:", name);
                }
            }
        }, "addByName").name("➕ Add by Name");

        linkFolder.add({
            clear: () => {
                linkedGroup.meshes = [];
                console.log("Cleared linked meshes");
            }
        }, "clear").name("❌ Clear Linked Meshes");

        linkFolder.add({
            list: () => {
                console.log("Linked meshes:", linkedGroup.meshes.map(m => m.name || "(unnamed)"));
                alert("Linked meshes:\n" + linkedGroup.meshes.map(m => m.name || "(unnamed)").join("\n"));
            }
        }, "list").name("👁️ Show Linked List");
*/
        // ---------- functions used by GUI ----------
        function selectMesh(name) {
            const index = meshNames.indexOf(name);
            if (index === -1) {
                selectedMesh = null;
                return;
            }

            selectedMesh = meshNodes[index];

            // update params values from selected mesh
            params.color = "#" + selectedMesh.material.color.getHexString();
            params.width = selectedMesh.scale.x;
            params.height = selectedMesh.scale.y;
            params.length = selectedMesh.scale.z;
            params.visible = selectedMesh.visible;

            // remove previous controllers if present
            if (colorCtrl) folder.remove(colorCtrl);
            if (widthCtrl) folder.remove(widthCtrl);
            if (heightCtrl) folder.remove(heightCtrl);
            if (lengthCtrl) folder.remove(lengthCtrl);
            if (visibleCtrl) folder.remove(visibleCtrl);
            if (resetCtrl) folder.remove(resetCtrl);

            // create controllers bound to the currently selected mesh
            visibleCtrl = folder.add(params, "visible").name("Visible").onChange(v => {
                if (selectedMesh) selectedMesh.visible = v;
            });

            colorCtrl = folder.addColor(params, "color").name("Color").onChange(v => {
                if (selectedMesh) selectedMesh.material.color.set(v);
            });

            // When these controllers change we also call applyLinkedScaling so linked meshes follow
            widthCtrl = folder.add(params, "width", 0.01, 20, 0.01).name("Width (X)").onChange(v => {
                if (selectedMesh) selectedMesh.scale.x = v;
                applyLinkedScaling("x", v);
            });

            heightCtrl = folder.add(params, "height", 0.01, 20, 0.01).name("Height (Y)").onChange(v => {
                if (selectedMesh) selectedMesh.scale.y = v;
                applyLinkedScaling("y", v);
            });

            lengthCtrl = folder.add(params, "length", 0.01, 20, 0.01).name("Length (Z)").onChange(v => {
                if (selectedMesh) selectedMesh.scale.z = v;
                applyLinkedScaling("z", v);
            });

            resetCtrl = folder.add(params, "reset").name("🔄 Reset Mesh");
        }

        function resetMesh() {
            if (!selectedMesh) return;
            const o = selectedMesh.userData.original;
            selectedMesh.material.color.set(o.color);
            selectedMesh.scale.copy(o.scale);
            selectedMesh.visible = o.visible;

            // reflect values in GUI
            // if controllers exist, set their underlying values and update UI
            if (colorCtrl) { params.color = o.color; colorCtrl.setValue(params.color); }
            if (widthCtrl) { params.width = o.scale.x; widthCtrl.setValue(params.width); }
            if (heightCtrl) { params.height = o.scale.y; heightCtrl.setValue(params.height); }
            if (lengthCtrl) { params.length = o.scale.z; lengthCtrl.setValue(params.length); }
            if (visibleCtrl) { params.visible = o.visible; visibleCtrl.setValue(params.visible); }
        }

        // finished loader callback
    },
    undefined,
    (err) => {
        console.error("GLTF load error:", err);
        // Create a placeholder cube if model fails to load
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshStandardMaterial({ color: 0x4f46e5 });
        model = new THREE.Mesh(geometry, material);
        scene.add(model);
        
        const box = new THREE.Box3().setFromObject(model);
        baseSize = {
            min: box.min.clone(),
            max: box.max.clone(),
            length: (box.max.x - box.min.x) * 1000,
            height: (box.max.y - box.min.y) * 1000,
            width:  (box.max.z - box.min.z) * 1000
        };
        size = box.getSize(new THREE.Vector3());
    }
); // loader.load end


// --------------------------------------------------
// STRONG POP / BOUNCE ON LOAD
// (pop = slightly scale-up then settle + spring bounce)
// --------------------------------------------------
let bounceTime = 0;
let popping = true;

function bounceOnLoad() {
    if (!model || !size) return;

    bounceTime += 0.06;

    // Pop (scale) + Translate bounce:
    // scale: quick overshoot then settle
    const scalePop = 1 + Math.sin(bounceTime * 10) * Math.exp(-bounceTime * 1.8) * 0.25; // pop scale factor
    // translate bounce: vertical spring
    const translateBounce = Math.abs(Math.sin(bounceTime * 6)) * Math.exp(-bounceTime * 0.9) * 0.6;

    // Apply
    model.scale.set(scalePop, scalePop, scalePop);
    model.position.y = (size.y / 128) + translateBounce;

    // End condition: when the exponential decay is small
    if (bounceTime >= 2.4) {
        popping = false;
        model.scale.set(1, 1, 1);
        model.position.y = size.y / 128;
    }
}

// --------------------------------------------------
// 3D Annotations
// --------------------------------------------------
const annotationGroup = new THREE.Group();
scene.add(annotationGroup);

function makeTextLabel() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 64;
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 0.6, 1);
    sprite.canvas = canvas;
    sprite.ctx = ctx;
    sprite.texture = texture;
    sprite.setText = function(text){
        this.ctx.clearRect(0,0,256,64);
        this.ctx.fillStyle = "rgba(0,0,0,0.7)";
        this.ctx.fillRect(0,0,256,64);
        this.ctx.fillStyle = "white";
        this.ctx.font = "28px Arial";
        this.ctx.fillText(text, 10, 40);
        this.texture.needsUpdate = true;
    }
    return sprite;
}

const labelW = makeTextLabel();
const labelH = makeTextLabel();
const labelL = makeTextLabel();
annotationGroup.add(labelW, labelH, labelL);

const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
function createLine() {
    const geom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    return new THREE.Line(geom, lineMaterial);
}
const widthLine  = createLine();
const heightLine = createLine();
const lengthLine = createLine();
annotationGroup.add(widthLine, heightLine, lengthLine);

function updateAnnotations() {
    if (!model || !baseSize) return;

    const anchor = new THREE.Vector3(baseSize.min.x, baseSize.min.y, baseSize.min.z);

    lengthLine.geometry.setFromPoints([
        anchor.clone(),
        anchor.clone().add(new THREE.Vector3(baseSize.length / 1000, 0, 0))
    ]);

    heightLine.geometry.setFromPoints([
        anchor.clone(),
        anchor.clone().add(new THREE.Vector3(0, baseSize.height / 1000, 0))
    ]);

    widthLine.geometry.setFromPoints([
        anchor.clone(),
        anchor.clone().add(new THREE.Vector3(0, 0, baseSize.width / 1000))
    ]);

    labelL.setText("Length: " + Math.round(annotationParams.length) + " mm");
    labelH.setText("Height: " + Math.round(annotationParams.height) + " mm");
    labelW.setText("Width: " + Math.round(annotationParams.width) + " mm");

    labelL.position.set(anchor.x + baseSize.length / 2000, anchor.y - 0.1, anchor.z-0.5);
    labelH.position.set(anchor.x, anchor.y + baseSize.height / 1000, anchor.z-0.5);
    labelW.position.set(anchor.x-0.5, anchor.y - 0.1, anchor.z + baseSize.width / 2000);
}

const annotationParams = {
    length: baseSize ? baseSize.length : 400,
    height: baseSize ? baseSize.height : 300,
    width:  baseSize ? baseSize.width  : 300,
    visible: true
};

const annotationFolder = gui.addFolder("Annotation Controls");
annotationFolder.add(annotationParams, "length").name("Length (X)").onChange(updateAnnotations);
annotationFolder.add(annotationParams, "height").name("Height (Y)").onChange(updateAnnotations);
annotationFolder.add(annotationParams, "width").name("Width (Z)").onChange(updateAnnotations);
annotationFolder.add(annotationParams, "visible").name("Show Annotations").onChange(v => annotationGroup.visible = v);
annotationFolder.open();

// --------------------------------------------------
// MODEL + ANNOTATION RESET
// --------------------------------------------------
const resetParams = {
    resetAll: function () {
        if (!model) return;

        spinParams.spinning = false;
        for (let c of rotationFolder.__controllers) c.updateDisplay();

        model.rotation.set(0, 0, 0);

        rotationParams.rotateX = 0;
        rotationParams.rotateY = 0;

        for (let c of rotationFolder.__controllers) c.updateDisplay();

        annotationGroup.rotation.set(0, 0, 0);

        updateAnnotations();

        spinParams.spinning = true;
        for (let c of rotationFolder.__controllers) c.updateDisplay();
    }
};

const spinParams = { spinning: true };
const rotationParams = { rotateX:0, rotateY:0 };
const rotationFolder = gui.addFolder("Rotation");
rotationFolder.add(spinParams, "spinning").name("Spin Model");
rotationFolder.add(rotationParams, "rotateX", -Math.PI, Math.PI, 0.01).name("Up / Down");
rotationFolder.add(rotationParams, "rotateY", -Math.PI, Math.PI, 0.01).name("Left / Right");
rotationFolder.add(resetParams, "resetAll").name("🔄 RESET MODEL + ANNOTATION");
rotationFolder.open();

// --------------------------------------------------
// ANIMATE
// --------------------------------------------------
function animate() {
    requestAnimationFrame(animate);

    if (model) {
        if (popping) bounceOnLoad();

        model.rotation.x = rotationParams.rotateX;
        model.rotation.y = rotationParams.rotateY;

        if (spinParams.spinning) {
            annotationGroup.rotation.y += 0.005;
            model.rotation.y += 0.005;
            rotationParams.rotateY = model.rotation.y;
        }
    }

    updateAnnotations();
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize', ()=>{
    const newRect = container.getBoundingClientRect();
    const newWidth = newRect.width;
    const newHeight = newRect.height;
    
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
});
