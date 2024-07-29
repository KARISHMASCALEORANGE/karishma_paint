window.onload = () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
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
        ctx.strokeStyle = color; // Set the color to draw
    }

    // Function to update the pencil size based on slider input
    window.updatePencilSize = function() {
        const sizeInput = document.getElementById('pencilSize');
        pencilSize = sizeInput.value;
        document.getElementById('pencilSizeValue').textContent = pencilSize;
    }

    // Function to handle start of painting (both mouse and touch)
    function startPainting(offsetX, offsetY) {
        painting = true;
        if (tool === 'pencil') {
            ctx.beginPath(); // Begin a new path for drawing
            ctx.moveTo(offsetX, offsetY); // Move to the starting position
            ctx.lineWidth = pencilSize; // Apply the pencil size
            coordinates.push({ tool: 'pencil', color: color, points: [{ x: offsetX, y: offsetY }] });
        } else if (tool === 'eraser') {
            ctx.clearRect(offsetX - 10, offsetY - 10, 20, 20); // Clear a 20x20 area for erasing
            coordinates.push({ tool: 'eraser', points: [{ x: offsetX, y: offsetY }] });
        }
    }

    // Function to handle painting (both mouse and touch)
    function paint(offsetX, offsetY) {
        if (!painting) return;
        if (tool === 'pencil') {
            ctx.lineTo(offsetX, offsetY);
            ctx.lineWidth = pencilSize; // Apply the pencil size
            ctx.stroke(); // Draw the line
            coordinates[coordinates.length - 1].points.push({ x: offsetX, y: offsetY });
        } else if (tool === 'eraser') {
            ctx.clearRect(offsetX - 10, offsetY - 10, 20, 20);
            coordinates[coordinates.length - 1].points.push({ x: offsetX, y: offsetY });
        }
    }

    // Function to stop painting (both mouse and touch)
    function stopPainting() {
        painting = false;
        saveCanvasToLocalStorage();
    }

    // Mouse events
    canvas.addEventListener('mousedown', (e) => {
        const { offsetX, offsetY } = e;
        startPainting(offsetX, offsetY);
    });

    canvas.addEventListener('mousemove', (e) => {
        const { offsetX, offsetY } = e;
        paint(offsetX, offsetY);
    });

    canvas.addEventListener('mouseup', () => {
        stopPainting();
    });

    canvas.addEventListener('mouseleave', () => {
        stopPainting();
    });

    // Touch events
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent scrolling
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;
        startPainting(offsetX, offsetY);
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault(); // Prevent scrolling
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;
        paint(offsetX, offsetY);
    });

    canvas.addEventListener('touchend', () => {
        stopPainting();
    });

    // Function to save the canvas content to a file
    window.saveCanvasToFile = async function() {
        try {
            const handle = await window.showSaveFilePicker({
                types: [
                    {
                        description: 'Image Files',
                        accept: { 'image/png': ['.png'] },
                    },
                ],
            });
            const writableStream = await handle.createWritable();
            const dataURL = canvas.toDataURL();
            const response = await fetch(dataURL);
            const blob = await response.blob();
            await writableStream.write(blob);
            await writableStream.close();
            saveCanvasToLocalStorage();
            alert('Canvas saved successfully!');
        } catch (err) {
            console.error('Error saving canvas:', err);
        }
    };

    // Function to save the canvas content to local storage
    function saveCanvasToLocalStorage() {
        const dataURL = canvas.toDataURL();
        localStorage.setItem('savedCanvas', dataURL);
    }

    // Function to load the canvas content from local storage after reloading the page
    function loadCanvasFromLocalStorage() {
        const dataURL = localStorage.getItem('savedCanvas');
        if (dataURL) {
            const img = new Image();
            img.src = dataURL;
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            }
        }
    }

    // Function to load points data from URL
    function loadPointsFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedPoints = urlParams.get('points');
        if (encodedPoints) {
            coordinates = JSON.parse(decodeURIComponent(encodedPoints));
            drawStoredPoints();
        }
    }

    // Function to draw stored points on the canvas
    function drawStoredPoints() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas before drawing
        coordinates.forEach(({ tool, color, points }) => {
            if (tool === 'pencil') {
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = pencilSize;
                ctx.moveTo(points[0].x, points[0].y);
                points.forEach(({ x, y }) => ctx.lineTo(x, y));
                ctx.stroke();
            } else if (tool === 'eraser') {
                points.forEach(({ x, y }) => ctx.clearRect(x - 10, y - 10, 20, 20));
            }
        });
    }

    // Add the clear button functionality
    // Clear screen
    window.clearCanvas = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        coordinates = []; // Clear the coordinates array
        localStorage.removeItem('savedCanvas'); // Remove the saved canvas from local storage
    }


    // Load the canvas content from local storage
    loadCanvasFromLocalStorage();
    loadPointsFromURL();
};
