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
    const themeIconContainer = document.getElementById('themeIconContainer');
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


    // --- Theme Handling ---
    const sunIconSVG = `<svg id="themeIconSun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 .07V2c0 .55.45 1 1 1s1-.45 1-1V.07c0-.55-.45-.97-1-.97s-1 .42-1 .97zm0 21.86V22c0 .55.45 1 1 1s1-.45 1-1v-2.07c0-.55-.45-.97-1-.97s-1 .42-1 .97zM5.99 4.58c-.39-.39-1.02-.39-1.41 0L3.17 6c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L6 5.99c.39-.39.39-1.02 0-1.41zm13.42 13.42c-.39-.39-1.02-.39-1.41 0l-1.41 1.41c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.41-1.41c.39-.39.39-1.02 0-1.41zM20.83 6c-.39-.39-1.02-.39-1.41 0l-1.41-1.41c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0l1.41 1.41c.39.39.39-1.02 0-1.41zM4.58 19.42c-.39-.39-1.02-.39-1.41 0L1.76 20.83c-.39.39-.39 1.02 0 1.41s1.02.39 1.41 0l1.41-1.41c.39-.39.39-1.02 0-1.41z"/></svg>`;
    const moonIconSVG = `<svg id="themeIconMoon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>`;

    function applyTheme(theme) {
        document.body.className = theme; // Applies 'light-theme' or 'dark-theme'
        localStorage.setItem('theme', theme);
        // Dynamically set the icon inside the container
        if (themeIconContainer) {
            themeIconContainer.innerHTML = theme === 'dark-theme' ? sunIconSVG : moonIconSVG;
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
         // Allow click on dropzone to trigger file input
        dropZone.addEventListener('click', (e) => {
            if (e.target.id === 'dropZone' || e.target.closest('.drop-zone p') || e.target.closest('.upload-icon')) {
                imageUpload.click();
            }
        });
    }
    if (imageUpload) imageUpload.addEventListener('change', (e) => handleFiles(e.target.files));
    if (cameraUpload) cameraUpload.addEventListener('change', (e) => handleFiles(e.target.files));

    async function handleFiles(files) {
        if (!files) return;
        for (const file of files) {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                showToast(`Unsupported file type: ${file.name}`, 'error');
                continue;
            }
            if (file.size > MAX_FILE_SIZE) {
                showToast(`File too large (max 5MB): ${file.name}`, 'error');
                continue;
            }

            let processedFileObject = file; // Keep original file object for metadata like name
            let dataURL;

            if (file.type === 'image/webp') {
                try {
                    const conversionResult = await convertWebPToImage(file, 'image/png');
                    dataURL = conversionResult.dataURL;
                    // Note: processedFileObject retains original WebP name, size. This is fine.
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
        imageUpload.value = ''; // Reset file input to allow selecting the same file again
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
                img.onerror = (e) => reject(new Error("Image could not be loaded for WebP conversion: " + e));
                img.src = event.target.result;
            };
            reader.onerror = (e) => reject(new Error("FileReader error during WebP conversion: " + e));
            reader.readAsDataURL(webpFile);
        });
    }

    // --- Image Previews & Reordering ---
    function renderPreviews() {
        if (!imagePreviewContainer) return;
        imagePreviewContainer.innerHTML = '';
        if (uploadedFiles.length === 0) {
            if (noImagesText) {
                 imagePreviewContainer.appendChild(noImagesText);
                 noImagesText.style.display = 'block';
            }
        } else {
            if (noImagesText) noImagesText.style.display = 'none';

            uploadedFiles.forEach((fileData) => {
                const item = document.createElement('div');
                item.className = 'preview-item';
                item.dataset.id = fileData.id;

                const img = document.createElement('img');
                img.src = fileData.dataURL;
                img.alt = fileData.originalName;

                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '&times;';
                removeBtn.title = 'Remove Image';
                removeBtn.onclick = (e) => {
                    e.stopPropagation(); // Prevent SortableJS interference if any
                    removeImage(fileData.id);
                };

                const fileNameSpan = document.createElement('span');
                fileNameSpan.className = 'file-name';
                const displayName = fileData.originalName.length > 18 ? fileData.originalName.substring(0,15) + '...' : fileData.originalName;
                fileNameSpan.textContent = displayName;
                fileNameSpan.title = fileData.originalName;


                item.appendChild(img);
                item.appendChild(removeBtn);
                item.appendChild(fileNameSpan);
                imagePreviewContainer.appendChild(item);
            });
        }
        if (imageCountDisplay) {
            imageCountDisplay.textContent = `(${uploadedFiles.length} image${uploadedFiles.length !== 1 ? 's' : ''})`;
        }
    }

    if (imagePreviewContainer) {
        new Sortable(imagePreviewContainer, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            draggable: '.preview-item', // Ensure only preview items are draggable
            onEnd: (evt) => {
                const newOrder = Array.from(imagePreviewContainer.children)
                                    .map(item => item.dataset.id)
                                    .filter(id => id);
                uploadedFiles.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
                // No need to re-render previews, SortableJS handles DOM. Array is now in sync.
            }
        });
    }


    function removeImage(id) {
        uploadedFiles = uploadedFiles.filter(f => f.id !== id);
        renderPreviews();
        updateUIState();
    }

    // --- UI State Management ---
    function updateUIState() {
        if (convertToPdfButton) convertToPdfButton.disabled = uploadedFiles.length === 0;
        if (downloadPdfButton) downloadPdfButton.style.display = 'none';

        if (fileNameInput) {
            if (uploadedFiles.length > 0 && !fileNameInput.value.trim()) {
                const now = new Date();
                fileNameInput.value = `photos_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.pdf`;
            } else if (uploadedFiles.length === 0) {
                fileNameInput.value = '';
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

            const options = {
                orientation: pageOrientationSelect.value,
                pageSize: pageSizeSelect.value,
                layout: imageLayoutSelect.value,
                compression: compressionLevelSelect.value,
                watermark: watermarkTextInput.value.trim(),
                pageNumbers: showPageNumbersSelect.value === 'yes',
                fileName: (fileNameInput.value.trim() || `photos_${new Date().toISOString().slice(0,16).replace(/[-T:]/g, '')}`) + '.pdf'
            };
            // Ensure .pdf extension is only added if not present
             if (!options.fileName.toLowerCase().endsWith('.pdf')) {
                options.fileName += '.pdf';
            }


            try {
                const pdf = new jsPDF({
                    orientation: options.orientation,
                    unit: 'pt',
                    format: options.pageSize
                });

                const totalImages = uploadedFiles.length;
                let imagesPerPage = 1;
                if (options.layout === 'grid2x2') imagesPerPage = 4;
                if (options.layout === 'grid3x3') imagesPerPage = 9;

                for (let i = 0; i < totalImages; i += imagesPerPage) {
                    if (i > 0) pdf.addPage(options.pageSize, options.orientation); // Ensure new page has correct settings

                    const pageImages = uploadedFiles.slice(i, i + imagesPerPage);
                    const currentProgressText = `Processing page ${Math.floor(i / imagesPerPage) + 1}...`;
                     if (progressText) progressText.textContent = currentProgressText;


                    if (options.layout === 'one') {
                        await addImageToPage(pdf, pageImages[0].dataURL, options.compression, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
                    } else {
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
                    
                    if (options.watermark) addWatermark(pdf, options.watermark);
                    if (options.pageNumbers) addPageNumber(pdf, pdf.internal.getNumberOfPages());

                    const progress = Math.min(100, Math.round(((i + pageImages.length) / totalImages) * 100));
                    if (progressBar) progressBar.style.width = `${progress}%`;
                    if (progressText && progress === 100) progressText.textContent = `Finalizing...`;
                    else if (progressText) progressText.textContent = `${progress}%`;

                }
                
                // Use `output('blob')` for better compatibility with `createObjectURL`
                const pdfBlob = pdf.output('blob');
                const pdfUrl = URL.createObjectURL(pdfBlob);

                if (downloadPdfButton) {
                    downloadPdfButton.href = pdfUrl;
                    downloadPdfButton.download = options.fileName;
                    downloadPdfButton.style.display = 'inline-flex';
                }
                showToast('PDF Generated Successfully!', 'success');
                triggerConfetti();

            } catch (error) {
                console.error("PDF Generation Error:", error);
                showToast(`Error generating PDF: ${error.message || 'Unknown error'}`, 'error');
            } finally {
                convertToPdfButton.disabled = false;
                setTimeout(() => {
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
    
                const padding = isGridCell ? 5 : 20; // Points
                const effContainerWidth = containerWidth - (isGridCell ? 2 * padding : 2 * padding); // Padding on both sides for grid cell
                const effContainerHeight = containerHeight - (isGridCell ? 2 * padding : 2 * padding); // Padding on top/bottom for grid cell

                if (effContainerWidth / aspectRatio <= effContainerHeight) {
                    imgWidth = Math.max(1, effContainerWidth); // Ensure width is at least 1
                    imgHeight = Math.max(1, imgWidth / aspectRatio);
                } else {
                    imgHeight = Math.max(1, effContainerHeight); // Ensure height is at least 1
                    imgWidth = Math.max(1, imgHeight * aspectRatio);
                }
                
                // Ensure dimensions are positive
                if (imgWidth <= 0 || imgHeight <= 0) {
                    console.warn("Calculated image dimensions are zero or negative. Skipping image.", {imgWidth, imgHeight, containerWidth, containerHeight});
                    resolve(); // Resolve to continue with other images
                    return;
                }

                const x = offsetX + (containerWidth - imgWidth) / 2;
                const y = offsetY + (containerHeight - imgHeight) / 2;
    
                let imageType = 'JPEG';
                if (imageDataUrl.startsWith('data:image/png')) {
                    imageType = 'PNG';
                }
                // WebP has already been converted to PNG or JPEG at the `handleFiles` stage.
                // The `compressionType` is for jsPDF's addImage compression option (mostly for JPEGs)
                pdf.addImage(imageDataUrl, imageType, x, y, imgWidth, imgHeight, undefined, compressionType);
                resolve();
            };
            img.onerror = (e) => {
                console.error("Image could not be loaded into Image object:", e, imageDataUrl.substring(0,100));
                reject(new Error("Failed to load image for PDF conversion"));
            }
            img.src = imageDataUrl;
        });
    }

    function addWatermark(pdf, text) {
        const FONT_SIZE_WATERMARK = 48;
        pdf.setFontSize(FONT_SIZE_WATERMARK);
        pdf.setTextColor(200, 200, 200);
        const currentOpacity = pdf.internal.gStates[pdf.internal.gStatesCurrent].opacity; // Save current opacity
        pdf.setGState(new pdf.GState({opacity: 0.3})); // Apply transparency for watermark


        const textDimensions = pdf.getTextDimensions(text, {fontSize: FONT_SIZE_WATERMARK});
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        pdf.text(text, pageWidth / 2, pageHeight / 2, { angle: -45, align: 'center', baseline: 'middle' });
        pdf.setGState(new pdf.GState({opacity: currentOpacity})); // Restore original opacity
        pdf.setTextColor(0, 0, 0); // Reset text color to black (or theme default if tracked)
    }

    function addPageNumber(pdf, pageNum) {
        const FONT_SIZE_PAGENUM = 10;
        const totalPages = pdf.internal.getNumberOfPages();
        pdf.setFontSize(FONT_SIZE_PAGENUM);
        pdf.setTextColor(100, 100, 100);
        const text = `Page ${pageNum} of ${totalPages}`;
        const textWidth = pdf.getStringUnitWidth(text) * FONT_SIZE_PAGENUM / pdf.internal.scaleFactor;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        pdf.text(text, pageWidth - textWidth - 20, pageHeight - 15);
        pdf.setTextColor(0,0,0); // Reset text color
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
                zIndex: 9999 // Ensure it's above other elements
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
    renderPreviews();
});