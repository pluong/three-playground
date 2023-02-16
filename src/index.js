import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

function main() {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);

        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // const canvas = document.querySelector('#c');

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 5, 0);
        controls.update();

        //--------- cube ------------------

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        // const geometry = new THREE.SphereGeometry(5, 2);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ffe0 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

    camera.position.z = 2;

        //------- line -------
        //create a blue LineBasicMaterial
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xfffff });

        const points = [];
        points.push(new THREE.Vector3(- 10, 0, 0));
        points.push(new THREE.Vector3(0, 10, 0));
        points.push(new THREE.Vector3(10, 0, 0));

        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

        const line = new THREE.Line(lineGeometry, lineMaterial);

        scene.add(line);

    camera.position.set(0, 0, 100);
    camera.lookAt(0, 0, 0);

    {
        //------------------------- earth 3d model loader

        const loader = new GLTFLoader();

        loader.load('earth/scene.gltf', function (gltf) {
            const root = gltf.scene;
            scene.add(root);
            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Group
            gltf.scenes; // Array<THREE.Group>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object
            const box = new THREE.Box3().setFromObject(root);
            const boxSize = box.getSize(new THREE.Vector3()).length();
            const boxCenter = box.getCenter(new THREE.Vector3());
            console.log(boxSize);
            console.log(boxCenter);

            // set the camera to frame the box
            frameArea(boxSize * 0.8, boxSize, boxCenter, camera);

            // update the Trackball controls to handle the new size
            controls.maxDistance = boxSize * 10;
            controls.target.copy(boxCenter);
            controls.update();
        },
            // called while loading is progressing
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function (error) {
                console.error(error);
            });
    }

    {
        const skyColor = 0xB1E1FF;  // light blue
        const groundColor = 0xB97A20;  // brownish orange
        const intensity = 0.6;
        const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
        scene.add(light);
      }
    
      {
        const color = 0xFFFFFF;
        const intensity = 0.8;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(5, 10, 2);
        scene.add(light);
        scene.add(light.target);
      }
    //-----------------------------


    function animate() {
        // cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;

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

    // pick some near and far values for the frustum that
    // will contain the box.
    camera.near = boxSize / 100;
    camera.far = boxSize * 100;

    camera.updateProjectionMatrix();

    // point the camera to look at the center of the box
    camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
}



main();