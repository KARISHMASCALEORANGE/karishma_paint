
window.onload = () => {    //This is the key event that triggers the initial setup and loading of data:
    const canvas = document.getElementById('canvas');
    // The 2D context (ctx) provides methods to draw and manipulate shapes and images on the canvas
    const ctx = canvas.getContext('2d');  //it allows you to specify the type of canvas i.e 2D plane
    let tool = 'pencil'; // Default tool
    let color = 'black'; // Default color
    let painting = false;
    let coordinates = []; // To store the coordinates of the drawings
    let pencilSize = 5; // Default pencil size

    // Set the current tool
    window.setTool = function(newTool) {
        tool = newTool;
    }

    // Set the current color
    window.setColor = function(newColor) {
        color = newColor;
        //When you draw lines ctx.strokeStyle determines the color or style of those outlines.
        ctx.strokeStyle = color; //used to set the color to draw
    }

    // Function to update the pencil size based on slider input
    window.updatePencilSize = function() {
        const sizeInput = document.getElementById('pencilSize');
        pencilSize = sizeInput.value;
        document.getElementById('pencilSizeValue').textContent = pencilSize;
    }

    // Start painting
    canvas.addEventListener('mousedown', (e) => {     //e=mouseevent object
        // mousedown event occurs when the user presses a mouse button while the cursor is over the canvas
        painting = true; //painting variable is a flag indicating that the user is currently drawing
        //X and Y coordinates of the mouse pointer relative to the target element (in this case, the canvas).
        const { offsetX, offsetY } = e;  //destructuring assignment to extract specific properties from an object.(MouseEvent object e)
        if (tool === 'pencil') {
            ctx.beginPath(); //creating new drawings without affecting the previous ones.
            ctx.moveTo(offsetX, offsetY); //drawing at the coordinates where the mouse was clicked.
            //top-left-corner , bottom-right-corner
            ctx.lineWidth = pencilSize; // Apply the pencil size
            //This is useful for replaying or sharing the drawing later.
            coordinates.push({ tool: 'pencil', color: color, points: [{ x: offsetX, y: offsetY }] });
        } else if (tool === 'eraser') {
            ctx.clearRect(offsetX - 10, offsetY - 10, 20, 20); //Clearing a smaller rectangle like 20x20 pixels
            coordinates.push({ tool: 'eraser', points: [{ x: offsetX, y: offsetY }] });
        }
    });

    // when not in painting mode //if another changes the painter
    canvas.addEventListener('mousemove', (e) => {
        if (!painting) return;
        const { offsetX, offsetY } = e;
        if (tool === 'pencil') {
            ctx.lineTo(offsetX, offsetY);
            ctx.lineWidth = pencilSize; // Apply the pencil size
            ctx.stroke(); //draw (outline)
            coordinates[coordinates.length - 1].points.push({ x: offsetX, y: offsetY });
        } else if (tool === 'eraser') {
            ctx.clearRect(offsetX - 10, offsetY - 10, 20, 20);
            coordinates[coordinates.length - 1].points.push({ x: offsetX, y: offsetY });
        }
    });

    // Stop painting
    canvas.addEventListener('mouseup', () => {
        painting = false;
        saveCanvasToLocalStorage();
    });

    // Stop painting if the mouse leaves the canvas
    canvas.addEventListener('mouseleave', () => {
        painting = false;
    });

    // Function to generate and display the shareable link and Encoding Coordinates
    window.generateShareableLink = function() {
        //generating a link
      
        const encodedPoints = encodeURIComponent(JSON.stringify(coordinates)); //array --> json.string
        //Encodes the JSON string into a format suitable in a URL.
        const baseUrl = window.location.href.split('?')[0]; //Gets the current URL of the page  U&Splits the URL at the ? characte
        const shareableLink = `${baseUrl}?points=${encodedPoints}`;
        document.getElementById('shareableLink').value = shareableLink;
    }

    // Function to save the canvas content to a file
    window.saveCanvasToFile = async function() {
        try {
            // Open a file picker dialog for the user to choose where to save the file
            const handle = await window.showSaveFilePicker({
                types: [
                    {
                        description: 'Image Files',
                        accept: { 'image/png': ['.png'] },
                    },
                ],
            });
            //This line creates a writable stream for the file selected by the user
            const writableStream = await handle.createWritable();
    
            // Convert the canvas content to a data URL (base64 encoded string)
            const dataURL = canvas.toDataURL();
    
            // Fetch the data URL to get the Blob object containing the binary image data
            const response = await fetch(dataURL);  //Sends a network request to get the data represented by the data URL.
            const blob = await response.blob();//binary data of the image, which can be saved to a file
    
            // you use its write() method to write the Blob data to the file.
            //  This step transfers the data from your application to the file on the user's file system.
            await writableStream.write(blob);
    
            // Close the writable stream to finalize the file
            await writableStream.close();
    
            // Save the canvas content to local storage
            saveCanvasToLocalStorage();
    
            // Notify the user that the canvas has been saved successfully
            alert('Canvas saved successfully!');
        } catch (err) {
            console.error('Error saving canvas:', err);
        }
    };
    

    // Function to save the canvas content to local storage
    function saveCanvasToLocalStorage() {
        const dataURL = canvas.toDataURL(); //method convert the content of a canvas element into a data URL,
        localStorage.setItem('savedCanvas', dataURL);  //Stored the Data URL string in local storage. as key value pair
    }

    // Function to load the canvas content from local storage after reloading the page
    function loadCanvasFromLocalStorage() {
        const dataURL = localStorage.getItem('savedCanvas'); //gets the value associated with the key savedCanvas from the browser's local storage.
        if (dataURL) {
            const img = new Image(); //Image object will be used to load and hold the image data represented by the Data URL.
            img.src = dataURL; // This starts the process of loading the image data into the Image object.
            img.onload = () => { //it ensures that the image fully loaded after the next steps performs
                ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
                ctx.drawImage(img, 0, 0); // Draw the image on the canvas
            }
        }
    }

    // Function to load points data from URL
    function loadPointsFromURL() {
        const urlParams = new URLSearchParams(window.location.search); //the part of the URL after the ?
        
        const encodedPoints = urlParams.get('points');  //retrieves the value associated with the points
        if (encodedPoints) {
            coordinates = JSON.parse(decodeURIComponent(encodedPoints)); //parses the resulting JSON string into a JavaScript object
            drawStoredPoints();
        }
    }

   
    
    // Function to draw stored points on the canvas -----****
    function drawStoredPoints() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas before drawing
        coordinates.forEach(({ tool, color, points }) => {
            if (tool === 'pencil') {
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = pencilSize; // Apply the pencil size
                ctx.moveTo(points[0].x, points[0].y);  //refers to the first point in the points array
                //destructuring syntax that extracts the x and y properties from each point object.
                points.forEach(({ x, y }) => ctx.lineTo(x, y)); //adds a straight line from the current point to the coordinates 
           //draws) the path defined by the previous moveTo and lineTo calls on the canvas.    
                ctx.stroke(); //visual representation
            } else if (tool === 'eraser') {
                points.forEach(({ x, y }) => ctx.clearRect(x - 10, y - 10, 20, 20)); //20*20 px
            }
        });
    }
    
     // Clear screen
     window.clearCanvas = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        coordinates = []; // Clear the coordinates array
        localStorage.removeItem('savedCanvas'); // Remove the saved canvas from local storage
    }

    // Load points data from URL and local storage when the page loads
    loadPointsFromURL();
    loadCanvasFromLocalStorage();
}
