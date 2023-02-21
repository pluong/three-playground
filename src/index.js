import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

function main() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    // controls.target.set(0, 5, 0);
    controls.update();

    //--------- cube ------------------

    // const geometry = new THREE.BoxGeometry(1, 1, 1);
    // // const geometry = new THREE.SphereGeometry(5, 2);
    // const material = new THREE.MeshBasicMaterial({ color: 0x00ffe0 });
    // const cube = new THREE.Mesh(geometry, material);
    // scene.add(cube);

    // camera.position.z = 2;

    //------- line -------
    // //create a blue LineBasicMaterial
    // const lineMaterial = new THREE.LineBasicMaterial({ color: 0xfffff });

    // const points = [];
    // points.push(new THREE.Vector3(- 10, 0, 0));
    // points.push(new THREE.Vector3(0, 10, 0));
    // points.push(new THREE.Vector3(10, 0, 0));

    // const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

    // const line = new THREE.Line(lineGeometry, lineMaterial);

    // scene.add(line);


    const width = 1;  // ui: width
    const height = 1;  // ui: height
    const geometry = new THREE.PlaneGeometry(width, height);
    const geometry2 = new THREE.PlaneGeometry(width, height);
    geometry2.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI));

    const loader = new THREE.TextureLoader();

    const material = new THREE.MeshBasicMaterial({
        map: loader.load('art_twitter.jpg'),
    });

    const plane = new THREE.Mesh(geometry, material);
    plane.position.z = 2;

    const plane2 = new THREE.Mesh(geometry2, material);
    plane2.position.z = 2;



    camera.position.set(0, 0, 150);
    camera.lookAt(0, 0, 0);

    //------------------------- earth 3d model loader
    let model;
    {
        const loader = new GLTFLoader();

        loader.load('oceanic_currents/scene.gltf', (gltf) => {
            model = gltf.scene;
            model.add(plane);
            model.add(plane2);
            scene.add(model);
            // gltf.animations; // Array<THREE.AnimationClip>
            // gltf.scene; // THREE.Group
            // gltf.scenes; // Array<THREE.Group>
            // gltf.cameras; // Array<THREE.Camera>
            // gltf.asset; // Object
            const box = new THREE.Box3().setFromObject(model);
            const boxSize = box.getSize(new THREE.Vector3()).length();
            const boxCenter = box.getCenter(new THREE.Vector3());
            console.log('boxsize', boxSize);
            console.log('boxcenter', boxCenter);

            // set the camera to frame the box
            frameArea(boxSize * 0.8, boxSize, boxCenter, camera);

            // update the Trackball controls to handle the new size
            controls.maxDistance = boxSize * 10;
            controls.target.copy(boxCenter);
            controls.update();
        });
    }

    let shouldRotate = false;
    // renderer.domElement.addEventListener('pointerenter', rotateY);
    // renderer.domElement.addEventListener('pointerleave', rotateStop);
    window.addEventListener( 'pointermove', onPointerMove );

    function rotateY(event) {
        shouldRotate = true;
    }

    function rotateStop(event) {
        shouldRotate = false;
    }

    const raycaster = new THREE.Raycaster(camera.position, camera.Vector3, 0, 10);
    const pointer = new THREE.Vector2();

    function onPointerMove(event) {

        // calculate pointer position in normalized device coordinates
        // (-1 to +1) for both components

        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

        // console.log('pointer loc', pointer.x, pointer.y);

    }

    //--------- Lighting
    {
        // const skyColor = 0xB1E1FF;  // light blue
        // const groundColor = 0xB97A20;  // brownish orange
        // const intensity = 0.6;
        // const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
        // scene.add(light);
    }

    {
        const color = 0xFFFFFF;
        const intensity = 5;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(0, 0, 110);
        light.target.position.set(-50, -100, -110);
        scene.add(light);
        scene.add(light.target);
    }

    {
        const color = 0xFFFFFF;
        const intensity = 5;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(0, 100, 0);
        light.target.position.set(0, 0, 0);
        scene.add(light);
        scene.add(light.target);
    }
    //-----------------------------

    let yRotation = 0;
    let INTERSECTED;

    function animate() {
        // cube.rotation.x += 0.01;
        // cube.rotation.y += 0.01;
        if (model) {
            model.rotation.y += 0.01;
        }

        // update the picking ray with the camera and pointer position
        raycaster.setFromCamera(pointer, camera);

        // calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(scene.children);

        if ( intersects.length > 0 ) {
            console.log('intersected objects', intersects);
            if (intersects[0].object.geometry.type === 'PlaneGeometry') {
                INTERSECTED = intersects[0].object;
                INTERSECTED.scale.set(1.5,1.5,0);
            } else {
                if (INTERSECTED) {
                    INTERSECTED.scale.set(1,1,1);
                }
            }
        } else {
            if (INTERSECTED) {
                INTERSECTED.scale.set(1,1,1);
            }
        }

        renderer.render(scene, camera);

        requestAnimationFrame(animate);

    }


    animate();

}

function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
    const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
    const halfFovY = THREE.MathUtils.degToRad(camera.fov * .5);
    const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);

    // compute a unit vector that points in the direction the camera is now
    // from the center of the box
    const direction = (new THREE.Vector3()).subVectors(camera.position, boxCenter).normalize();

    // move the camera to a position distance units way from the center
    // in whatever direction the camera was from the center already
    camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));
    camera.position.z = camera.position.z + .7;
    camera.position.y = camera.position.y + 2;

    // pick some near and far values for the frustum that
    // will contain the box.
    camera.near = boxSize / 100;
    camera.far = boxSize * 100;

    camera.updateProjectionMatrix();

    // point the camera to look at the center of the box
    camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
}



main();