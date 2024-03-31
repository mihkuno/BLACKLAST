import labels from "./labels.json";

/**
 * Deletes all child <div> elements from a parent <div> element.
 * @param {HTMLDivElement} containerDiv - The parent <div> element from which child <div> elements will be deleted.
 * @returns {void}
 */
export function delDivChildren(containerDiv) {
    var children = containerDiv.children;
    Array.from(children).forEach(function(child) {
        if (child.tagName.toLowerCase() === 'div') {
            containerDiv.removeChild(child);
        }
    });
}


/**
 * Adds a new child <div> element to a parent <div> element with specified attributes.
 * @param {HTMLDivElement} containerDiv - The parent <div> element to which the new child <div> will be added.
 * @param {string} label - The inner HTML content of the new child <div>.
 * @param {number} x - The x-coordinate position of the new child <div> relative to its parent.
 * @param {number} y - The y-coordinate position of the new child <div> relative to its parent.
 * @param {number} width - The width of the new child <div>.
 * @param {number} height - The height of the new child <div>.
 * @param {string} backgroundColor - The background color of the new child <div>.
 * @param {string} borderColor - The border color of the new child <div>.
 * @returns {void}
 */
export function addDivChild(containerDiv, label, x, y, width, height, backgroundColor, borderColor) {
    var div = document.createElement('div');
    div.style.position        = 'absolute';
    div.style.left            = x + 'px';
    div.style.top             = y + 'px';
    div.style.width           = width + 'px';
    div.style.height          = height + 'px';
    div.style.backgroundColor = backgroundColor;
    div.style.color           = 'white';
    div.style.fontSize        = '14px';
    div.style.textAlign       = 'center';
    div.style.lineHeight      = height+'px';
    div.style.border          = '2px solid ' + borderColor;
    div.innerHTML             = label;
    containerDiv.appendChild(div);
}


/**
 * Render prediction boxes
 * @param {HTMLDivElement} containerDiv div tag reference
 * @param {number} classThreshold class threshold
 * @param {Array} boxes_data boxes array
 * @param {Array} scores_data scores array
 * @param {Array} classes_data class array
 * @param {Array[Number]} ratios boxes ratio [xRatio, yRatio]
 */
export const renderBoxes = (containerDiv, classThreshold, boxes_data, scores_data, classes_data, ratios) => {

    // clear previous boxes
    delDivChildren(containerDiv);

    // create colors object
    const colors = new Colors();

    // store boundingBoxes
    const boundingBoxes = [];

    // add boxes bounding boxes of the predictions to the container
    for (let i = 0; i < scores_data.length; ++i) {
        
        // filter based on class threshold
        if (scores_data[i] > classThreshold) {
        
            const name = labels[classes_data[i]];
            const color = colors.get(classes_data[i]);
            const score = (scores_data[i] * 100).toFixed(1);

            // box coordinates in the container
            let [x1, y1, x2, y2] = boxes_data.slice(i * 4, (i + 1) * 4);
            x1 *= containerDiv.clientWidth * ratios[0];
            x2 *= containerDiv.clientWidth * ratios[0];
            y1 *= containerDiv.clientHeight * ratios[1];
            y2 *= containerDiv.clientHeight * ratios[1];
            
            // box coordinates
            const width  = x2 - x1;
            const height = y2 - y1;
            const x      = x1;
            const y      = y1;
            
            // box label and prediction score
            const label  = `${name} - ${score}% `;

            // box colors
            const borderColor     = color;
            const backgroundColor = Colors.hexToRgba(color, 0.2);
            
            // add div child to the container
            addDivChild(containerDiv, label, x, y, width, height, backgroundColor, borderColor);

            // add detection to the list
            boundingBoxes.push({ name, score, x, y, width, height, color });
        }
    }
    return boundingBoxes;
};

class Colors {
    // ultralytics color palette https://ultralytics.com/
    constructor() {
        this.palette = [
        "#FF3838",
        "#FF9D97",
        "#FF701F",
        "#FFB21D",
        "#CFD231",
        "#48F90A",
        "#92CC17",
        "#3DDB86",
        "#1A9334",
        "#00D4BB",
        "#2C99A8",
        "#00C2FF",
        "#344593",
        "#6473FF",
        "#0018EC",
        "#8438FF",
        "#520085",
        "#CB38FF",
        "#FF95C8",
        "#FF37C7",
        ];
        this.n = this.palette.length;
}

    get = (i) => this.palette[Math.floor(i) % this.n];

    static hexToRgba = (hex, alpha) => {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
        ? `rgba(${[parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)].join(
            ", "
            )}, ${alpha})`
        : null;
    };
}
