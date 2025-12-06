        // Slideshow functionality
        let currentSlides = {};

        // Initialize slideshows
        function initSlideshows() {
            const projectCards = document.querySelectorAll('.project-card[data-project-id]');
            projectCards.forEach(card => {
                const projectId = card.getAttribute('data-project-id');
                currentSlides[projectId] = 0;
                
                // Auto-advance slideshow every 4 seconds
                setInterval(() => {
                    changeSlide(null, projectId, 1);
                }, 4000);
            });
        }

        function changeSlide(event, projectId, direction) {
            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }
            
            const card = document.querySelector(`[data-project-id="${projectId}"]`);
            const slides = card.querySelectorAll('.project-slide');
            const indicators = card.querySelectorAll('.indicator-dot');
            
            // Remove active class from current slide
            slides[currentSlides[projectId]].classList.remove('active');
            indicators[currentSlides[projectId]].classList.remove('active');
            
            // Calculate new slide index
            currentSlides[projectId] = (currentSlides[projectId] + direction + slides.length) % slides.length;
            
            // Add active class to new slide
            slides[currentSlides[projectId]].classList.add('active');
            indicators[currentSlides[projectId]].classList.add('active');
        }

        function goToSlide(event, projectId, slideIndex) {
            event.stopPropagation();
            event.preventDefault();
            
            const card = document.querySelector(`[data-project-id="${projectId}"]`);
            const slides = card.querySelectorAll('.project-slide');
            const indicators = card.querySelectorAll('.indicator-dot');
            
            // Remove active class from current slide
            slides[currentSlides[projectId]].classList.remove('active');
            indicators[currentSlides[projectId]].classList.remove('active');
            
            // Set new slide
            currentSlides[projectId] = slideIndex;
            
            // Add active class to new slide
            slides[currentSlides[projectId]].classList.add('active');
            indicators[currentSlides[projectId]].classList.add('active');
        }

        // Initialize slideshows on page load
        document.addEventListener('DOMContentLoaded', initSlideshows);

        // Demo modal with loading functionality for systems and local videos
        const demoModal = document.getElementById('demoModal');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const iframe = document.getElementById('systemIframe');

        // Create a video element for local video files
        let videoPlayer = document.getElementById('videoPlayer');
        if (!videoPlayer) {
            videoPlayer = document.createElement('video');
            videoPlayer.id = 'videoPlayer';
            videoPlayer.className = 'w-100 rounded';
            videoPlayer.style.display = 'none';
            videoPlayer.controls = true;
            videoPlayer.autoplay = true;
            iframe.parentNode.appendChild(videoPlayer);
        }

        demoModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            let systemUrl = button.getAttribute('data-system-url');
            const projectName = button.getAttribute('data-project');
            
            // Update modal title
            const modalTitle = demoModal.querySelector('.modal-title');
            modalTitle.textContent = projectName + ' - Demo';
            
            // Show loading spinner
            loadingSpinner.classList.remove('hidden');
            
            // Check if URL is a Google Drive link
            const driveFileMatch = systemUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/);
            const isGoogleDrive = driveFileMatch !== null;
            
            if (isGoogleDrive) {
                // Handle Google Drive videos
                const fileId = driveFileMatch[1];
                // Use preview for embedding
                systemUrl = `https://drive.google.com/file/d/${fileId}/preview`;
                
                videoPlayer.style.display = 'none';
                iframe.style.display = 'block';
                
                // Set iframe attributes for better compatibility
                iframe.setAttribute('allowfullscreen', 'true');
                iframe.setAttribute('allow', 'autoplay');
                iframe.src = systemUrl;
                
                // Hide spinner after delay (Google Drive takes time to load)
                setTimeout(() => {
                    loadingSpinner.classList.add('hidden');
                }, 1500);
                
                // Also try onload
                iframe.onload = function() {
                    setTimeout(() => {
                        loadingSpinner.classList.add('hidden');
                    }, 500);
                };
                
            } else {
                // Check if URL is a local video file (mp4, webm, mov, etc.)
                const isVideoFile = /\.(mp4|webm|ogg|mov|avi)$/i.test(systemUrl);
                
                if (isVideoFile) {
                    // Handle local video files
                    iframe.style.display = 'none';
                    videoPlayer.style.display = 'block';
                    
                    videoPlayer.src = systemUrl;
                    videoPlayer.load();
                    
                    // Hide loading spinner when video loads
                    videoPlayer.onloadeddata = function() {
                        setTimeout(() => {
                            loadingSpinner.classList.add('hidden');
                            // Try autoplay
                            videoPlayer.play().catch(e => {
                                console.log('Autoplay prevented - user needs to click play');
                            });
                        }, 300);
                    };
                    
                } else {
                    // Handle system/website URLs (iframe)
                    videoPlayer.style.display = 'none';
                    iframe.style.display = 'block';
                    
                    iframe.src = systemUrl;
                    
                    // Hide loading spinner when iframe loads
                    iframe.onload = function() {
                        setTimeout(() => {
                            loadingSpinner.classList.add('hidden');
                        }, 500);
                    };
                }
            }
        });

        // Clear iframe/video and reset loading state when modal closes
        demoModal.addEventListener('hidden.bs.modal', function () {
            iframe.src = '';
            videoPlayer.src = '';
            videoPlayer.pause();
            iframe.style.display = 'block';
            videoPlayer.style.display = 'none';
            loadingSpinner.classList.remove('hidden');
        });


        // Scroll animations with stagger
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('active');
                    }, index * 50);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.scroll-animate').forEach(el => {
            observer.observe(el);
        });

        // Smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Navbar background on scroll
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
            } else {
                navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
            }
        });

