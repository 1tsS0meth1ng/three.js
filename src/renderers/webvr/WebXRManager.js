/**
 * @author mrdoob / http://mrdoob.com/
 */

import { Vector4 } from '../../math/Vector4.js';
import { ArrayCamera } from '../../cameras/ArrayCamera.js';
import { PerspectiveCamera } from '../../cameras/PerspectiveCamera.js';
import { WebGLAnimation } from '../webgl/WebGLAnimation.js';

function WebXRManager( renderer ) {

	var gl = renderer.context;
	var device = null;
	var session = null;

	var frameOfRef = null;

	var pose = null;

	function isPresenting() {

		return session !== null && frameOfRef !== null;

	}

	//

	var cameraL = new PerspectiveCamera();
	cameraL.layers.enable( 1 );
	cameraL.viewport = new Vector4();

	var cameraR = new PerspectiveCamera();
	cameraR.layers.enable( 2 );
	cameraR.viewport = new Vector4();

	var cameraVR = new ArrayCamera( [ cameraL, cameraR ] );
	cameraVR.layers.enable( 1 );
	cameraVR.layers.enable( 2 );

	//

	this.enabled = false;

	this.getDevice = function () {

		return device;

	};

	this.setDevice = function ( value ) {

		if ( value !== undefined ) device = value;

		gl.setCompatibleXRDevice( value );

	};

	//

	this.setSession = function ( value ) {

		session = value;

		if ( session !== null ) {

			session.addEventListener( 'end', function () {

				renderer.setFramebuffer( null );
				animation.stop();

			} );

			session.baseLayer = new XRWebGLLayer( session, gl );
			session.requestFrameOfReference( 'stage' ).then( function ( value ) {

				frameOfRef = value;

				renderer.setFramebuffer( session.baseLayer.framebuffer );

				animation.setContext( session );
				animation.start();

			} );

		}

	};

	this.getCamera = function ( camera ) {

		return isPresenting() ? cameraVR : camera;

	};

	this.isPresenting = isPresenting;

	// Animation Loop

	var onAnimationFrameCallback = null;

	function onAnimationFrame( time, frame ) {

		pose = frame.getDevicePose( frameOfRef );

		var layer = session.baseLayer;
		var views = frame.views;

		for ( var i = 0; i < views.length; i ++ ) {

			var view = views[ i ];
			var viewport = layer.getViewport( view );
			var viewMatrix = pose.getViewMatrix( view );

			var camera = cameraVR.cameras[ i ];
			camera.projectionMatrix.fromArray( view.projectionMatrix );
			camera.matrixWorldInverse.fromArray( viewMatrix );
			camera.matrixWorld.getInverse( camera.matrixWorldInverse );
			camera.viewport.set( viewport.x, viewport.y, viewport.width, viewport.height );

			if ( i === 0 ) {

				cameraVR.matrixWorld.copy( camera.matrixWorld );
				cameraVR.matrixWorldInverse.copy( camera.matrixWorldInverse );

				// HACK (mrdoob)
				// https://github.com/w3c/webvr/issues/203

				cameraVR.projectionMatrix.copy( camera.projectionMatrix );

			}

		}

		if ( onAnimationFrameCallback ) onAnimationFrameCallback();

	}

	var animation = new WebGLAnimation();
	animation.setAnimationLoop( onAnimationFrame );

	this.setAnimationLoop = function ( callback ) {

		onAnimationFrameCallback = callback;

	};

	// DEPRECATED

	this.getStandingMatrix = function () {

		console.warn( 'THREE.WebXRManager: getStandingMatrix() is no longer needed.' );
		return new THREE.Matrix4();

	};

	this.submitFrame = function () {};

}

export { WebXRManager };
