import values from './utils/values.json';
import React, { useState, useEffect, useRef } from "react";

// set backend to webgl
import "@tensorflow/tfjs-backend-webgl"; 
import * as tf from "@tensorflow/tfjs";

import Loader from "./components/loader";
import ButtonHandler from "./components/btn-handler";

import { detectImage, detectVideo } from "./utils/detect";
import "./style/App.css";

const App = () => {
    // model states
    const [loading, setLoading] = useState({ loading: true, progress: 0 }); // loading state
    const [model, setModel]     = useState({ net: null, inputShape: [1, 0, 0, 3] }); // init model & input shape
    
    // detection states
    const [detections, setDetections] = useState([]);

    // game states
    const [status, setStatus] = useState(null);
    const [count, setCount] = useState(0);
    const [stack, setStack] = useState([]);


    // references
    const imageRef     = useRef(null);
    const cameraRef    = useRef(null);
    const videoRef     = useRef(null);
    const containerRef = useRef(null);

    // model configs
    const modelName = "blackjack";
    const classThreshold = 0.67;


    useEffect(() => {
        tf.ready().then(async () => {
            
            // load model
            const yolov5 = await tf.loadGraphModel(
                `/${modelName}_web_model/model.json`,
                {
                    onProgress: (fractions) => {
                        setLoading({ loading: true, progress: fractions }); // set loading fractions
                    },
                }
            ); 

            // warming up model 
            const dummyInput = tf.ones(yolov5.inputs[0].shape);
            const warmupResult = await yolov5.executeAsync(dummyInput);
            tf.dispose(warmupResult); // cleanup memory
            tf.dispose(dummyInput); // cleanup memory

            setLoading({ loading: false, progress: 1 });
            setModel({
                net: yolov5,
                inputShape: yolov5.inputs[0].shape,
            }); // set model & input shape
        });


    }, []);

    useEffect(() => {

        // When you call state(previousValue => return newValue), React ensures that it uses the latest value 
        // at the time of the state update, avoiding any issues related to stale closures or batched updates.

        if (detections.length <= 0 || status === 'Blackjack' || status === 'Bust') {
            return;
        }
        else if (status === 'Wait') {
            setStatus(prev => 'Start');
        }

        setStack(stack => {
            // update the card stack
            detections.forEach((det) => {
                // add card if not in the stack
                if (!stack.includes(det.name)) {
                    stack.push(det.name);
                }
            });

            // map all the names to their respective values
            const map = stack.map((card) => values[card]);

            // get the sum of the card values
            const sum = map.reduce((a, b) => a + b, 0);

            // check card stack count if blackjack or not
            if (sum === 21) {
                setStatus(prev => 'Blackjack');
                setCount(prev => 0);
                stack = [];
            }
            else if (sum > 21) {
                setStatus(prev => 'Bust');
                setCount(prev => 0);
                stack = [];
            }
            else {
                setStatus(prev => 'Start');
                setCount(prev => sum);
            }

            return stack;
        });



    }, [detections]);


    return (
        <div className="App">
            
            {loading.loading && <Loader>Loading model... {(loading.progress * 100).toFixed(2)}%</Loader>}
            
            <div className="header">
                <p>Serving : <code className="code">{modelName}</code></p>
            </div>
        
            {/* display output of card stack detections */}
            { status === null && <pre>Select a media to start..</pre>}
            
            { status === 'Blackjack' && (
                <pre style={{ color: 'blue' }}>{status}</pre>
            )}
            { status === 'Bust' && (
                <pre style={{ color: 'red' }}>{status}</pre>
            )}
            
            { status === 'Start' && (
                <div style={{width: model.inputShape[1]}}>
                    <pre style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                        <span>True Count: {(count / (52 - stack.length)).toFixed(2)}</span>
                        <span>Value Count: {count}</span>
                        <span>Detect Count: {stack.length}</span>
                        <span>[{stack.toString()}]</span>
                    </pre>
                </div>
            )}
            

            {/* match the width and height of the model and the display */}
            <div ref={containerRef} className="content" width={model.inputShape[1]} height={model.inputShape[2]}>
                
                {/* 
                    WARNING: do not add children divs to the containerRef, 
                    the bounding boxes of the detections are inserted with absolute positions

                    TODO: remove containerRef argument on the functions and render bounding boxes here instead
                */}

                <img
                    src="#"
                    ref={imageRef}
                    onLoad={() => { detectImage(imageRef.current, model, classThreshold, containerRef.current, (detections) => setDetections(prev => detections) )} }
                />
                <video
                    autoPlay
                    muted
                    ref={cameraRef}
                    onPlay={() => { detectVideo(cameraRef.current, model, classThreshold, containerRef.current, (detections) => setDetections(prev => detections) );} }
                />
                <video
                    autoPlay
                    muted
                    ref={videoRef}
                    onPlay={() => { detectVideo(videoRef.current, model, classThreshold, containerRef.current, (detections) => setDetections(prev => detections) )} }
                />
            </div>

            <ButtonHandler 
                imageRef={imageRef} 
                cameraRef={cameraRef} 
                videoRef={videoRef}  
                status={status}
                reset={() => {
                    setStatus('Wait');
                    setStack([]);
                    setCount(0);
                }}
                close={() => {
                    setStatus(null);
                    setStack([]);
                    setCount(0);
                }}
                open={() => {
                    setStatus('Wait');
                    setStack([]);
                    setCount(0);
                }}
            />
        </div>
    );
};

export default App;
