import * as tf from "@tensorflow/tfjs";
import { delDivChildren, renderBoxes } from "./renderBox";

/**
 * Preprocess image / frame before forwarded into the model
 * @param {HTMLVideoElement|HTMLImageElement} source
 * @param {Number} modelWidth
 * @param {Number} modelHeight
 * @returns input tensor, xRatio and yRatio
 */
const preprocess = (source, modelWidth, modelHeight) => {
    let xRatio, yRatio; // ratios for boxes

    const input = tf.tidy(() => {
        const img = tf.browser.fromPixels(source);

        // padding image to square => [n, m] to [n, n], n > m
        const [h, w] = img.shape.slice(0, 2); // get source width and height
        const maxSize = Math.max(w, h); // get max size
        const imgPadded = img.pad([
            [0, maxSize - h], // padding y [bottom only]
            [0, maxSize - w], // padding x [right only]
            [0, 0],
        ]);

        xRatio = maxSize / w; // update xRatio
        yRatio = maxSize / h; // update yRatio

        return tf.image
        .resizeBilinear(imgPadded, [modelWidth, modelHeight]) // resize frame
        .div(255.0) // normalize
        .expandDims(0); // add batch
    });

    return [input, xRatio, yRatio];
};

/**
 * Function to detect image.
 * @param {HTMLImageElement} imgSource image source
 * @param {tf.GraphModel} model loaded YOLOv5 tensorflow.js model
 * @param {Number} classThreshold class threshold
 * @param {HTMLDivElement} containerDiv div reference to render boxes
 */
export const detectImage = async (imgSource, model, classThreshold, containerDiv) => {
    const [modelWidth, modelHeight] = model.inputShape.slice(1, 3); // get model width and height

    tf.engine().startScope(); // start scoping tf engine
    const [input, xRatio, yRatio] = preprocess(imgSource, modelWidth, modelHeight);

    await model.net.executeAsync(input).then((res) => {
        const [boxes, scores, classes] = res.slice(0, 3);
        const boxes_data = boxes.dataSync();
        const scores_data = scores.dataSync();
        const classes_data = classes.dataSync();
        renderBoxes(containerDiv, classThreshold, boxes_data, scores_data, classes_data, [xRatio, yRatio]); // render boxes
        tf.dispose(res); // clear memory
    });

    tf.engine().endScope(); // end of scoping
};

/**
 * Function to detect video from every source.
 * @param {HTMLVideoElement} vidSource video source
 * @param {tf.GraphModel} model loaded YOLOv5 tensorflow.js model
 * @param {Number} classThreshold class threshold
 * @param {HTMLDivElement} containerDiv div reference to render boxes
 */
export const detectVideo = (vidSource, model, classThreshold, containerDiv, handleDetection) => {
    const [modelWidth, modelHeight] = model.inputShape.slice(1, 3); // get model width and height

    /**
     * Function to detect every frame from video
     */
    async function detectFrame() {
      
        if (vidSource.videoWidth === 0 && vidSource.srcObject === null) {
            // clean container
            delDivChildren(containerDiv);
            return; // handle if source is closed
        }

        // start scoping tf engine
        tf.engine().startScope(); 
        const [input, xRatio, yRatio] = preprocess(vidSource, modelWidth, modelHeight);

        const res = await model.net.executeAsync(input);
        
        // retrieve boxes, scores, and classes from model
        const [boxes, scores, classes] = res.slice(0, 3);
        const boxes_data    = boxes.dataSync();
        const scores_data   = scores.dataSync();
        const classes_data  = classes.dataSync();

        // retrieve boxes, score, and labels 
        const detections = renderBoxes(containerDiv, classThreshold, boxes_data, scores_data, classes_data, [xRatio, yRatio]); 

        // clear memory 
        tf.dispose(res); 

        // callback function return bounding boxes
        if (detections.length > 0) { 
            handleDetection(detections);
        }
        
        requestAnimationFrame(detectFrame); // get another frame
        tf.engine().endScope(); // end of scoping
    };

  detectFrame(); // initialize to detect every frame
};
