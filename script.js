document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const imageUpload = document.getElementById('imageUpload');
    const cameraUpload = document.getElementById('cameraUpload');
    const dropZone = document.getElementById('dropZone');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imageCountDisplay = document.getElementById('imageCount');
    const noImagesText = document.getElementById('noImagesText');

    const pageOrientationSelect = document.getElementById('pageOrientation');
    const pageSizeSelect = document.getElementById('pageSize');
    const imageLayoutSelect = document.getElementById('imageLayout');
    const compressionLevelSelect = document.getElementById('compressionLevel');
    const watermarkTextInput = document.getElementById('watermarkText');
    const showPageNumbersSelect = document.getElementById('showPageNumbers');
    const fileNameInput = document.getElementById('fileName');

    const convertToPdfButton = document.getElementById('convertToPdfButton');
    const downloadPdfButton = document.getElementById('downloadPdfButton');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    const themeToggle = document.getElementById('themeToggle');
    const themeIconContainer = document.getElementById('themeIconContainer'); // Crucial for SVG injection
    const helpButton = document.getElementById('helpButton');
    const helpModal = document.getElementById('helpModal');
    const closeHelpModal = document.getElementById('closeHelpModal');
    const toast = document.getElementById('toast');
    const confettiCanvas = document.getElementById('confettiCanvas');


    // --- Global State & Config ---
    let uploadedFiles = []; // Array of { file: File, dataURL: string, id: string, originalName: string }
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const { jsPDF } = window.jspdf;
    let confettiInstance;
    if (window.confetti) {
        confettiInstance = window.confetti.create(confettiCanvas, {
            resize: true,
            useWorker: true
        });
    }

    // --- Theme Handling (Incorporating script_js_theme_update) ---
    const sunIconSVG = `<svg id="themeIconSun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 .07V2c0 .55.45 1 1 1s1-.45 1-1V.07c0-.55-.45-.97-1-.97s-1 .42-1 .97zm0 21.86V22c0 .55.45 1 1 1s1-.45 1-1v-2.07c0-.55-.45-.97-1-.97s-1 .42-1 .97zM5.99 4.58c-.39-.39-1.02-.39-1.41 0L3.17 6c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L6 5.99c.39-.39.39-1.02 0-1.41zm13.42 13.42c-.39-.39-1.02-.39-1.41 0l-1.41 1.41c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.41-1.41c.39-.39.39-1.02 0-1.41zM20.83 6c-.39-.39-1.02-.39-1.41 0l-1.41-1.41c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0l1.41 1.41c.39.39.39-1.02 0-1.41zM4.58 19.42c-.39-.39-1.02-.39-1.41 0L1.76 20.83c-.39.39-.39 1.02 0 1.41s1.02.39 1.41 0l1.41-1.41c.39-.39.39-1.02 0-1.41z"/></svg>`;
    const moonIconSVG = `<svg id="themeIconMoon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>`;

    function applyTheme(theme) {
        document.body.className = theme; // Applies 'light-theme' or 'dark-theme'
        localStorage.setItem('theme', theme);

        // Dynamically set the SVG icon inside the container
        if (themeIconContainer) { // Check if the container element exists
            if (theme === 'dark-theme') {
                themeIconContainer.innerHTML = sunIconSVG;
                if (themeToggle) { // Update aria-label and title if themeToggle exists
                    themeToggle.setAttribute('aria-label', 'Switch to Light Mode');
                    themeToggle.setAttribute('title', 'Switch to Light Mode');
                }
            } else {
                themeIconContainer.innerHTML = moonIconSVG;
                if (themeToggle) {
                    themeToggle.setAttribute('aria-label', 'Switch to Dark Mode');
                    themeToggle.setAttribute('title', 'Switch to Dark Mode');
                }
            }
        } else if (themeToggle) {
            console.warn("themeIconContainer not found. SVG icons might not display correctly. Consider using emojis directly on the button.");
        }
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const newTheme = document.body.classList.contains('dark-theme') ? 'light-theme' : 'dark-theme';
            applyTheme(newTheme);
        });
    }

    const savedTheme = localStorage.getItem('theme') || 'light-theme'; // Default to light
    applyTheme(savedTheme);
    // --- End of Theme Handling section from script_js_theme_update ---


    // --- File Handling ---
    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });

        dropZone.addEventListener('click', (e) => {
            // If the click target is a label for 'imageUpload' or 'cameraUpload', let its default action proceed.
            if (e.target.tagName === 'LABEL' && (e.target.htmlFor === 'imageUpload' || e.target.htmlFor === 'cameraUpload')) {
                return;
            }
            // Prevent triggering file input if a button/interactive element within dropzone is clicked
            if (e.target.closest('button') || e.target.closest('select') || e.target.closest('input:not([type="file"])')) {
                return;
            }
            // For other parts of the dropZone, programmatically click the hidden 'imageUpload' input.
            if (e.target === dropZone || e.target.parentNode === dropZone || e.target.classList.contains('upload-icon') || e.target.closest('.drop-zone p')) {
                 if (imageUpload) imageUpload.click();
            }
        });
    }
    if (imageUpload) imageUpload.addEventListener('change', (e) => handleFiles(e.target.files));
    if (cameraUpload) cameraUpload.addEventListener('change', (e) => handleFiles(e.target.files));

    async function handleFiles(files) {
        if (!files || files.length === 0) return;
        for (const file of files) {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                showToast(`Unsupported file type: ${file.name}`, 'error');
                continue;
            }
            if (file.size > MAX_FILE_SIZE) {
                showToast(`File too large (max 5MB): ${file.name}`, 'error');
                continue;
            }

            let processedFileObject = file;
            let dataURL;

            if (file.type === 'image/webp') {
                try {
                    const conversionResult = await convertWebPToImage(file, 'image/png'); // Convert WebP to PNG
                    dataURL = conversionResult.dataURL;
                } catch (error) {
                    showToast(`Error converting WebP: ${file.name}`, 'error');
                    console.error("WebP Conversion Error:", error);
                    continue;
                }
            } else {
                dataURL = await readFileAsDataURL(file);
            }

            const fileId = Date.now().toString() + Math.random().toString(36).substring(2);
            uploadedFiles.push({ file: processedFileObject, dataURL, id: fileId, originalName: file.name });
        }
        // Reset file input values to allow selecting the same file(s) again if needed
        if(imageUpload) imageUpload.value = '';
        if (cameraUpload) cameraUpload.value = '';

        renderPreviews();
        updateUIState();
    }

    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function convertWebPToImage(webpFile, outputFormat = 'image/png') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const dataURL = canvas.toDataURL(outputFormat, 0.9); // 0.9 quality for PNG/JPEG
                    resolve({ dataURL });
                };
                img.onerror = (e) => reject(new Error("Image could not be loaded for WebP conversion. " + e.type));
                img.src = event.target.result;
            };
            reader.onerror = (e) => reject(new Error("FileReader error during WebP conversion. " + e.type));
            reader.readAsDataURL(webpFile);
        });
    }

    // --- Image Previews & Reordering ---
    function renderPreviews() {
        if (!imagePreviewContainer) return;
        imagePreviewContainer.innerHTML = ''; // Clear existing previews
        if (uploadedFiles.length === 0) {
            if (noImagesText) {
                 imagePreviewContainer.appendChild(noImagesText); // Add the "empty state" paragraph
                 noImagesText.style.display = 'block'; // Make it visible
            }
        } else {
            if (noImagesText) noImagesText.style.display = 'none'; // Hide if there are images

            uploadedFiles.forEach((fileData) => {
                const item = document.createElement('div');
                item.className = 'preview-item';
                item.dataset.id = fileData.id; // Use the unique ID for reordering

                const img = document.createElement('img');
                img.src = fileData.dataURL;
                img.alt = fileData.originalName;

                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '&times;'; // 'x' symbol
                removeBtn.title = 'Remove Image';
                removeBtn.onclick = (e) => {
                    e.stopPropagation(); // Prevent SortableJS interference or other parent clicks
                    removeImage(fileData.id);
                };

                const fileNameSpan = document.createElement('span');
                fileNameSpan.className = 'file-name';
                // Truncate long file names for display
                const displayName = fileData.originalName.length > 18 ? fileData.originalName.substring(0,15) + '...' : fileData.originalName;
                fileNameSpan.textContent = displayName;
                fileNameSpan.title = fileData.originalName; // Show full name on hover


                item.appendChild(img);
                item.appendChild(removeBtn);
                item.appendChild(fileNameSpan);
                imagePreviewContainer.appendChild(item);
            });
        }
        // Update the image count display
        if (imageCountDisplay) {
            imageCountDisplay.textContent = `(${uploadedFiles.length} image${uploadedFiles.length !== 1 ? 's' : ''})`;
        }
    }

    if (imagePreviewContainer) { // Ensure SortableJS is initialized only if the container exists
        new Sortable(imagePreviewContainer, {
            animation: 150, // ms, animation speed moving items when sorting, `0` — without animation
            ghostClass: 'sortable-ghost', // Class name for the drop placeholder
            chosenClass: 'sortable-chosen', // Class name for the chosen item
            draggable: '.preview-item', // Specifies which items inside the element should be draggable
            onEnd: (evt) => {
                // Reorder the uploadedFiles array based on the new DOM order
                const newOrder = Array.from(imagePreviewContainer.children)
                                    .map(item => item.dataset.id)
                                    .filter(id => id); // Filter out undefined if noImagesText was somehow included
                uploadedFiles.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
                // No need to call renderPreviews() again, SortableJS updates the DOM.
                // The uploadedFiles array is now in sync with the visual order.
            }
        });
    }


    function removeImage(id) {
        uploadedFiles = uploadedFiles.filter(f => f.id !== id);
        renderPreviews(); // Re-render to update the display
        updateUIState(); // Update button states, etc.
    }

    // --- UI State Management ---
    function updateUIState() {
        if (convertToPdfButton) convertToPdfButton.disabled = uploadedFiles.length === 0;
        if (downloadPdfButton) downloadPdfButton.style.display = 'none'; // Hide download until PDF is made

        // Set default PDF filename if images are present and filename is empty
        if (fileNameInput) {
            if (uploadedFiles.length > 0 && !fileNameInput.value.trim()) {
                const now = new Date();
                // Format: photos_YYYY-MM-DD_HH-MM
                fileNameInput.value = `photos_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
            } else if (uploadedFiles.length === 0) {
                fileNameInput.value = ''; // Clear filename if no images
            }
        }
    }

    // --- PDF Generation ---
    if (convertToPdfButton) {
        convertToPdfButton.addEventListener('click', async () => {
            if (uploadedFiles.length === 0) {
                showToast('Please upload some images first!', 'error');
                return;
            }

            convertToPdfButton.disabled = true;
            if (progressBarContainer) progressBarContainer.style.display = 'block';
            if (progressBar) progressBar.style.width = '0%';
            if (progressText) progressText.textContent = '0%';

            // Construct filename, ensuring .pdf extension
            let pdfFileName = fileNameInput.value.trim() || `photos_${new Date().toISOString().slice(0,16).replace(/[-T:]/g, '')}`;
            if (!pdfFileName.toLowerCase().endsWith('.pdf')) {
                pdfFileName += '.pdf';
            }

            const options = {
                orientation: pageOrientationSelect.value,
                pageSize: pageSizeSelect.value,
                layout: imageLayoutSelect.value,
                compression: compressionLevelSelect.value, // For jsPDF's addImage compression
                watermark: watermarkTextInput.value.trim(),
                pageNumbers: showPageNumbersSelect.value === 'yes',
                fileName: pdfFileName
            };


            try {
                const pdf = new jsPDF({
                    orientation: options.orientation,
                    unit: 'pt', // Using points for easier calculations
                    format: options.pageSize
                });

                const totalImages = uploadedFiles.length;
                let imagesPerPage = 1;
                if (options.layout === 'grid2x2') imagesPerPage = 4;
                if (options.layout === 'grid3x3') imagesPerPage = 9;

                for (let i = 0; i < totalImages; i += imagesPerPage) {
                    // Add new page for subsequent sets of images
                    if (i > 0) pdf.addPage(options.pageSize, options.orientation); // Ensure new page respects orientation & size

                    const pageImages = uploadedFiles.slice(i, i + imagesPerPage);
                    if (progressText) progressText.textContent = `Processing page ${Math.floor(i / imagesPerPage) + 1}...`;


                    if (options.layout === 'one') {
                        await addImageToPage(pdf, pageImages[0].dataURL, options.compression, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
                    } else { // Grid layout
                        const pageWidth = pdf.internal.pageSize.getWidth();
                        const pageHeight = pdf.internal.pageSize.getHeight();
                        const cols = options.layout === 'grid2x2' ? 2 : 3;
                        const rows = options.layout === 'grid2x2' ? 2 : 3; // Assuming square grid for simplicity
                        const cellWidth = pageWidth / cols;
                        const cellHeight = pageHeight / rows;

                        for (let j = 0; j < pageImages.length; j++) {
                            const row = Math.floor(j / cols);
                            const col = j % cols;
                            const x = col * cellWidth;
                            const y = row * cellHeight;
                            await addImageToPage(pdf, pageImages[j].dataURL, options.compression, cellWidth, cellHeight, x, y, true);
                        }
                    }
                    
                    // Add watermark and page number to the current page
                    if (options.watermark) addWatermark(pdf, options.watermark);
                    if (options.pageNumbers) addPageNumber(pdf, pdf.internal.getNumberOfPages());

                    // Update progress bar
                    const progress = Math.min(100, Math.round(((i + pageImages.length) / totalImages) * 100));
                    if (progressBar) progressBar.style.width = `${progress}%`;
                    if (progressText) progressText.textContent = progress === 100 ? `Finalizing...` : `${progress}%`; // Update text
                }
                
                // Generate PDF and create download link
                const pdfBlob = pdf.output('blob');
                const pdfUrl = URL.createObjectURL(pdfBlob);

                if (downloadPdfButton) {
                    downloadPdfButton.href = pdfUrl;
                    downloadPdfButton.download = options.fileName;
                    downloadPdfButton.style.display = 'inline-flex'; // Show download button
                }
                showToast('PDF Generated Successfully!', 'success');
                triggerConfetti();

            } catch (error) {
                console.error("PDF Generation Error:", error);
                showToast(`Error generating PDF: ${error.message || 'Unknown error'}`, 'error');
            } finally {
                convertToPdfButton.disabled = false; // Re-enable convert button
                setTimeout(() => { // Hide progress bar after a delay
                     if (progressBarContainer) progressBarContainer.style.display = 'none';
                }, 2000);
            }
        });
    }
    
    async function addImageToPage(pdf, imageDataUrl, compressionType, containerWidth, containerHeight, offsetX = 0, offsetY = 0, isGridCell = false) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const aspectRatio = img.width / img.height;
                let imgWidth, imgHeight;
    
                const padding = isGridCell ? 5 : 20; // Points for padding inside cell/page
                // Effective container dimensions after padding
                const effContainerWidth = containerWidth - (isGridCell ? 1.5 * padding : 2 * padding); // Adjusted padding for grid cells
                const effContainerHeight = containerHeight - (isGridCell ? 1.5 * padding : 2 * padding);


                // Check for valid dimensions before calculation
                if (effContainerWidth <=0 || effContainerHeight <=0) {
                     console.warn("Effective container dimensions for image are zero or negative. Skipping image placement.", {effContainerWidth, effContainerHeight});
                    resolve(); // Resolve to continue with other images/operations
                    return;
                }

                // Calculate image dimensions to fit container while maintaining aspect ratio
                if (effContainerWidth / aspectRatio <= effContainerHeight) { // Width is the limiting factor
                    imgWidth = effContainerWidth;
                    imgHeight = imgWidth / aspectRatio;
                } else { // Height is the limiting factor
                    imgHeight = effContainerHeight;
                    imgWidth = imgHeight * aspectRatio;
                }
                
                // Ensure calculated dimensions are positive
                if (imgWidth <= 0 || imgHeight <= 0) {
                    console.warn("Calculated image dimensions are zero or negative. Skipping image.", {imgWidth, imgHeight});
                    resolve(); // Resolve to continue
                    return;
                }

                // Center image within its allocated space (cell or page)
                const x = offsetX + (containerWidth - imgWidth) / 2;
                const y = offsetY + (containerHeight - imgHeight) / 2;
    
                // Determine image type for addImage (jsPDF supports JPEG, PNG)
                let imageType = 'JPEG'; // Default
                if (imageDataUrl.startsWith('data:image/png')) {
                    imageType = 'PNG';
                }
                // WebP has already been converted to PNG or JPEG at the `handleFiles` stage.

                pdf.addImage(imageDataUrl, imageType, x, y, imgWidth, imgHeight, undefined, compressionType);
                resolve();
            };
            img.onerror = (e) => {
                console.error("Image could not be loaded into Image object for PDF:", e, imageDataUrl.substring(0,100));
                reject(new Error("Failed to load image for PDF page.")); // Reject the promise on error
            }
            img.src = imageDataUrl;
        });
    }

    // CORRECTED addWatermark: Uses opaque light grey, no problematic GState calls.
    function addWatermark(pdf, text) {
        if (!text || text.trim() === "") return;

        const FONT_SIZE_WATERMARK = 48;
        // Save current text state
        const originalFontSize = pdf.getFontSize();
        const originalTextColorHex = pdf.getTextColor(); // Returns hex e.g., "000000"

        pdf.setFontSize(FONT_SIZE_WATERMARK);
        // Use an opaque, very light grey color for the watermark
        pdf.setTextColor(220, 220, 220); // R, G, B for very light grey

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        // Draw text
        pdf.text(text, pageWidth / 2, pageHeight / 2, { angle: -45, align: 'center', baseline: 'middle' });

        // Restore previous text settings
        pdf.setFontSize(originalFontSize);
        if (originalTextColorHex && originalTextColorHex.length === 6) {
            const r = parseInt(originalTextColorHex.substring(0, 2), 16);
            const g = parseInt(originalTextColorHex.substring(2, 4), 16);
            const b = parseInt(originalTextColorHex.substring(4, 6), 16);
            pdf.setTextColor(r, g, b);
        } else {
            pdf.setTextColor(0, 0, 0); // Default to black if previous color couldn't be parsed
        }
    }

    // CORRECTED addPageNumber: Ensures it's opaque and restores state.
    function addPageNumber(pdf, pageNum) {
        const FONT_SIZE_PAGENUM = 10;
        const totalPages = pdf.internal.getNumberOfPages(); // Get total pages for "Page X of Y"

        // Save current text state
        const originalFontSize = pdf.getFontSize();
        const originalTextColorHex = pdf.getTextColor();

        pdf.setFontSize(FONT_SIZE_PAGENUM);
        pdf.setTextColor(128, 128, 128); // Medium grey for page number (opaque)

        const text = `Page ${pageNum} of ${totalPages}`;
        // Calculate text width using current font settings in PDF
        const textWidth = pdf.getStringUnitWidth(text) * pdf.getFontSize() / pdf.internal.scaleFactor;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        pdf.text(text, pageWidth - textWidth - 20, pageHeight - 15); // Position bottom right

        // Restore previous text settings
        pdf.setFontSize(originalFontSize);
        if (originalTextColorHex && originalTextColorHex.length === 6) {
            const r = parseInt(originalTextColorHex.substring(0, 2), 16);
            const g = parseInt(originalTextColorHex.substring(2, 4), 16);
            const b = parseInt(originalTextColorHex.substring(4, 6), 16);
            pdf.setTextColor(r, g, b);
        } else {
            pdf.setTextColor(0, 0, 0); // Default to black
        }
    }


    // --- Help Modal ---
    if (helpButton && helpModal && closeHelpModal) {
        helpButton.addEventListener('click', () => helpModal.style.display = 'block');
        closeHelpModal.addEventListener('click', () => helpModal.style.display = 'none');
        window.addEventListener('click', (event) => {
            if (event.target == helpModal) {
                helpModal.style.display = 'none';
            }
        });
    }


    // --- Toast Notifications ---
    function showToast(message, type = 'info') { // type: 'info', 'success', 'error'
        if (!toast) return;
        toast.textContent = message;
        toast.className = 'toast show'; // Base classes
        if (type === 'error') toast.classList.add('error');
        else if (type === 'success') toast.classList.add('success');
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.className = 'toast'; // Remove 'show' and type-specific class
        }, 3000);
    }

    // --- Confetti ---
    function triggerConfetti() {
        if (confettiInstance) {
            confettiInstance({
                particleCount: 150,
                spread: 90,
                origin: { y: 0.6 },
                zIndex: 10000 // Ensure high z-index, above modals etc.
            });
        }
    }

    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(registration => console.log('ServiceWorker registration successful with scope: ', registration.scope))
                .catch(error => console.log('ServiceWorker registration failed: ', error));
        });
    }

    // --- Initial UI Update ---
    updateUIState();
    renderPreviews(); // Show "No images" text initially if needed
});
