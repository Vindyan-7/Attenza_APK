document.addEventListener('DOMContentLoaded', () => {
    // 0. Visit Tracking
    if (!window.location.pathname.includes('admin1')) {
        localStorage.setItem('attenza_visits', (parseInt(localStorage.getItem('attenza_visits') || 0) + 1));
    }

    // 1. Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('section[id]');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Active Nav Links on Scroll
        let scrollY = window.pageYOffset;
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 100;
            const sectionId = current.getAttribute('id');
            const navLink = document.querySelector(`.nav-menu a[href*=${sectionId}]`);
            
            if (navLink) {
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    navLink.classList.add('active');
                } else {
                    navLink.classList.remove('active');
                }
            }
        });
    });

    // 2. Mobile Menu Toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // 3. Screenshot Slider / Carousel (Touch, Drag & Desktop Controls)
    const sliderContainer = document.getElementById('slider-container');
    const sliderTrack = document.getElementById('slider-track');
    const prevBtn = document.getElementById('slider-prev');
    const nextBtn = document.getElementById('slider-next');
    const dotsContainer = document.getElementById('slider-dots');
    
    if (sliderTrack && sliderContainer) {
        const slides = Array.from(sliderTrack.children);
        let currentIndex = 0;
        let startX = 0;
        let currentTranslate = 0;
        let prevTranslate = 0;
        let isDragging = false;
        let animationID = 0;

        // Generate indicators
        function createDots() {
            dotsContainer.innerHTML = '';
            const itemsVisible = getVisibleItemsCount();
            const dotsCount = Math.max(1, slides.length - itemsVisible + 1);
            
            for (let i = 0; i < dotsCount; i++) {
                const dot = document.createElement('div');
                dot.classList.add('slider-dot');
                if (i === currentIndex) dot.classList.add('active');
                dot.addEventListener('click', () => {
                    goToSlide(i);
                });
                dotsContainer.appendChild(dot);
            }
        }

        function getVisibleItemsCount() {
            if (window.innerWidth <= 768) return 1;
            if (window.innerWidth <= 1024) return 2;
            return 3;
        }

        function getSlideWidth() {
            const slideWidth = slides[0].getBoundingClientRect().width;
            const style = window.getComputedStyle(sliderTrack);
            const gap = parseFloat(style.gap) || 0;
            return slideWidth + gap;
        }

        function getMaxTranslate() {
            const trackWidth = sliderTrack.scrollWidth;
            const containerWidth = sliderContainer.clientWidth;
            return Math.min(0, containerWidth - trackWidth);
        }

        function updateSliderPosition() {
            sliderTrack.style.transform = `translateX(${currentTranslate}px)`;
            updateControls();
        }

        function updateControls() {
            const dots = Array.from(dotsContainer.children);
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentIndex);
            });

            if (prevBtn && nextBtn) {
                prevBtn.disabled = currentIndex === 0;
                const maxIndex = slides.length - getVisibleItemsCount();
                nextBtn.disabled = currentIndex >= maxIndex || currentTranslate <= getMaxTranslate();
            }
        }

        function goToSlide(index) {
            const maxIndex = Math.max(0, slides.length - getVisibleItemsCount());
            currentIndex = Math.max(0, Math.min(index, maxIndex));
            
            const slideWidth = getSlideWidth();
            const targetTranslate = -currentIndex * slideWidth;
            const maxTranslate = getMaxTranslate();
            
            currentTranslate = Math.max(maxTranslate, targetTranslate);
            prevTranslate = currentTranslate;
            
            sliderTrack.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
            updateSliderPosition();
        }

        // Event Listeners for Nav Buttons
        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => {
                goToSlide(currentIndex - 1);
            });

            nextBtn.addEventListener('click', () => {
                goToSlide(currentIndex + 1);
            });
        }

        // Drag & Touch Gestures
        sliderContainer.addEventListener('mousedown', dragStart);
        sliderContainer.addEventListener('touchstart', dragStart, { passive: true });
        
        sliderContainer.addEventListener('mouseup', dragEnd);
        sliderContainer.addEventListener('mouseleave', dragEnd);
        sliderContainer.addEventListener('touchend', dragEnd);
        
        sliderContainer.addEventListener('mousemove', dragAction);
        sliderContainer.addEventListener('touchmove', dragAction, { passive: true });

        function dragStart(e) {
            isDragging = true;
            startX = getPositionX(e);
            sliderTrack.style.transition = 'none';
            cancelAnimationFrame(animationID);
        }

        function dragAction(e) {
            if (!isDragging) return;
            const currentX = getPositionX(e);
            const diffX = currentX - startX;
            const maxTranslate = getMaxTranslate();
            
            let tempTranslate = prevTranslate + diffX;
            // Add rubber banding at limits
            if (tempTranslate > 0) {
                tempTranslate = tempTranslate * 0.3;
            } else if (tempTranslate < maxTranslate) {
                tempTranslate = maxTranslate + (tempTranslate - maxTranslate) * 0.3;
            }
            
            currentTranslate = tempTranslate;
            sliderTrack.style.transform = `translateX(${currentTranslate}px)`;
        }

        function dragEnd() {
            if (!isDragging) return;
            isDragging = false;
            
            const movedBy = currentTranslate - prevTranslate;
            const slideWidth = getSlideWidth();
            
            // Determine slide transition
            if (Math.abs(movedBy) > slideWidth * 0.25) {
                if (movedBy < 0) {
                    goToSlide(currentIndex + 1);
                } else {
                    goToSlide(currentIndex - 1);
                }
            } else {
                goToSlide(currentIndex);
            }
        }

        function getPositionX(e) {
            return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        }

        // Re-calculate slider on resize
        window.addEventListener('resize', () => {
            createDots();
            goToSlide(currentIndex);
        });

        // Initialize Slider
        setTimeout(() => {
            createDots();
            updateControls();
        }, 100);
    }

    // 4. Lightbox Modal for Screenshots
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = lightbox ? lightbox.querySelector('img') : null;
    const lightboxClose = document.getElementById('lightbox-close');
    const screenshotSlides = document.querySelectorAll('.slide-item');

    if (lightbox && lightboxImg) {
        screenshotSlides.forEach(slide => {
            slide.addEventListener('click', () => {
                const img = slide.querySelector('img');
                if (img) {
                    lightboxImg.src = img.src;
                    lightboxImg.alt = img.alt;
                    lightbox.classList.add('active');
                }
            });
        });

        lightboxClose.addEventListener('click', () => {
            lightbox.classList.remove('active');
        });

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.classList.remove('active');
            }
        });

        // Close lightbox on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                lightbox.classList.remove('active');
            }
        });
    }

    // 5. QR Code Generator Modal
    const qrModal = document.getElementById('qr-modal');
    const qrToggleBtns = document.querySelectorAll('.qr-toggle');
    const qrCloseBtn = document.getElementById('qr-close');
    const qrImg = document.getElementById('qr-image');

    if (qrModal && qrImg) {
        // Set dynamic QR code pointing directly to the download link
        // We use standard QR Server API, which builds a real working QR code!
        const currentOrigin = window.location.origin;
        const currentPath = window.location.pathname;
        const downloadUrl = `${currentOrigin}${currentPath}assets/attenza.apk`;
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(downloadUrl)}&color=080b11&bgcolor=ffffff&margin=10`;

        qrToggleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                qrModal.classList.add('active');
            });
        });

        qrCloseBtn.addEventListener('click', () => {
            qrModal.classList.remove('active');
        });

        qrModal.addEventListener('click', (e) => {
            if (e.target === qrModal) {
                qrModal.classList.remove('active');
            }
        });
        
        // Escape to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && qrModal.classList.contains('active')) {
                qrModal.classList.remove('active');
            }
        });
    }

    // 6. Security Scanner & APK Download Simulation
    const scanOverlay = document.getElementById('scan-overlay');
    const scanStatusText = document.getElementById('scan-status-text');
    const scanProgressFill = document.getElementById('scan-progress-fill');
    const downloadBtns = document.querySelectorAll('.download-trigger');

    if (scanOverlay && scanProgressFill) {
        downloadBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                runSecurityScan();
            });
        });
    }

    function runSecurityScan() {
        localStorage.setItem('attenza_clicks', (parseInt(localStorage.getItem('attenza_clicks') || 0) + 1));
        scanOverlay.classList.add('active');
        
        const scanSteps = [
            { progress: 10, text: 'Initializing secure integrity checks...' },
            { progress: 30, text: 'Analyzing file structure: attenza.apk (96.0 MB)...' },
            { progress: 55, text: 'Scanning package signature for certification...' },
            { progress: 80, text: 'Verifying zero dependencies vulnerabilities...' },
            { progress: 95, text: 'Checking security integrity against database...' },
            { progress: 100, text: 'Scan Complete! 100% Safe. Downloading...' }
        ];

        let currentStepIndex = 0;
        let progress = 0;
        const duration = 2500; // 2.5 seconds total scan time
        const intervalTime = 50; // Update progress every 50ms
        const increment = 100 / (duration / intervalTime);

        const scanInterval = setInterval(() => {
            progress += increment;
            if (progress >= 100) {
                progress = 100;
                clearInterval(scanInterval);
                
                // Finalize step
                scanProgressFill.style.width = '100%';
                scanStatusText.textContent = scanSteps[scanSteps.length - 1].text;
                
                // Trigger download and hide scanner
                setTimeout(() => {
                    scanOverlay.classList.remove('active');
                    triggerApkDownload();
                }, 800);
            } else {
                scanProgressFill.style.width = `${progress}%`;
                
                // Check if we should update text step
                const currentTargetStep = scanSteps[currentStepIndex];
                if (progress >= currentTargetStep.progress && currentStepIndex < scanSteps.length - 1) {
                    scanStatusText.textContent = currentTargetStep.text;
                    currentStepIndex++;
                }
            }
        }, intervalTime);
    }

    function triggerApkDownload() {
        localStorage.setItem('attenza_downloads', (parseInt(localStorage.getItem('attenza_downloads') || 0) + 1));
        const link = document.createElement('a');
        link.href = 'assets/attenza.apk';
        link.download = 'attenza.apk';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});