// Contact Form with mailto: (Opens user's email client)
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('#contact form');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Add animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.scroll-animate').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
    
    // Form submission with mailto
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const name = form.querySelector('input[placeholder="Your Name"]').value;
        const email = form.querySelector('input[type="email"]').value;
        const subject = form.querySelector('input[placeholder="Subject"]').value;
        const message = form.querySelector('textarea').value;
        
        // Your email address (change this to your actual email)
        const yourEmail = 'your-email@example.com';
        
        // Create mailto link
        const mailtoLink = `mailto:${yourEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
            `Name: ${name}\n` +
            `Email: ${email}\n\n` +
            `Message:\n${message}`
        )}`;
        
        // Open email client
        window.location.href = mailtoLink;
        
        // Show message
        showMessage('info', 'Opening your email client...');
        
        // Reset form after short delay
        setTimeout(() => {
            form.reset();
        }, 1000);
    });
    
    // Function to show feedback messages
    function showMessage(type, text) {
        const existingMsg = document.querySelector('.form-message');
        if (existingMsg) existingMsg.remove();
        
        const messageDiv = document.createElement('div');
        const alertClass = type === 'success' ? 'success' : type === 'info' ? 'info' : 'danger';
        messageDiv.className = `form-message alert alert-${alertClass} mt-3`;
        messageDiv.style.cssText = 'animation: slideIn 0.3s ease-out;';
        messageDiv.textContent = text;
        
        if (!document.querySelector('#form-message-style')) {
            const style = document.createElement('style');
            style.id = 'form-message-style';
            style.textContent = `
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
        
        form.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => messageDiv.remove(), 300);
        }, 5000);
    }
    
    // Real-time validation
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.hasAttribute('required') && !this.value.trim()) {
                this.style.borderColor = '#dc3545';
            } else {
                this.style.borderColor = '';
            }
        });
        
        input.addEventListener('input', function() {
            if (this.style.borderColor === 'rgb(220, 53, 69)') {
                this.style.borderColor = '';
            }
        });
    });
});

/*
IMPORTANT: Change 'your-email@example.com' to your actual email address!

This method opens the user's email client (Gmail, Outlook, etc.) with the form 
data pre-filled. The user then sends the email from their own account.

For automatic email sending without user interaction, you MUST use a backend 
service or third-party API like Formspree, Web3Forms, or EmailJS.
*/

        